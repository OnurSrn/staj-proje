"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import MovieCard from "@/components/MovieCard";
import { getPosterUrl, type MovieDetails } from "@/lib/tmdb";

type SavedMoviesGridProps = {
  storageKey: string;
  emptyTitle: string;
  emptyDescription: string;
  removeButtonText: string;
};

function readMovieIds(storageKey: string): number[] {
  try {
    const storedValue = localStorage.getItem(storageKey);

    if (!storedValue) {
      return [];
    }

    const parsedValue: unknown = JSON.parse(storedValue);

    if (!Array.isArray(parsedValue)) {
      return [];
    }

    return parsedValue.filter(
      (value): value is number => typeof value === "number"
    );
  } catch {
    return [];
  }
}

export default function SavedMoviesGrid({
  storageKey,
  emptyTitle,
  emptyDescription,
  removeButtonText,
}: SavedMoviesGridProps) {
  const [movies, setMovies] = useState<MovieDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    async function loadMovies() {
      const movieIds = readMovieIds(storageKey);

      if (movieIds.length === 0) {
        setMovies([]);
        setIsLoading(false);
        return;
      }

      try {
        const responses = await Promise.all(
          movieIds.map((movieId) =>
            fetch(`/api/movies/${movieId}`, {
              cache: "no-store",
            })
          )
        );

        const successfulResponses = responses.filter(
          (response) => response.ok
        );

        const movieData: MovieDetails[] = await Promise.all(
          successfulResponses.map((response) => response.json())
        );

        setMovies(movieData);
      } catch {
        setHasError(true);
      } finally {
        setIsLoading(false);
      }
    }

    loadMovies();
  }, [storageKey]);

  function removeMovie(movieId: number) {
    const currentIds = readMovieIds(storageKey);

    const updatedIds = currentIds.filter((id) => id !== movieId);

    localStorage.setItem(storageKey, JSON.stringify(updatedIds));

    setMovies((currentMovies) =>
      currentMovies.filter((movie) => movie.id !== movieId)
    );
  }

  if (isLoading) {
    return (
      <div className="mt-10 grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {Array.from({ length: 5 }).map((_, index) => (
          <div
            key={index}
            className="overflow-hidden rounded-xl border border-neutral-800 bg-neutral-900"
          >
            <div className="aspect-[2/3] animate-pulse bg-neutral-800" />

            <div className="space-y-3 p-4">
              <div className="h-5 animate-pulse rounded bg-neutral-800" />
              <div className="h-4 w-2/3 animate-pulse rounded bg-neutral-800" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (hasError) {
    return (
      <div className="mt-10 rounded-2xl border border-red-500/40 bg-red-500/10 p-10 text-center">
        <h2 className="text-xl font-semibold text-red-400">
          Filmler yüklenemedi
        </h2>

        <p className="mt-3 text-neutral-400">
          Sayfayı yenileyip tekrar dene.
        </p>
      </div>
    );
  }

  if (movies.length === 0) {
    return (
      <div className="mt-10 rounded-2xl border border-dashed border-neutral-700 bg-neutral-900 p-10 text-center">
        <h2 className="text-xl font-semibold">{emptyTitle}</h2>

        <p className="mt-3 text-neutral-400">{emptyDescription}</p>

        <Link
          href="/"
          className="mt-6 inline-block rounded-lg bg-yellow-400 px-5 py-3 font-semibold text-black transition hover:bg-yellow-300"
        >
          Filmleri Keşfet
        </Link>
      </div>
    );
  }

  return (
    <>
      <p className="mt-4 text-sm text-neutral-500">
        Toplam {movies.length} film
      </p>

      <div className="mt-8 grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {movies.map((movie) => (
          <div key={movie.id} className="flex flex-col gap-3">
            <MovieCard
              id={movie.id}
              title={movie.title}
              year={movie.release_date?.slice(0, 4) ?? ""}
              rating={movie.vote_average}
              overview={movie.overview}
              posterUrl={getPosterUrl(movie.poster_path)}
            />

            <button
              type="button"
              onClick={() => removeMovie(movie.id)}
              className="rounded-lg border border-red-500/50 bg-red-500/10 px-4 py-2 text-sm font-semibold text-red-400 transition hover:bg-red-500 hover:text-white"
            >
              {removeButtonText}
            </button>
          </div>
        ))}
      </div>
    </>
  );
}