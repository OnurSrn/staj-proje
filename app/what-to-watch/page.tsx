import type { Metadata } from "next";
import WhatToWatchForm from "@/components/WhatToWatchForm";
import WhatToWatchResults from "@/components/WhatToWatchResults";
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
  const genres = await getMovieGenres();

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
    .slice(0, 12);

  const genreName =
    genreId > 0 ? genres.find((genre) => genre.id === genreId)?.name ?? null : null;

  const description = hasSubmitted
    ? buildWhatToWatchDescription({ mood, runtime, company, genreName })
    : "";

  return (
    <main className="min-h-screen bg-neutral-950 text-white">
      <section className="mx-auto max-w-7xl px-6 py-16">
        <p className="text-sm font-semibold uppercase tracking-widest text-yellow-400">
          Bu Akşam Ne İzlesem?
        </p>

        <h1 className="mt-4 text-4xl font-bold">What to Watch</h1>

        <p className="mt-4 text-neutral-400">
          Ruh haline, vaktine ve kiminle izleyeceğine göre sana film
          önerelim.
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
          <div className="mt-12 rounded-2xl border border-dashed border-neutral-700 bg-neutral-900 p-10 text-center">
            <h2 className="text-xl font-semibold">
              Tercihlerini seç, sana film önerelim
            </h2>

            <p className="mt-3 text-neutral-400">
              Yukarıdaki formu doldurup &quot;Film Öner&quot; butonuna bas.
            </p>
          </div>
        )}

        {hasSubmitted && (
          <WhatToWatchResults movies={results} description={description} />
        )}
      </section>
    </main>
  );
}
