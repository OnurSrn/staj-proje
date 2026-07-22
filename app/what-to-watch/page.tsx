import type { Metadata } from "next";
import WhatToWatchForm from "@/components/WhatToWatchForm";
import WhatToWatchResults from "@/components/WhatToWatchResults";
import { t } from "@/lib/i18n";
import { getServerLanguage } from "@/lib/serverLanguage";
import {
  getMovieGenres,
  getWhatToWatchRecommendations,
  type Company,
  type Discovery,
  type Intensity,
  type Mood,
  type RuntimePreference,
} from "@/lib/tmdb";
import { buildWhatToWatchDescription } from "@/lib/whatToWatch";

export const metadata: Metadata = {
  title: "What to Watch",
  description:
    "Ruh haline, vaktine ve kiminle izleyeceğine göre sana film önerelim.",
};

type WhatToWatchPageProps = {
  searchParams: Promise<{
    mood?: string;
    runtime?: string;
    intensity?: string;
    company?: string;
    discovery?: string;
    genre?: string;
  }>;
};

const ALLOWED_MOODS: Mood[] = [
  "fun",
  "exciting",
  "emotional",
  "dark",
  "cozy",
  "thoughtful",
];

const ALLOWED_RUNTIMES: RuntimePreference[] = [
  "short",
  "medium",
  "long",
  "any",
];

const ALLOWED_INTENSITIES: Intensity[] = ["light", "balanced", "intense"];

const ALLOWED_COMPANIES: Company[] = [
  "alone",
  "friends",
  "family",
  "partner",
];

const ALLOWED_DISCOVERIES: Discovery[] = ["safe", "balanced", "different"];

const DEFAULT_MOOD: Mood = "fun";
const DEFAULT_RUNTIME: RuntimePreference = "any";
const DEFAULT_INTENSITY: Intensity = "balanced";
const DEFAULT_COMPANY: Company = "alone";
const DEFAULT_DISCOVERY: Discovery = "balanced";

// Kişiselleştirme (client-side rerank) için mevcut 12'lik gösterim
// sınırından daha geniş bir aday havuzu istemcinin eline verilir — TMDB
// discover uç noktası zaten sayfa başına 20 sonuç döndürdüğü için bu ek bir
// istek OLUŞTURMAZ, yalnızca zaten gelen sonuçların ne kadarının client'a
// taşındığını belirler (bkz. görev talimatı bölüm 11/15).
const WHAT_TO_WATCH_CANDIDATE_POOL_LIMIT = 20;

function isMood(value: string): value is Mood {
  return ALLOWED_MOODS.includes(value as Mood);
}

function isRuntime(value: string): value is RuntimePreference {
  return ALLOWED_RUNTIMES.includes(value as RuntimePreference);
}

function isIntensity(value: string): value is Intensity {
  return ALLOWED_INTENSITIES.includes(value as Intensity);
}

function isCompany(value: string): value is Company {
  return ALLOWED_COMPANIES.includes(value as Company);
}

function isDiscovery(value: string): value is Discovery {
  return ALLOWED_DISCOVERIES.includes(value as Discovery);
}

function parseGenre(value: string | undefined): number {
  const parsedGenre = Number(value);

  if (!Number.isInteger(parsedGenre) || parsedGenre < 1) {
    return 0;
  }

  return parsedGenre;
}

export default async function WhatToWatchPage({
  searchParams,
}: WhatToWatchPageProps) {
  const params = await searchParams;
  const [genres, language] = await Promise.all([
    getMovieGenres(),
    getServerLanguage(),
  ]);

  const hasSubmitted = params.mood !== undefined && isMood(params.mood);

  const mood: Mood =
    params.mood && isMood(params.mood) ? params.mood : DEFAULT_MOOD;

  const runtime: RuntimePreference =
    params.runtime && isRuntime(params.runtime)
      ? params.runtime
      : DEFAULT_RUNTIME;

  const intensity: Intensity =
    params.intensity && isIntensity(params.intensity)
      ? params.intensity
      : DEFAULT_INTENSITY;

  const company: Company =
    params.company && isCompany(params.company)
      ? params.company
      : DEFAULT_COMPANY;

  const discovery: Discovery =
    params.discovery && isDiscovery(params.discovery)
      ? params.discovery
      : DEFAULT_DISCOVERY;

  const requestedGenreId = parseGenre(params.genre);

  const genreId = genres.some((genre) => genre.id === requestedGenreId)
    ? requestedGenreId
    : 0;

  const movieData = hasSubmitted
    ? await getWhatToWatchRecommendations({
        mood,
        runtime,
        intensity,
        company,
        discovery,
        genreId,
      })
    : null;

  const seenIds = new Set<number>();

  const results = (movieData?.results ?? [])
    .filter((movie) => {
      if (seenIds.has(movie.id)) {
        return false;
      }

      seenIds.add(movie.id);
      return true;
    })
    .slice(0, WHAT_TO_WATCH_CANDIDATE_POOL_LIMIT);

  const genreName =
    genreId > 0 ? genres.find((genre) => genre.id === genreId)?.name ?? null : null;

  const description = hasSubmitted
    ? buildWhatToWatchDescription(language, { mood, runtime, company, genreName })
    : "";

  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="mx-auto max-w-7xl px-6 py-16">
        <p className="text-sm font-semibold uppercase tracking-widest text-accent">
          {t(language, "whatToWatch", "eyebrow")}
        </p>

        <h1 className="mt-4 text-4xl font-bold">
          {t(language, "whatToWatch", "title")}
        </h1>

        <p className="mt-4 text-muted">
          {t(language, "whatToWatch", "subtitle")}
        </p>

        <div className="mt-8">
          <WhatToWatchForm
            genres={genres}
            defaultMood={mood}
            defaultRuntime={runtime}
            defaultIntensity={intensity}
            defaultCompany={company}
            defaultDiscovery={discovery}
            defaultGenreId={genreId}
          />
        </div>

        {!hasSubmitted && (
          <div className="mt-12 rounded-2xl border border-dashed border-border-strong bg-surface p-10 text-center">
            <h2 className="text-xl font-semibold">
              {t(language, "whatToWatch", "promptTitle")}
            </h2>

            <p className="mt-3 text-muted">
              {t(language, "whatToWatch", "promptDescription")}
            </p>
          </div>
        )}

        {hasSubmitted && (
          <WhatToWatchResults
            movies={results}
            description={description}
            selectedMood={mood}
            selectedGenreId={genreId > 0 ? genreId : null}
            selectedRuntime={runtime}
            selectedIntensity={intensity}
            selectedCompany={company}
            selectedDiscovery={discovery}
          />
        )}
      </section>
    </main>
  );
}
