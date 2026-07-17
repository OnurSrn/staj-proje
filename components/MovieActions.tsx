"use client";

import { useEffect, useState } from "react";

type MovieActionsProps = {
  movieId: number;
};

function readMovieIds(key: string): number[] {
  try {
    const storedValue = localStorage.getItem(key);

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

function toggleMovieId(key: string, movieId: number): boolean {
  const currentIds = readMovieIds(key);
  const movieExists = currentIds.includes(movieId);

  const updatedIds = movieExists
    ? currentIds.filter((id) => id !== movieId)
    : [...currentIds, movieId];

  localStorage.setItem(key, JSON.stringify(updatedIds));

  return !movieExists;
}

export default function MovieActions({ movieId }: MovieActionsProps) {
  const [isFavorite, setIsFavorite] = useState(false);
  const [isInWatchlist, setIsInWatchlist] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setIsFavorite(readMovieIds("cinescope-favorites").includes(movieId));
    setIsInWatchlist(readMovieIds("cinescope-watchlist").includes(movieId));
    setIsLoaded(true);
  }, [movieId]);

  function handleFavorite() {
    const newFavoriteState = toggleMovieId(
      "cinescope-favorites",
      movieId
    );

    setIsFavorite(newFavoriteState);
  }

  function handleWatchlist() {
    const newWatchlistState = toggleMovieId(
      "cinescope-watchlist",
      movieId
    );

    setIsInWatchlist(newWatchlistState);
  }

  if (!isLoaded) {
    return (
      <div className="mt-8 flex flex-wrap gap-4">
        <div className="h-12 w-40 animate-pulse rounded-lg bg-neutral-800" />
        <div className="h-12 w-44 animate-pulse rounded-lg bg-neutral-800" />
      </div>
    );
  }

  return (
    <div className="mt-8 flex flex-wrap gap-4">
      <button
        type="button"
        onClick={handleFavorite}
        className={
          isFavorite
            ? "rounded-lg bg-red-500 px-6 py-3 font-semibold text-white transition hover:bg-red-400"
            : "rounded-lg bg-yellow-400 px-6 py-3 font-semibold text-black transition hover:bg-yellow-300"
        }
      >
        {isFavorite ? "Favorilerden Çıkar" : "Favorilere Ekle"}
      </button>

      <button
        type="button"
        onClick={handleWatchlist}
        className={
          isInWatchlist
            ? "rounded-lg border border-green-400 bg-green-400/10 px-6 py-3 font-semibold text-green-400 transition hover:bg-green-400/20"
            : "rounded-lg border border-neutral-700 px-6 py-3 font-semibold transition hover:border-yellow-400 hover:text-yellow-400"
        }
      >
        {isInWatchlist
          ? "Watchlist'ten Çıkar"
          : "Watchlist'e Ekle"}
      </button>
    </div>
  );
}