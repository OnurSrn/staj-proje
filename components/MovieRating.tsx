"use client";

import { useId } from "react";
import { useSettings } from "@/components/SettingsProvider";
import { t } from "@/lib/i18n";
import {
  canRateMovie,
  useMovieRatings,
  useWatchStatuses,
  type WatchStatus,
} from "@/components/SavedMoviesProvider";
import type { AppLanguage } from "@/lib/settings";

type MovieRatingProps = {
  movieId: number;
};

const RATING_OPTIONS = Array.from(
  { length: 19 },
  (_, index) => 1 + index * 0.5
);

function getLockedRatingMessage(
  language: AppLanguage,
  status: WatchStatus | null
): string {
  if (status === null) {
    return t(language, "ratingStatus", "lockedNeedsStatus");
  }

  return t(language, "ratingStatus", "lockedNeedsWatchedOrDropped");
}

export default function MovieRating({ movieId }: MovieRatingProps) {
  const {
    isLoaded: isRatingsLoaded,
    getMovieRating,
    setMovieRating,
    removeMovieRating,
  } = useMovieRatings();
  const { isLoaded: isWatchStatusesLoaded, getWatchStatus } =
    useWatchStatuses();
  const { settings } = useSettings();
  const language = settings.language;
  const selectId = useId();
  const lockedMessageId = `${selectId}-locked-message`;

  const isLoaded = isRatingsLoaded && isWatchStatusesLoaded;

  if (!isLoaded) {
    return (
      <div className="mt-6 max-w-3xl">
        <div className="h-4 w-32 animate-pulse rounded bg-surface-elevated" />
        <div className="mt-3 h-10 w-56 animate-pulse rounded-lg bg-surface-elevated" />
      </div>
    );
  }

  const rating = getMovieRating(movieId);
  const watchStatus = getWatchStatus(movieId);
  const canRate = canRateMovie(watchStatus);

  function handleChange(event: React.ChangeEvent<HTMLSelectElement>) {
    const value = Number(event.target.value);

    if (Number.isNaN(value)) {
      return;
    }

    setMovieRating(movieId, value);
  }

  return (
    <div className="mt-6 max-w-3xl">
      <h2 className="text-sm font-semibold uppercase tracking-widest text-muted">
        {rating !== null
          ? `${t(language, "ratingStatus", "yourRatingHeading")}: ${rating} / 10`
          : t(language, "ratingStatus", "yourRatingHeading")}
      </h2>

      {rating === null && canRate && (
        <p className="mt-1 text-sm text-muted">
          {t(language, "ratingStatus", "notRatedYet")}
        </p>
      )}

      {!canRate && (
        <p id={lockedMessageId} className="mt-1 text-sm text-muted">
          {getLockedRatingMessage(language, watchStatus)}
          {rating !== null &&
            t(language, "ratingStatus", "ratingPreservedSuffix")}
        </p>
      )}

      <div className="mt-3 flex flex-wrap items-end gap-3">
        <div>
          <label
            htmlFor={selectId}
            className="mb-1 block text-xs text-muted"
          >
            {t(language, "ratingStatus", "selectRatingLabel")}
          </label>

          <select
            id={selectId}
            value={rating ?? ""}
            onChange={handleChange}
            disabled={!canRate}
            aria-describedby={!canRate ? lockedMessageId : undefined}
            className="rounded-lg border border-border bg-input px-4 py-2 text-sm text-foreground outline-none focus:border-accent disabled:cursor-not-allowed disabled:opacity-50"
          >
            <option value="" disabled>
              {t(language, "ratingStatus", "selectRatingPlaceholder")}
            </option>

            {RATING_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>

        {rating !== null && canRate && (
          <button
            type="button"
            onClick={() => removeMovieRating(movieId)}
            className="rounded-lg border border-danger/50 bg-danger/10 px-4 py-2 text-sm font-semibold text-danger transition hover:bg-danger hover:text-white"
          >
            {t(language, "ratingStatus", "deleteRating")}
          </button>
        )}
      </div>
    </div>
  );
}
