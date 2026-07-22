"use client";

import Link from "next/link";
import MovieCard from "@/components/MovieCard";
import { useMoviesByIds } from "@/components/hooks/useMoviesByIds";
import { useSavedMovies } from "@/components/SavedMoviesProvider";
import { useSettings } from "@/components/SettingsProvider";
import { buildTotalResultsSummary, t } from "@/lib/i18n";
import { getPosterUrl } from "@/lib/tmdb";

type SavedMoviesGridProps = {
  kind: "favorites" | "watchlist";
};

export default function SavedMoviesGrid({ kind }: SavedMoviesGridProps) {
  const { favoriteIds, watchlistIds, isLoaded, toggleFavorite, toggleWatchlist } =
    useSavedMovies();
  const { settings } = useSettings();
  const language = settings.language;

  const isFavoritesList = kind === "favorites";
  const movieIds = isFavoritesList ? favoriteIds : watchlistIds;
  const toggleMovie = isFavoritesList ? toggleFavorite : toggleWatchlist;
  const removeButtonText = t(
    language,
    "movieActions",
    isFavoritesList ? "removeFavorite" : "removeWatchlist"
  );

  const { movies, isLoading, hasError } = useMoviesByIds(movieIds);

  const visibleMovies = movies.filter((movie) => movieIds.includes(movie.id));

  if (!isLoaded || isLoading) {
    return (
      <div className="mt-10 grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {Array.from({ length: 5 }).map((_, index) => (
          <div
            key={index}
            className="overflow-hidden rounded-xl border border-border bg-surface"
          >
            <div className="aspect-[2/3] animate-pulse bg-surface-elevated" />

            <div className="space-y-3 p-4">
              <div className="h-5 animate-pulse rounded bg-surface-elevated" />
              <div className="h-4 w-2/3 animate-pulse rounded bg-surface-elevated" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (hasError) {
    return (
      <div className="mt-10 rounded-2xl border border-danger/40 bg-danger/10 p-10 text-center">
        <h2 className="text-xl font-semibold text-danger">
          {t(language, "common", "loadErrorTitle")}
        </h2>

        <p className="mt-3 text-muted">
          {t(language, "common", "loadErrorDescription")}
        </p>
      </div>
    );
  }

  if (visibleMovies.length === 0) {
    return (
      <div className="mt-10 rounded-2xl border border-dashed border-border-strong bg-surface p-10 text-center">
        <h2 className="text-xl font-semibold">
          {t(language, kind, "emptyTitle")}
        </h2>

        <p className="mt-3 text-muted">
          {t(language, kind, "emptyDescription")}
        </p>

        <Link
          href="/"
          className="mt-6 inline-block rounded-lg bg-accent px-5 py-3 font-semibold text-accent-foreground transition hover:bg-accent-hover"
        >
          {t(language, "common", "exploreMovies")}
        </Link>
      </div>
    );
  }

  return (
    <>
      <p className="mt-4 text-sm text-muted">
        {buildTotalResultsSummary(language, visibleMovies.length, "movies")}
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
              className="rounded-lg border border-danger/50 bg-danger/10 px-4 py-2 text-sm font-semibold text-danger transition hover:bg-danger hover:text-white"
            >
              {removeButtonText}
            </button>
          </div>
        ))}
      </div>
    </>
  );
}
