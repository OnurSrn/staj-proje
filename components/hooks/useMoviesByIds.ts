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
      const outcomes = await Promise.all(
        uniqueIds.map((movieId) => fetchMovie(movieId, controller.signal))
      );

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
