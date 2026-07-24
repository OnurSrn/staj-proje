"use client";

import { useEffect, useState } from "react";
import { RECOMMENDATION_LIMITS } from "@/lib/recommendationConfig";
import type { MovieDetails } from "@/lib/tmdb";

type UseMoviesByIdsResult = {
  movies: MovieDetails[];
  isLoading: boolean;
  hasError: boolean;
  failedMovieIds: number[];
};

// mode "dna": /api/movies/[id]?mode=dna — yalnızca For You/DNA akışının
// kullandığı hafif alan setini çeker (bkz. lib/tmdb.ts getMovieDnaDetails).
// Belirtilmezse mevcut tam detay davranışı (geriye dönük uyumlu) korunur.
type UseMoviesByIdsOptions = {
  mode?: "dna";
};

type FetchOutcome =
  | { movieId: number; movie: MovieDetails; failed: false }
  | { movieId: number; movie: null; failed: true };

type CompletedFetch = {
  key: string;
  movies: MovieDetails[];
  failedMovieIds: number[];
};

const EMPTY_COMPLETED: CompletedFetch = {
  key: "",
  movies: [],
  failedMovieIds: [],
};

// lib/collectionEngine.ts'teki KEYWORD_FETCH_CONCURRENCY ile aynı mantık:
// aynı anda en fazla bu kadar /api/movies/[id] isteği uçuşsun — büyük id
// listelerinde (ör. taste profile'ın 50 filme kadar çıkabilen girdisi)
// kontrolsüz paralel istek patlaması oluşmasın. Artık
// lib/recommendationConfig.ts RECOMMENDATION_LIMITS'ten (merkezi config),
// değer DEĞİŞMEDİ.
const MOVIE_FETCH_CONCURRENCY = RECOMMENDATION_LIMITS.movieFetchConcurrency;

async function fetchMovie(
  movieId: number,
  mode: "dna" | undefined,
  signal: AbortSignal
): Promise<FetchOutcome> {
  try {
    const query = mode ? `?mode=${mode}` : "";
    const response = await fetch(`/api/movies/${movieId}${query}`, {
      cache: "no-store",
      signal,
    });

    if (!response.ok) {
      return { movieId, movie: null, failed: true };
    }

    const movie: MovieDetails = await response.json();

    return { movieId, movie, failed: false };
  } catch {
    return { movieId, movie: null, failed: true };
  }
}

export function useMoviesByIds(
  movieIds: number[],
  options: UseMoviesByIdsOptions = {}
): UseMoviesByIdsResult {
  const { mode } = options;
  const idsKey = Array.from(new Set(movieIds)).join(",");
  // mode'u anahtara katmak, aynı id listesinin farklı modlarla ardışık
  // çağrılması durumunda (bu hook'un birden çok çağıranı arasında) yanlış
  // moddan kalma bir sonucun gösterilmesini engeller.
  const cacheKey = mode ? `${mode}:${idsKey}` : idsKey;

  const [completed, setCompleted] = useState<CompletedFetch>(EMPTY_COMPLETED);

  useEffect(() => {
    if (idsKey === "") {
      return;
    }

    const uniqueIds = idsKey.split(",").map((id) => Number(id));
    const controller = new AbortController();

    async function loadMovies() {
      const outcomes: FetchOutcome[] = new Array(uniqueIds.length);
      let cursor = 0;

      async function worker() {
        while (cursor < uniqueIds.length) {
          const index = cursor;

          cursor += 1;
          outcomes[index] = await fetchMovie(
            uniqueIds[index],
            mode,
            controller.signal
          );
        }
      }

      const workerCount = Math.min(MOVIE_FETCH_CONCURRENCY, uniqueIds.length);

      await Promise.all(Array.from({ length: workerCount }, () => worker()));

      if (controller.signal.aborted) {
        return;
      }

      const movies = outcomes
        .filter(
          (outcome): outcome is Extract<FetchOutcome, { failed: false }> =>
            !outcome.failed
        )
        .map((outcome) => outcome.movie);

      const failedMovieIds = outcomes
        .filter((outcome) => outcome.failed)
        .map((outcome) => outcome.movieId);

      setCompleted({ key: cacheKey, movies, failedMovieIds });
    }

    loadMovies();

    return () => {
      controller.abort();
    };
  }, [idsKey, mode, cacheKey]);

  if (idsKey === "") {
    return { movies: [], isLoading: false, hasError: false, failedMovieIds: [] };
  }

  const isLoading = completed.key !== cacheKey;

  if (isLoading) {
    return { movies: [], isLoading: true, hasError: false, failedMovieIds: [] };
  }

  return {
    movies: completed.movies,
    isLoading: false,
    hasError:
      completed.failedMovieIds.length > 0 && completed.movies.length === 0,
    failedMovieIds: completed.failedMovieIds,
  };
}
