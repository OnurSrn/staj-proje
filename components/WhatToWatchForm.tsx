"use client";

import { useId, useState } from "react";
import type {
  Company,
  Discovery,
  Intensity,
  Mood,
  MovieGenre,
  RuntimePreference,
} from "@/lib/tmdb";
import {
  COMPANY_OPTIONS,
  DISCOVERY_OPTIONS,
  INTENSITY_OPTIONS,
  MOOD_OPTIONS,
  RUNTIME_OPTIONS,
  buildWhatToWatchDescription,
} from "@/lib/whatToWatch";

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
  "w-full rounded-lg border border-neutral-700 bg-neutral-950 px-4 py-3 text-white outline-none focus:border-yellow-400";

const labelClassName = "mb-2 block text-sm font-semibold text-neutral-300";

export default function WhatToWatchForm({
  genres,
  defaultMood,
  defaultRuntime,
  defaultIntensity,
  defaultCompany,
  defaultDiscovery,
  defaultGenreId,
}: WhatToWatchFormProps) {
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

  const previewText = buildWhatToWatchDescription({
    mood,
    runtime,
    company,
    genreName,
  });

  return (
    <form
      action="/what-to-watch"
      method="GET"
      className="rounded-2xl border border-neutral-800 bg-neutral-900 p-5"
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div>
          <label htmlFor={moodId} className={labelClassName}>
            Ruh Hâli
          </label>

          <select
            id={moodId}
            name="mood"
            value={mood}
            onChange={(event) => setMood(event.target.value as Mood)}
            className={selectClassName}
          >
            {MOOD_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor={runtimeId} className={labelClassName}>
            Süre
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
            {RUNTIME_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor={intensityId} className={labelClassName}>
            Yoğunluk
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
            {INTENSITY_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor={companyId} className={labelClassName}>
            İzleme Ortamı
          </label>

          <select
            id={companyId}
            name="company"
            value={company}
            onChange={(event) => setCompany(event.target.value as Company)}
            className={selectClassName}
          >
            {COMPANY_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor={discoveryId} className={labelClassName}>
            Keşif Tercihi
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
            {DISCOVERY_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor={genreSelectId} className={labelClassName}>
            Film Türü
          </label>

          <select
            id={genreSelectId}
            name="genre"
            value={genreId}
            onChange={(event) => setGenreId(Number(event.target.value))}
            className={selectClassName}
          >
            <option value="0">Tür fark etmez</option>

            {genres.map((genre) => (
              <option key={genre.id} value={genre.id}>
                {genre.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <p className="mt-5 text-sm text-neutral-400">{previewText}</p>

      <button
        type="submit"
        className="mt-5 rounded-lg bg-yellow-400 px-6 py-3 font-semibold text-black transition hover:bg-yellow-300"
      >
        Film Öner
      </button>
    </form>
  );
}
