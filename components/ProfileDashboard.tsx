"use client";

import { useMemo } from "react";
import Link from "next/link";
import CompactRatedMovieCard from "@/components/CompactRatedMovieCard";
import { useMoviesByIds } from "@/components/hooks/useMoviesByIds";
import {
  useFavoriteCompanies,
  useFavoritePeople,
} from "@/components/PreferenceProvider";
import { useSettings } from "@/components/SettingsProvider";
import { useMovieRatings, useSavedMovies } from "@/components/SavedMoviesProvider";
import { buildGenreCountSummary, t } from "@/lib/i18n";
import TasteProfileSection from "@/components/TasteProfileSection";
import type { AppLanguage } from "@/lib/settings";

type GenreStat = {
  id: number;
  name: string;
  count: number;
  totalScore: number;
};

function StatTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <p className="text-xs font-semibold uppercase tracking-widest text-muted">
        {label}
      </p>

      <p className="mt-2 text-2xl font-bold text-foreground">{value}</p>
    </div>
  );
}

function getTasteSummary(
  language: AppLanguage,
  average: number | null
): string | null {
  if (average === null) {
    return null;
  }

  if (average >= 8) {
    return t(language, "profile", "tasteSummaryHigh");
  }

  if (average >= 6) {
    return t(language, "profile", "tasteSummaryMedium");
  }

  return t(language, "profile", "tasteSummaryLow");
}

