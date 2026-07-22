"use client";

import { useEffect, useMemo, useState } from "react";
import { useMoviesByIds } from "@/components/hooks/useMoviesByIds";
import { useTasteProfile } from "@/components/hooks/useTasteProfile";
import {
  useFavoriteCompanies,
  useFavoritePeople,
} from "@/components/PreferenceProvider";
import {
  useMovieRatings,
  useSavedMovies,
  useWatchStatuses,
} from "@/components/SavedMoviesProvider";
import { buildMovieDnaProfile, MOVIE_DNA_SIGNALS } from "@/lib/movieDna";
import {
  rankRecommendationCandidates,
  type RecommendationCandidate,
  type RecommendationMovie,
} from "@/lib/recommendationEngine";
import type { TasteProfile, WeightedPreference } from "@/lib/tasteProfile";
import type { MovieDetails } from "@/lib/tmdb";

// v1: sonuç sayısı ve aday havuzu için güvenli sınırlar — bkz. görev
// raporu "Performans ölçümü" bölümü.
const MAX_RESULTS = 12;
const MAX_GENRE_FILTER_IDS = 3;
const MAX_KEYWORD_FILTER_IDS = 3;
const MAX_DETAIL_FETCH_CANDIDATES = 40;

export type UseRecommendationsResult = {
  recommendations: RecommendationCandidate[];
  tasteProfile: TasteProfile | null;
  isLoading: boolean;
  hasError: boolean;
};

// Yalnızca /^\d+$/ biçimindeki anahtarlar geçerli bir film id'si sayılır —
// SavedMoviesProvider'ın toMovieRecord/toMovieIds dönüşümü zaten yalnızca
// movie-tipi, düz sayısal-string kayıtlar üretir; bu ek bir savunma
// katmanıdır (bkz. lib/tasteProfile.ts'teki aynı desen).
function parseValidMovieId(key: string): number | null {
  if (!/^\d+$/.test(key)) {
    return null;
  }

  const id = Number(key);

  return Number.isInteger(id) && id > 0 ? id : null;
}

/**
 * Kullanıcının zaten etkileşime girdiği (puanlanan, watched/watching/
 * dropped/plan-to-watch, favori, watchlist) tüm film id'lerini tek,
 * tekrarsız bir listede toplar. Saf bir fonksiyondur.
 */
export function buildExcludedMovieIds(
  ratings: Record<string, number>,
  watchStatuses: Record<string, string>,
  favoriteIds: number[],
  watchlistIds: number[]
): number[] {
  const excluded = new Set<number>();

  for (const key of Object.keys(ratings)) {
    const id = parseValidMovieId(key);

    if (id !== null) {
      excluded.add(id);
    }
  }

  for (const key of Object.keys(watchStatuses)) {
    const id = parseValidMovieId(key);

    if (id !== null) {
      excluded.add(id);
    }
  }

  for (const id of favoriteIds) {
    if (Number.isInteger(id) && id > 0) {
      excluded.add(id);
    }
  }

  for (const id of watchlistIds) {
    if (Number.isInteger(id) && id > 0) {
      excluded.add(id);
    }
  }

  return Array.from(excluded);
}

// TasteProfile'dan TMDB discover'a gönderilecek kompakt filtreleri üretir.
// Yalnızca en güçlü birkaç sinyal seçilir — her explicit favori için ayrı
// sorgu açıp N+1 oluşturulmaz (bkz. görev talimatı).
export type RecommendationFilters = {
  genreIds: number[];
  keywordIds: number[];
  actorId?: number;
  directorId?: number;
  companyId?: number;
};

function getTopPositiveIds(
  preferences: WeightedPreference[],
  maxCount: number
): number[] {
  return preferences
    .filter((preference) => preference.score > 0)
    .slice(0, maxCount)
    .map((preference) => Number(preference.id));
}

function getTopDnaKeywordIds(
  dnaPreferences: WeightedPreference[],
  maxCount: number
): number[] {
  const signalById = new Map(MOVIE_DNA_SIGNALS.map((signal) => [signal.id, signal]));
  const keywordIds: number[] = [];

  for (const preference of dnaPreferences) {
    if (preference.score <= 0 || keywordIds.length >= maxCount) {
      continue;
    }

    const signal = signalById.get(preference.id);

    if (signal && signal.keywordIds.length > 0) {
      keywordIds.push(signal.keywordIds[0]);
    }
  }

  return keywordIds;
}

export function buildRecommendationFilters(
  tasteProfile: TasteProfile
): RecommendationFilters {
  return {
    genreIds: getTopPositiveIds(tasteProfile.genrePreferences, MAX_GENRE_FILTER_IDS),
    keywordIds: getTopDnaKeywordIds(tasteProfile.dnaPreferences, MAX_KEYWORD_FILTER_IDS),
    actorId: tasteProfile.explicitFavoriteActorIds[0],
    directorId: tasteProfile.explicitFavoriteDirectorIds[0],
    companyId: tasteProfile.explicitFavoriteCompanyIds[0],
  };
}

