"use client";

import { useId } from "react";
import {
  canRateMovie,
  useMovieRatings,
  useWatchStatuses,
  type WatchStatus,
} from "@/components/SavedMoviesProvider";

type MovieRatingProps = {
  movieId: number;
};

const RATING_OPTIONS = Array.from(
  { length: 19 },
  (_, index) => 1 + index * 0.5
);

function getLockedRatingMessage(status: WatchStatus | null): string {
  if (status === null) {
    return "Puan verebilmek için önce İzleme Durumu seç.";
  }

  return "Puan vermek için filmi izlediğini veya yarım bıraktığını işaretle.";
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
  const selectId = useId();
  const lockedMessageId = `${selectId}-locked-message`;

  const isLoaded = isRatingsLoaded && isWatchStatusesLoaded;

  if (!isLoaded) {
    return (
      <div className="mt-6 max-w-3xl">
        <div className="h-4 w-32 animate-pulse rounded bg-neutral-800" />
        <div className="mt-3 h-10 w-56 animate-pulse rounded-lg bg-neutral-800" />
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
      <h2 className="text-sm font-semibold uppercase tracking-widest text-neutral-400">
        {rating !== null ? `Senin Puanın: ${rating} / 10` : "Senin Puanın"}
      </h2>

      {rating === null && canRate && (
        <p className="mt-1 text-sm text-neutral-500">
          Henüz puan vermedin
        </p>
      )}

      {!canRate && (
        <p id={lockedMessageId} className="mt-1 text-sm text-neutral-500">
          {getLockedRatingMessage(watchStatus)}
          {rating !== null && " Mevcut puanın korunuyor."}
        </p>
      )}

      <div className="mt-3 flex flex-wrap items-end gap-3">
        <div>
          <label
            htmlFor={selectId}
            className="mb-1 block text-xs text-neutral-500"
          >
            Puan Ver
          </label>

          <select
            id={selectId}
            value={rating ?? ""}
            onChange={handleChange}
            disabled={!canRate}
            aria-describedby={!canRate ? lockedMessageId : undefined}
            className="rounded-lg border border-neutral-700 bg-neutral-950 px-4 py-2 text-sm text-white outline-none focus:border-yellow-400 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <option value="" disabled>
              Puan seç
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
            className="rounded-lg border border-red-500/50 bg-red-500/10 px-4 py-2 text-sm font-semibold text-red-400 transition hover:bg-red-500 hover:text-white"
          >
            Puanı Sil
          </button>
        )}
      </div>
    </div>
  );
}