function DashboardSkeleton() {
  return (
    <div className="mt-10">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <div
            key={index}
            className="rounded-xl border border-border bg-surface p-4"
          >
            <div className="h-3 w-20 animate-pulse rounded bg-surface-elevated" />
            <div className="mt-3 h-7 w-16 animate-pulse rounded bg-surface-elevated" />
          </div>
        ))}
      </div>

      <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {Array.from({ length: 5 }).map((_, index) => (
          <div
            key={index}
            className="overflow-hidden rounded-xl border border-border bg-surface"
          >
            <div className="aspect-[2/3] animate-pulse bg-surface-elevated" />

            <div className="space-y-2 p-3">
              <div className="h-4 animate-pulse rounded bg-surface-elevated" />
              <div className="h-3 w-2/3 animate-pulse rounded bg-surface-elevated" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ProfileDashboard() {
  const { favoriteIds, watchlistIds } = useSavedMovies();
  const { ratings, isLoaded, getMovieRating } = useMovieRatings();
  const { favoritePeople } = useFavoritePeople();
  const { favoriteCompanies } = useFavoriteCompanies();
  const { settings } = useSettings();
  const language = settings.language;

  const favoriteActorCount = useMemo(
    () => favoritePeople.filter((person) => person.role === "actor").length,
    [favoritePeople]
  );
  const favoriteDirectorCount = useMemo(
    () => favoritePeople.filter((person) => person.role === "director").length,
    [favoritePeople]
  );

  const ratedMovieIds = useMemo(
    () => Object.keys(ratings).map(Number),
    [ratings]
  );
  const ratingValues = useMemo(() => Object.values(ratings), [ratings]);

  const { movies, isLoading: isLoadingMovies, hasError } =
    useMoviesByIds(ratedMovieIds);

  const totalRated = ratingValues.length;
  const average =
    totalRated > 0
      ? ratingValues.reduce((sum, value) => sum + value, 0) / totalRated
      : null;
  const highest = totalRated > 0 ? Math.max(...ratingValues) : null;
  const lowest = totalRated > 0 ? Math.min(...ratingValues) : null;
  const tasteSummary = getTasteSummary(language, average);

  const topGenres = useMemo(() => {
    const genreStats = new Map<number, GenreStat>();

    for (const movie of movies) {
      const rating = getMovieRating(movie.id);

      if (rating === null) {
        continue;
      }

      for (const genre of movie.genres) {
        const existing = genreStats.get(genre.id);

        if (existing) {
          existing.count += 1;
          existing.totalScore += rating;
        } else {
          genreStats.set(genre.id, {
            id: genre.id,
            name: genre.name,
            count: 1,
            totalScore: rating,
          });
        }
      }
    }

    return Array.from(genreStats.values())
      .sort((a, b) => {
        if (b.totalScore !== a.totalScore) {
          return b.totalScore - a.totalScore;
        }

        return b.count - a.count;
      })
      .slice(0, 5);
  }, [movies, getMovieRating]);

  const favoriteMovies = useMemo(() => {
    return [...movies]
      .filter((movie) => getMovieRating(movie.id) !== null)
      .sort((a, b) => {
        const ratingA = getMovieRating(a.id) ?? 0;
        const ratingB = getMovieRating(b.id) ?? 0;

        if (ratingB !== ratingA) {
          return ratingB - ratingA;
        }

        return a.title.localeCompare(b.title, language === "tr" ? "tr" : "en");
      })
      .slice(0, 5);
  }, [movies, getMovieRating, language]);

  if (!isLoaded) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="mt-10">
      <section>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <StatTile
            label={t(language, "profile", "favoriteMovies")}
            value={favoriteIds.length.toString()}
          />
          <StatTile
            label={t(language, "profile", "watchlistMovies")}
            value={watchlistIds.length.toString()}
          />
          <StatTile
            label={t(language, "profile", "ratedMovies")}
            value={totalRated.toString()}
          />
          <StatTile
            label={t(language, "ratings", "averageRating")}
            value={average !== null ? `${average.toFixed(1)} / 10` : "-"}
          />
          <StatTile
            label={t(language, "profile", "highestRating")}
            value={highest !== null ? `${highest} / 10` : "-"}
          />
          <StatTile
            label={t(language, "profile", "lowestRating")}
            value={lowest !== null ? `${lowest} / 10` : "-"}
          />
        </div>
      </section>

      <section className="mt-8 rounded-xl border border-border bg-surface p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap gap-x-8 gap-y-2 text-sm text-muted">
            <span>
              <span className="font-semibold text-foreground">
                {favoriteActorCount}
              </span>{" "}
              {t(language, "profile", "favoriteActorsSuffix")}
            </span>

            <span>
              <span className="font-semibold text-foreground">
                {favoriteDirectorCount}
              </span>{" "}
              {t(language, "profile", "favoriteDirectorsSuffix")}
            </span>

            <span>
              <span className="font-semibold text-foreground">
                {favoriteCompanies.length}
              </span>{" "}
              {t(language, "profile", "favoriteStudiosSuffix")}
            </span>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/for-you"
              className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground transition hover:bg-accent-hover"
            >
              {t(language, "profile", "personalRecommendationsCta")}
            </Link>

            <Link
              href="/preferences"
              className="rounded-lg border border-accent/60 px-4 py-2 text-sm font-semibold text-accent transition hover:bg-accent/10"
            >
              {t(language, "profile", "editPreferencesCta")}
            </Link>

            <Link
              href="/settings"
              className="rounded-lg border border-border px-4 py-2 text-sm font-semibold text-foreground transition hover:border-accent hover:text-accent"
            >
              {t(language, "profile", "settingsCta")}
            </Link>
          </div>
        </div>
      </section>

      <TasteProfileSection />

      {tasteSummary && (
        <section className="mt-8 rounded-xl border border-accent/20 bg-accent/5 p-5">
          <p className="text-sm font-semibold uppercase tracking-widest text-accent">
            {t(language, "profile", "ratingTrendHeading")}
          </p>

          <p className="mt-2 text-foreground">{tasteSummary}</p>
        </section>
      )}

      {totalRated === 0 ? (
        <div className="mt-10 rounded-2xl border border-dashed border-border-strong bg-surface p-10 text-center">
          <h2 className="text-xl font-semibold">
            {t(language, "profile", "emptyTasteTitle")}
          </h2>

          <p className="mt-3 text-muted">
            {t(language, "profile", "emptyTasteDescription")}
          </p>

          <div className="mt-6 flex flex-wrap justify-center gap-4">
            <Link
              href="/"
              className="rounded-lg bg-accent px-5 py-3 font-semibold text-accent-foreground transition hover:bg-accent-hover"
            >
              {t(language, "common", "exploreMovies")}
            </Link>

            <Link
              href="/ratings"
              className="rounded-lg border border-border px-5 py-3 font-semibold text-foreground transition hover:border-accent hover:text-accent"
            >
              {t(language, "profile", "goToRatingsCta")}
            </Link>
          </div>
        </div>
      ) : isLoadingMovies ? (
        <DashboardSkeleton />
      ) : hasError ? (
        <div className="mt-10 rounded-2xl border border-danger/40 bg-danger/10 p-10 text-center">
          <h2 className="text-xl font-semibold text-danger">
            {t(language, "ratings", "movieInfoErrorTitle")}
          </h2>

          <p className="mt-3 text-muted">
            {t(language, "common", "loadErrorDescription")}
          </p>
        </div>
      ) : (
        <>
          <section className="mt-10">
            <h2 className="text-xl font-semibold">
              {t(language, "profile", "topGenresHeading")}
            </h2>

            {topGenres.length > 0 ? (
              <ul className="mt-4 space-y-2">
                {topGenres.map((genre) => (
                  <li
                    key={genre.id}
                    className="flex items-center justify-between rounded-lg border border-border bg-surface px-4 py-3"
                  >
                    <span className="font-semibold text-foreground">
                      {genre.name}
                    </span>

                    <span className="text-sm text-muted">
                      {buildGenreCountSummary(
                        language,
                        genre.count,
                        genre.totalScore / genre.count
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-4 text-muted">
                {t(language, "profile", "topGenresEmptyText")}
              </p>
            )}
          </section>

          <section className="mt-10">
            <h2 className="text-xl font-semibold">
              {t(language, "profile", "favoriteMoviesHeading")}
            </h2>

            {favoriteMovies.length > 0 ? (
              <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                {favoriteMovies.map((movie) => (
                  <CompactRatedMovieCard
                    key={movie.id}
                    movie={movie}
                    userRating={getMovieRating(movie.id) ?? 0}
                  />
                ))}
              </div>
            ) : (
              <p className="mt-4 text-muted">
                {t(language, "profile", "favoriteMoviesEmptyText")}
              </p>
            )}
          </section>
        </>
      )}
    </div>
  );
}
