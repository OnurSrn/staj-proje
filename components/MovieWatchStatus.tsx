"use client";

import { useId } from "react";
import { useSettings } from "@/components/SettingsProvider";
import { t } from "@/lib/i18n";
import {
  useWatchStatuses,
  type WatchStatus,
} from "@/components/SavedMoviesProvider";
import type { AppLanguage } from "@/lib/settings";

type MovieWatchStatusProps = {
  movieId: number;
};

const STATUS_VALUES: WatchStatus[] = [
  "watched",
  "watching",
  "dropped",
  "plan-to-watch",
];

const STATUS_KEY: Record<WatchStatus, "watched" | "watching" | "dropped" | "planToWatch"> = {
  watched: "watched",
  watching: "watching",
  dropped: "dropped",
  "plan-to-watch": "planToWatch",
};

function getStatusLabel(language: AppLanguage, status: WatchStatus): string {
  return t(language, "ratingStatus", STATUS_KEY[status]);
}

export default function MovieWatchStatus({
  movieId,
}: MovieWatchStatusProps) {
  const { isLoaded, getWatchStatus, setWatchStatus, removeWatchStatus } =
    useWatchStatuses();
  const { settings } = useSettings();
  const language = settings.language;
  const selectId = useId();

  if (!isLoaded) {
    return (
      <div className="mt-6 max-w-3xl">
        <div className="h-4 w-32 animate-pulse rounded bg-surface-elevated" />
        <div className="mt-3 h-10 w-56 animate-pulse rounded-lg bg-surface-elevated" />
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
      <h2 className="text-sm font-semibold uppercase tracking-widest text-muted">
        {status !== null
          ? `${t(language, "ratingStatus", "watchStatusHeading")}: ${getStatusLabel(language, status)}`
          : t(language, "ratingStatus", "watchStatusHeading")}
      </h2>

      <div className="mt-3 flex flex-wrap items-end gap-3">
        <div>
          <label
            htmlFor={selectId}
            className="mb-1 block text-xs text-muted"
          >
            {t(language, "ratingStatus", "selectStatusLabel")}
          </label>

          <select
            id={selectId}
            value={status ?? ""}
            onChange={handleChange}
            className="rounded-lg border border-border bg-input px-4 py-2 text-sm text-foreground outline-none focus:border-accent"
          >
            <option value="">
              {t(language, "ratingStatus", "selectStatusPlaceholder")}
            </option>

            {STATUS_VALUES.map((value) => (
              <option key={value} value={value}>
                {getStatusLabel(language, value)}
              </option>
            ))}
          </select>
        </div>

        {status !== null && (
          <button
            type="button"
            onClick={() => removeWatchStatus(movieId)}
            className="rounded-lg border border-danger/50 bg-danger/10 px-4 py-2 text-sm font-semibold text-danger transition hover:bg-danger hover:text-white"
          >
            {t(language, "ratingStatus", "removeStatus")}
          </button>
        )}
      </div>
    </div>
  );
}
