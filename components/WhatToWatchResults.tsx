"use client";

import Link from "next/link";
import { useMemo } from "react";
import MovieCard from "@/components/MovieCard";
import { useMoviesByIds } from "@/components/hooks/useMoviesByIds";
import { toRecommendationMovie } from "@/components/hooks/useRecommendations";
import { useSettings } from "@/components/SettingsProvider";
import { useTasteProfile } from "@/components/hooks/useTasteProfile";
import { t } from "@/lib/i18n";
import { getPosterUrl, type TmdbMovie } from "@/lib/tmdb";
import {
  hasAnyTasteProfileSignal,
  rankWhatToWatchCandidates,
} from "@/lib/whatToWatchPersonalization";

// Gösterilen kart sayısı — kişiselleştirme öncesiyle aynı (mevcut davranış
// korunur). `movies` prop'u bundan daha büyük bir aday havuzu taşıyabilir
// (bkz. app/what-to-watch/page.tsx) — kişiselleştirme bu havuz içinde
// yeniden sıralama yapıp yalnızca ilk DISPLAY_LIMIT'i gösterir.
const DISPLAY_LIMIT = 12;

type WhatToWatchResultsProps = {
  movies: TmdbMovie[];
  description: string;
  selectedMood: string;
  selectedGenreId: number | null;
  selectedRuntime: string;
  selectedIntensity: string;
  selectedCompany: string;
  selectedDiscovery: string;
};

type DisplayMovie = {
  id: number;
  title: string;
  year: string;
  rating: number;
  voteCount: number;
  overview: string;
  posterUrl: string | null;
};

function tmdbMovieToDisplay(movie: TmdbMovie): DisplayMovie {
  return {
    id: movie.id,
    title: movie.title,
    year: movie.release_date?.slice(0, 4) ?? "",
    rating: movie.vote_average,
    voteCount: movie.vote_count,
    overview: movie.overview,
    posterUrl: getPosterUrl(movie.poster_path),
  };
}

export default function WhatToWatchResults({
  movies,
  description,
  selectedMood,
  selectedGenreId,
  selectedRuntime,
  selectedIntensity,
  selectedCompany,
  selectedDiscovery,
}: WhatToWatchResultsProps) {
  const { settings } = useSettings();
  const language = settings.language;

  // Sunucudan gelen sıra (mood/company/discovery'ye göre zaten doğru) — ilk
  // render (SSR + hydration öncesi ilk client render) DAİMA bu sırayla
  // eşleşir, hydration mismatch riski olmaz.
  const baseDisplayMovies = useMemo(
    () => movies.slice(0, DISPLAY_LIMIT).map(tmdbMovieToDisplay),
    [movies]
  );

  const { profile: tasteProfile, isLoading: profileLoading } =
    useTasteProfile();

  const movieIds = useMemo(() => movies.map((movie) => movie.id), [movies]);
  const { movies: detailedMovies, isLoading: detailsLoading } =
    useMoviesByIds(movieIds);

  const { displayMovies, personalizationApplied } = useMemo(() => {
    if (
      profileLoading ||
      detailsLoading ||
      !tasteProfile ||
      detailedMovies.length === 0 ||
      !hasAnyTasteProfileSignal(tasteProfile)
    ) {
      return {
        displayMovies: baseDisplayMovies,
        personalizationApplied: false,
      };
    }

    const candidates = detailedMovies.map((movie) => toRecommendationMovie(movie));

    const ranked = rankWhatToWatchCandidates({
      candidates,
      tasteProfile,
      selectedMood,
      selectedGenreId,
      selectedRuntime,
      selectedIntensity,
      selectedCompany,
      selectedDiscovery,
    });

    const rankedIds = new Set(ranked.map((candidate) => candidate.movie.id));

    // detailedMovies, movies'in bir ALT kümesi olabilir (kısmi fetch hatası
    // — bkz. useMoviesByIds hasError/failedMovieIds). Detayı gelmeyen
    // adaylar sessizce atlanır, sonuç asla çökmez; eksik kalan yerler
    // orijinal (personalize edilmemiş) sıradaki karşılıklarıyla doldurulur.
    const fallbackForMissing = movies
      .filter((movie) => !rankedIds.has(movie.id))
      .map(tmdbMovieToDisplay);

    const personalized = ranked
      .map((candidate) => ({
        id: candidate.movie.id,
        title: candidate.movie.title,
        year: candidate.movie.releaseDate?.slice(0, 4) ?? "",
        rating: candidate.movie.voteAverage,
        voteCount: candidate.movie.voteCount,
        overview: candidate.movie.overview,
        posterUrl: getPosterUrl(candidate.movie.posterPath),
      }))
      .concat(fallbackForMissing)
      .slice(0, DISPLAY_LIMIT);

    return { displayMovies: personalized, personalizationApplied: true };
  }, [
    profileLoading,
    detailsLoading,
    tasteProfile,
    detailedMovies,
    movies,
    baseDisplayMovies,
    selectedMood,
    selectedGenreId,
    selectedRuntime,
    selectedIntensity,
    selectedCompany,
    selectedDiscovery,
  ]);

  const personalizationNote = !personalizationApplied
    ? null
    : tasteProfile?.confidence === "low"
      ? t(language, "whatToWatch", "personalizationLow")
      : t(language, "whatToWatch", "personalizationApplied");

  return (
    <section className="mt-12">
      <div className="mb-7 rounded-xl border border-accent/20 bg-accent/5 p-4">
        <p className="text-sm font-semibold text-accent">
          {t(language, "whatToWatch", "resultsEyebrow")}
        </p>

        <p className="mt-1 text-sm text-foreground">{description}</p>

        {personalizationNote && (
          <p className="mt-2 text-xs text-muted">{personalizationNote}</p>
        )}
      </div>

      {displayMovies.length > 0 ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {displayMovies.map((movie) => (
            <MovieCard
              key={movie.id}
              id={movie.id}
              title={movie.title}
              year={movie.year}
              rating={movie.rating}
              voteCount={movie.voteCount}
              overview={movie.overview}
              posterUrl={movie.posterUrl}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-border-strong bg-surface p-10 text-center">
          <h3 className="text-xl font-semibold">
            {t(language, "whatToWatch", "noResultsTitle")}
          </h3>

          <p className="mt-3 text-muted">
            {t(language, "whatToWatch", "noResultsDescription")}
          </p>

          <Link
            href="/what-to-watch"
            className="mt-6 inline-block rounded-lg bg-accent px-5 py-3 font-semibold text-accent-foreground transition hover:bg-accent-hover"
          >
            {t(language, "whatToWatch", "resetFormCta")}
          </Link>
        </div>
      )}
    </section>
  );
}
