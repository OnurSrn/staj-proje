"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import MovieCard from "@/components/MovieCard";
import { useRecommendations } from "@/components/hooks/useRecommendations";
import { useSettings } from "@/components/SettingsProvider";
import { t } from "@/lib/i18n";
import { getPosterUrl } from "@/lib/tmdb";
import type { TasteProfile } from "@/lib/tasteProfile";
import type { AppLanguage } from "@/lib/settings";

function getConfidenceLabel(
  language: AppLanguage,
  confidence: TasteProfile["confidence"]
): string {
  return t(language, "confidence", confidence);
}

function DashboardSkeleton() {
  return (
    <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
      {Array.from({ length: 12 }).map((_, index) => (
        <div
          key={index}
          className="overflow-hidden rounded-xl border border-border bg-surface"
        >
          <div className="aspect-[2/3] animate-pulse bg-surface-elevated" />

          <div className="space-y-2 p-3">
            <div className="h-4 animate-pulse rounded bg-surface-elevated" />
            <div className="h-3 w-2/3 animate-pulse rounded bg-surface-elevated" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function ForYouDashboard() {
  const router = useRouter();
  const { settings } = useSettings();
  const language = settings.language;
  const { recommendations, tasteProfile, isLoading, hasError } =
    useRecommendations();

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  if (hasError) {
    return (
      <div className="mt-10 rounded-2xl border border-danger/40 bg-danger/10 p-10 text-center">
        <h2 className="text-xl font-semibold text-danger">
          {t(language, "forYou", "errorTitle")}
        </h2>

        <p className="mt-3 text-muted">
          {t(language, "forYou", "errorDescription")}
        </p>

        <button
          type="button"
          onClick={() => router.refresh()}
          className="mt-6 rounded-lg bg-accent px-5 py-3 font-semibold text-accent-foreground transition hover:bg-accent-hover"
        >
          {t(language, "common", "retry")}
        </button>
      </div>
    );
  }

  const hasAnyProfileData =
    tasteProfile !== null &&
    (tasteProfile.totalRatedMovies > 0 ||
      tasteProfile.totalStatusMovies > 0 ||
      tasteProfile.explicitFavoriteActorIds.length > 0 ||
      tasteProfile.explicitFavoriteDirectorIds.length > 0 ||
      tasteProfile.explicitFavoriteCompanyIds.length > 0);

  if (!hasAnyProfileData) {
    return (
      <div className="mt-10 rounded-2xl border border-dashed border-border-strong bg-surface p-10 text-center">
        <h2 className="text-xl font-semibold">
          {t(language, "forYou", "emptyProfileTitle")}
        </h2>

        <p className="mt-3 text-muted">
          {t(language, "forYou", "emptyProfileDescription")}
        </p>

        <div className="mt-6 flex flex-wrap justify-center gap-4">
          <Link
            href="/"
            className="rounded-lg bg-accent px-5 py-3 font-semibold text-accent-foreground transition hover:bg-accent-hover"
          >
            {t(language, "common", "exploreMovies")}
          </Link>

          <Link
            href="/preferences"
            className="rounded-lg border border-border px-5 py-3 font-semibold text-foreground transition hover:border-accent hover:text-accent"
          >
            {t(language, "forYou", "addPreferencesCta")}
          </Link>

          <Link
            href="/what-to-watch"
            className="rounded-lg border border-border px-5 py-3 font-semibold text-foreground transition hover:border-accent hover:text-accent"
          >
            {t(language, "forYou", "whatToWatchCta")}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-10">
      <div className="flex flex-wrap items-center gap-3">
        <span className="rounded-full border border-accent/40 px-3 py-1 text-xs font-semibold text-accent">
          {getConfidenceLabel(language, tasteProfile.confidence)}
        </span>

        {tasteProfile.confidence === "low" && (
          <p className="text-sm text-muted">
            {t(language, "forYou", "lowConfidenceNote")}
          </p>
        )}
      </div>

      {recommendations.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-border-strong bg-surface p-10 text-center">
          <h2 className="text-xl font-semibold">
            {t(language, "forYou", "noRecommendationsTitle")}
          </h2>

          <p className="mt-3 text-muted">
            {t(language, "forYou", "noRecommendationsDescription")}
          </p>
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {recommendations.map((candidate) => (
            <div key={candidate.movie.id} className="flex flex-col gap-2">
              <MovieCard
                id={candidate.movie.id}
                title={candidate.movie.title}
                year={candidate.movie.releaseDate?.slice(0, 4) ?? ""}
                rating={candidate.movie.voteAverage}
                voteCount={candidate.movie.voteCount}
                overview={candidate.movie.overview}
                posterUrl={getPosterUrl(candidate.movie.posterPath)}
                cineaMatch={candidate.match}
              />

              <p className="line-clamp-2 text-xs text-muted">
                {candidate.match.explanation}
              </p>

              {candidate.reasons.length > 0 ? (
                <ul className="space-y-1">
                  {candidate.reasons.slice(0, 2).map((reason, index) => (
                    <li
                      key={index}
                      className="line-clamp-1 text-xs text-muted"
                      title={reason.label}
                    >
                      {reason.label}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="line-clamp-1 text-xs text-muted">
                  {t(language, "forYou", "genericExplanation")}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
