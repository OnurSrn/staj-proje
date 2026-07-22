"use client";

import { useSavedMovies } from "@/components/SavedMoviesProvider";
import { useSettings } from "@/components/SettingsProvider";
import { t } from "@/lib/i18n";

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
  const { settings } = useSettings();
  const language = settings.language;

  if (!isLoaded) {
    return (
      <div className="mt-8 flex flex-wrap gap-4">
        <div className="h-12 w-40 animate-pulse rounded-lg bg-surface-elevated" />
        <div className="h-12 w-44 animate-pulse rounded-lg bg-surface-elevated" />
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
            ? "rounded-lg bg-danger px-6 py-3 font-semibold text-white transition hover:opacity-90"
            : "rounded-lg bg-accent px-6 py-3 font-semibold text-accent-foreground transition hover:bg-accent-hover"
        }
      >
        {favorite
          ? t(language, "movieActions", "removeFavorite")
          : t(language, "movieActions", "addFavorite")}
      </button>

      <button
        type="button"
        onClick={() => toggleWatchlist(movieId)}
        className={
          inWatchlist
            ? "rounded-lg border border-success bg-success/10 px-6 py-3 font-semibold text-success transition hover:bg-success/20"
            : "rounded-lg border border-border px-6 py-3 font-semibold text-foreground transition hover:border-accent hover:text-accent"
        }
      >
        {inWatchlist
          ? t(language, "movieActions", "removeWatchlist")
          : t(language, "movieActions", "addWatchlist")}
      </button>
    </div>
  );
}
