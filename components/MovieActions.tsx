"use client";

import { useSavedMovies } from "@/components/SavedMoviesProvider";

type MovieActionsProps = {
  movieId: number;
};

export default function MovieActions({ movieId }: MovieActionsProps) {
  const {
    isLoaded,
    isFavorite,
    isInWatchlist,
    toggleFavorite,
    toggleWatchlist,
  } = useSavedMovies();

  if (!isLoaded) {
    return (
      <div className="mt-8 flex flex-wrap gap-4">
        <div className="h-12 w-40 animate-pulse rounded-lg bg-neutral-800" />
        <div className="h-12 w-44 animate-pulse rounded-lg bg-neutral-800" />
      </div>
    );
  }

  const favorite = isFavorite(movieId);
  const inWatchlist = isInWatchlist(movieId);

  return (
    <div className="mt-8 flex flex-wrap gap-4">
      <button
        type="button"
        onClick={() => toggleFavorite(movieId)}
        className={
          favorite
            ? "rounded-lg bg-red-500 px-6 py-3 font-semibold text-white transition hover:bg-red-400"
            : "rounded-lg bg-yellow-400 px-6 py-3 font-semibold text-black transition hover:bg-yellow-300"
        }
      >
        {favorite ? "Favorilerden Çıkar" : "Favorilere Ekle"}
      </button>

      <button
        type="button"
        onClick={() => toggleWatchlist(movieId)}
        className={
          inWatchlist
            ? "rounded-lg border border-green-400 bg-green-400/10 px-6 py-3 font-semibold text-green-400 transition hover:bg-green-400/20"
            : "rounded-lg border border-neutral-700 px-6 py-3 font-semibold transition hover:border-yellow-400 hover:text-yellow-400"
        }
      >
        {inWatchlist ? "Watchlist'ten Çıkar" : "Watchlist'e Ekle"}
      </button>
    </div>
  );
}
