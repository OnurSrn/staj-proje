"use client";

import { useId } from "react";
import {
  useWatchStatuses,
  type WatchStatus,
} from "@/components/SavedMoviesProvider";

type MovieWatchStatusProps = {
  movieId: number;
};

const STATUS_OPTIONS: { value: WatchStatus; label: string }[] = [
  { value: "watched", label: "İzledim" },
  { value: "watching", label: "İzliyorum" },
  { value: "dropped", label: "Yarım Bıraktım" },
  { value: "plan-to-watch", label: "Daha Sonra İzle" },
];

function getStatusLabel(status: WatchStatus): string {
  return (
    STATUS_OPTIONS.find((option) => option.value === status)?.label ?? ""
  );
}

export default function MovieWatchStatus({
  movieId,
}: MovieWatchStatusProps) {
  const { isLoaded, getWatchStatus, setWatchStatus, removeWatchStatus } =
    useWatchStatuses();
  const selectId = useId();

  if (!isLoaded) {
    return (
      <div className="mt-6 max-w-3xl">
        <div className="h-4 w-32 animate-pulse rounded bg-neutral-800" />
        <div className="mt-3 h-10 w-56 animate-pulse rounded-lg bg-neutral-800" />
      </div>
    );
  }

  const status = getWatchStatus(movieId);

  function handleChange(event: React.ChangeEvent<HTMLSelectElement>) {
    const value = event.target.value;

    if (value === "") {
      removeWatchStatus(movieId);
      return;
    }

    setWatchStatus(movieId, value as WatchStatus);
  }

  return (
    <div className="mt-6 max-w-3xl">
      <h2 className="text-sm font-semibold uppercase tracking-widest text-neutral-400">
        {status !== null
          ? `İzleme Durumu: ${getStatusLabel(status)}`
          : "İzleme Durumu"}
      </h2>

      <div className="mt-3 flex flex-wrap items-end gap-3">
        <div>
          <label
            htmlFor={selectId}
            className="mb-1 block text-xs text-neutral-500"
          >
            Durum Seç
          </label>

          <select
            id={selectId}
            value={status ?? ""}
            onChange={handleChange}
            className="rounded-lg border border-neutral-700 bg-neutral-950 px-4 py-2 text-sm text-white outline-none focus:border-yellow-400"
          >
            <option value="">Durum seçilmedi</option>

            {STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {status !== null && (
          <button
            type="button"
            onClick={() => removeWatchStatus(movieId)}
            className="rounded-lg border border-red-500/50 bg-red-500/10 px-4 py-2 text-sm font-semibold text-red-400 transition hover:bg-red-500 hover:text-white"
          >
            Durumu Kaldır
          </button>
        )}
      </div>
    </div>
  );
}
