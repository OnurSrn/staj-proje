"use client";

import Link from "next/link";
import MovieCard from "@/components/MovieCard";
import { useMoviesByIds } from "@/components/hooks/useMoviesByIds";
import { useSavedMovies } from "@/components/SavedMoviesProvider";
import { getPosterUrl } from "@/lib/tmdb";

type SavedMoviesGridProps = {
  storageKey: string;
  emptyTitle: string;
  emptyDescription: string;
  removeButtonText: string;
};

export default function SavedMoviesGrid({
  storageKey,
  emptyTitle,
  emptyDescription,
  removeButtonText,
}: SavedMoviesGridProps) {
  const { favoriteIds, watchlistIds, isLoaded, toggleFavorite, toggleWatchlist } =
    useSavedMovies();

  const isFavoritesList = storageKey === "cinescope-favorites";
  const movieIds = isFavoritesList ? favoriteIds : watchlistIds;
  const toggleMovie = isFavoritesList ? toggleFavorite : toggleWatchlist;

  const { movies, isLoading, hasError } = useMoviesByIds(movieIds);

  const visibleMovies = movies.filter((movie) => movieIds.includes(movie.id));

  if (!isLoaded || isLoading) {
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

  if (visibleMovies.length === 0) {
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
        Toplam {visibleMovies.length} film
      </p>

      <div className="mt-8 grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {visibleMovies.map((movie) => (
          <div key={movie.id} className="flex flex-col gap-3">
            <MovieCard
              id={movie.id}
              title={movie.title}
              year={movie.release_date?.slice(0, 4) ?? ""}
              rating={movie.vote_average}
              voteCount={movie.vote_count}
              overview={movie.overview}
              posterUrl={getPosterUrl(movie.poster_path)}
            />

            <button
              type="button"
              onClick={() => toggleMovie(movie.id)}
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
