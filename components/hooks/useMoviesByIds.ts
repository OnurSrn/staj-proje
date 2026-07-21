"use client";

import { useEffect, useState } from "react";
import type { MovieDetails } from "@/lib/tmdb";

type UseMoviesByIdsResult = {
  movies: MovieDetails[];
  isLoading: boolean;
  hasError: boolean;
  failedMovieIds: number[];
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
// kontrolsüz paralel istek patlaması oluşmasın.
const MOVIE_FETCH_CONCURRENCY = 6;

async function fetchMovie(
  movieId: number,
  signal: AbortSignal
): Promise<FetchOutcome> {
  try {
    const response = await fetch(`/api/movies/${movieId}`, {
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

export function useMoviesByIds(movieIds: number[]): UseMoviesByIdsResult {
  const idsKey = Array.from(new Set(movieIds)).join(",");

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

      setCompleted({ key: idsKey, movies, failedMovieIds });
    }

    loadMovies();

    return () => {
      controller.abort();
    };
  }, [idsKey]);

  if (idsKey === "") {
    return { movies: [], isLoading: false, hasError: false, failedMovieIds: [] };
  }

  const isLoading = completed.key !== idsKey;

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
