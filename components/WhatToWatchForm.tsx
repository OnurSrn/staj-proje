"use client";

import { useId, useState } from "react";
import { useSettings } from "@/components/SettingsProvider";
import {
  getCompanyOptions,
  getDiscoveryOptions,
  getIntensityOptions,
  getMoodOptions,
  getRuntimeOptions,
  t,
} from "@/lib/i18n";
import { buildWhatToWatchDescription } from "@/lib/whatToWatch";
import type {
  Company,
  Discovery,
  Intensity,
  Mood,
  MovieGenre,
  RuntimePreference,
} from "@/lib/tmdb";

type WhatToWatchFormProps = {
  genres: MovieGenre[];
  defaultMood: Mood;
  defaultRuntime: RuntimePreference;
  defaultIntensity: Intensity;
  defaultCompany: Company;
  defaultDiscovery: Discovery;
  defaultGenreId: number;
};

const selectClassName =
  "w-full rounded-lg border border-border bg-input px-4 py-3 text-foreground outline-none focus:border-accent";

const labelClassName = "mb-2 block text-sm font-semibold text-muted";

export default function WhatToWatchForm({
  genres,
  defaultMood,
  defaultRuntime,
  defaultIntensity,
  defaultCompany,
  defaultDiscovery,
  defaultGenreId,
}: WhatToWatchFormProps) {
  const { settings } = useSettings();
  const language = settings.language;

  const [mood, setMood] = useState<Mood>(defaultMood);
  const [runtime, setRuntime] = useState<RuntimePreference>(defaultRuntime);
  const [intensity, setIntensity] = useState<Intensity>(defaultIntensity);
  const [company, setCompany] = useState<Company>(defaultCompany);
  const [discovery, setDiscovery] = useState<Discovery>(defaultDiscovery);
  const [genreId, setGenreId] = useState<number>(defaultGenreId);

  const moodId = useId();
  const runtimeId = useId();
  const intensityId = useId();
  const companyId = useId();
  const discoveryId = useId();
  const genreSelectId = useId();

  const genreName =
    genreId > 0
      ? genres.find((genre) => genre.id === genreId)?.name ?? null
      : null;

  const previewText = buildWhatToWatchDescription(language, {
    mood,
    runtime,
    company,
    genreName,
  });

  return (
    <form
      action="/what-to-watch"
      method="GET"
      className="rounded-2xl border border-border bg-surface p-5"
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div>
          <label htmlFor={moodId} className={labelClassName}>
            {t(language, "whatToWatch", "moodLabel")}
          </label>

          <select
            id={moodId}
            name="mood"
            value={mood}
            onChange={(event) => setMood(event.target.value as Mood)}
            className={selectClassName}
          >
            {getMoodOptions(language).map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor={runtimeId} className={labelClassName}>
            {t(language, "whatToWatch", "runtimeLabel")}
          </label>

          <select
            id={runtimeId}
            name="runtime"
            value={runtime}
            onChange={(event) =>
              setRuntime(event.target.value as RuntimePreference)
            }
            className={selectClassName}
          >
            {getRuntimeOptions(language).map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor={intensityId} className={labelClassName}>
            {t(language, "whatToWatch", "intensityLabel")}
          </label>

          <select
            id={intensityId}
            name="intensity"
            value={intensity}
            onChange={(event) =>
              setIntensity(event.target.value as Intensity)
            }
            className={selectClassName}
          >
            {getIntensityOptions(language).map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor={companyId} className={labelClassName}>
            {t(language, "whatToWatch", "companyLabel")}
          </label>

          <select
            id={companyId}
            name="company"
            value={company}
            onChange={(event) => setCompany(event.target.value as Company)}
            className={selectClassName}
          >
            {getCompanyOptions(language).map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor={discoveryId} className={labelClassName}>
            {t(language, "whatToWatch", "discoveryLabel")}
          </label>

          <select
            id={discoveryId}
            name="discovery"
            value={discovery}
            onChange={(event) =>
              setDiscovery(event.target.value as Discovery)
            }
            className={selectClassName}
          >
            {getDiscoveryOptions(language).map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor={genreSelectId} className={labelClassName}>
            {t(language, "whatToWatch", "genreLabel")}
          </label>

          <select
            id={genreSelectId}
            name="genre"
            value={genreId}
            onChange={(event) => setGenreId(Number(event.target.value))}
            className={selectClassName}
          >
            <option value="0">
              {t(language, "whatToWatch", "genreAnyOption")}
            </option>

            {genres.map((genre) => (
              <option key={genre.id} value={genre.id}>
                {genre.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <p className="mt-5 text-sm text-muted">{previewText}</p>

      <button
        type="submit"
        className="mt-5 rounded-lg bg-accent px-6 py-3 font-semibold text-accent-foreground transition hover:bg-accent-hover"
      >
        {t(language, "whatToWatch", "submit")}
      </button>
    </form>
  );
}