export function toRecommendationMovie(movie: MovieDetails): RecommendationMovie {
  const genreIds = movie.genres.map((genre) => genre.id);
  const keywordIds = (movie.keywords?.keywords ?? []).map((keyword) => keyword.id);
  const castIds = movie.credits.cast.slice(0, 10).map((member) => member.id);
  const directorIds = movie.credits.crew
    .filter((member) => member.job === "Director")
    .map((member) => member.id);
  const companyIds = movie.production_companies.map((company) => company.id);

  return {
    id: movie.id,
    title: movie.title,
    originalTitle: movie.original_title,
    overview: movie.overview,
    posterPath: movie.poster_path,
    backdropPath: movie.backdrop_path,
    releaseDate: movie.release_date,
    originalLanguage: movie.original_language,
    genreIds,
    runtime: movie.runtime,
    voteAverage: movie.vote_average,
    voteCount: movie.vote_count,
    popularity: movie.popularity,
    castIds,
    directorIds,
    companyIds,
    originCountryCodes: movie.origin_country ?? [],
    dnaProfile: buildMovieDnaProfile({ movieId: movie.id, genreIds, keywordIds }),
  };
}

/**
 * /for-you sayfası için uçtan uca akışı yönetir: TasteProfile'ı okur
 * (useTasteProfile), kompakt filtreleri sunucudaki /api/recommendations
 * uç noktasına gönderip bir aday id havuzu alır, zaten etkileşilen
 * filmleri erkenden eler, kalan adayların detaylarını (mevcut
 * useMoviesByIds — sınırlı eşzamanlılıkla) getirir ve saf
 * rankRecommendationCandidates ile ilk 12 öneriyi üretir.
 */
export function useRecommendations(): UseRecommendationsResult {
  const { profile: tasteProfile, isLoading: profileLoading } = useTasteProfile();
  const { favoriteIds, watchlistIds } = useSavedMovies();
  const { ratings } = useMovieRatings();
  const { statuses } = useWatchStatuses();
  const { favoritePeople } = useFavoritePeople();
  const { favoriteCompanies } = useFavoriteCompanies();

  const excludedMovieIds = useMemo(
    () => buildExcludedMovieIds(ratings, statuses, favoriteIds, watchlistIds),
    [ratings, statuses, favoriteIds, watchlistIds]
  );

  const filters = useMemo(
    () => (tasteProfile ? buildRecommendationFilters(tasteProfile) : null),
    [tasteProfile]
  );

  const [candidateIds, setCandidateIds] = useState<number[] | null>(null);
  const [poolError, setPoolError] = useState(false);

  useEffect(() => {
    if (!filters) {
      return;
    }

    const activeFilters = filters;
    const controller = new AbortController();

    async function loadCandidatePool() {
      const params = new URLSearchParams();

      if (activeFilters.genreIds.length > 0) {
        params.set("genreIds", activeFilters.genreIds.join(","));
      }

      if (activeFilters.keywordIds.length > 0) {
        params.set("keywordIds", activeFilters.keywordIds.join(","));
      }

      if (activeFilters.actorId !== undefined) {
        params.set("actorId", String(activeFilters.actorId));
      }

      if (activeFilters.directorId !== undefined) {
        params.set("directorId", String(activeFilters.directorId));
      }

      if (activeFilters.companyId !== undefined) {
        params.set("companyId", String(activeFilters.companyId));
      }

      try {
        const response = await fetch(
          `/api/recommendations?${params.toString()}`,
          { signal: controller.signal, cache: "no-store" }
        );

        if (controller.signal.aborted) {
          return;
        }

        if (!response.ok) {
          setPoolError(true);
          setCandidateIds([]);
          return;
        }

        const data: { candidateIds: number[] } = await response.json();

        setPoolError(false);
        setCandidateIds(data.candidateIds ?? []);
      } catch {
        if (!controller.signal.aborted) {
          setPoolError(true);
          setCandidateIds([]);
        }
      }
    }

    loadCandidatePool();

    return () => {
      controller.abort();
    };
  }, [filters]);

  const excludedSet = useMemo(() => new Set(excludedMovieIds), [excludedMovieIds]);

  const detailFetchIds = useMemo(() => {
    if (!candidateIds) {
      return [];
    }

    return candidateIds
      .filter((id) => !excludedSet.has(id))
      .slice(0, MAX_DETAIL_FETCH_CANDIDATES);
  }, [candidateIds, excludedSet]);

  const {
    movies,
    isLoading: moviesLoading,
    hasError: moviesHasError,
  } = useMoviesByIds(detailFetchIds, { mode: "dna" });

  const recommendations = useMemo(() => {
    if (!tasteProfile || candidateIds === null || moviesLoading) {
      return [];
    }

    const candidates = movies.map(toRecommendationMovie);

    const personNames: Record<number, string> = {};
    const companyNames: Record<number, string> = {};

    for (const person of favoritePeople) {
      personNames[person.id] = person.name;
    }

    for (const company of favoriteCompanies) {
      companyNames[company.id] = company.name;
    }

    for (const movie of movies) {
      for (const castMember of movie.credits.cast.slice(0, 10)) {
        personNames[castMember.id] ??= castMember.name;
      }

      for (const crewMember of movie.credits.crew) {
        if (crewMember.job === "Director") {
          personNames[crewMember.id] ??= crewMember.name;
        }
      }

      for (const company of movie.production_companies) {
        companyNames[company.id] ??= company.name;
      }
    }

    return rankRecommendationCandidates({
      tasteProfile,
      candidates,
      excludedMovieIds,
      personNames,
      companyNames,
    }).slice(0, MAX_RESULTS);
  }, [
    tasteProfile,
    candidateIds,
    moviesLoading,
    movies,
    favoritePeople,
    favoriteCompanies,
    excludedMovieIds,
  ]);

  const isLoading =
    profileLoading || (filters !== null && candidateIds === null) || moviesLoading;

  return {
    recommendations,
    tasteProfile,
    isLoading,
    hasError: poolError || moviesHasError,
  };
}
