"use client";

import { useMemo } from "react";
import Link from "next/link";
import CompactRatedMovieCard from "@/components/CompactRatedMovieCard";
import { useMoviesByIds } from "@/components/hooks/useMoviesByIds";
import { useMovieRatings } from "@/components/SavedMoviesProvider";
import { useSettings } from "@/components/SettingsProvider";
import { buildRatingDistributionAriaLabel, t } from "@/lib/i18n";

const DISTRIBUTION_BUCKETS = [
  { label: "1 - 2", min: 0, max: 2 },
  { label: "3 - 4", min: 2, max: 4 },
  { label: "5 - 6", min: 4, max: 6 },
  { label: "7 - 8", min: 6, max: 8 },
  { label: "9 - 10", min: 8, max: 10 },
];

function getDistribution(values: number[]) {
  return DISTRIBUTION_BUCKETS.map((bucket) => ({
    label: bucket.label,
    count: values.filter((value) => value > bucket.min && value <= bucket.max)
      .length,
  }));
}

function StatTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <p className="text-xs font-semibold uppercase tracking-widest text-muted">
        {label}
      </p>

      <p className="mt-2 text-2xl font-bold text-foreground">{value}</p>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="mt-10">
      <div className="grid grid-cols-2 gap-4">
        {Array.from({ length: 2 }).map((_, index) => (
          <div
            key={index}
            className="rounded-xl border border-border bg-surface p-4"
          >
            <div className="h-3 w-20 animate-pulse rounded bg-surface-elevated" />
            <div className="mt-3 h-7 w-16 animate-pulse rounded bg-surface-elevated" />
          </div>
        ))}
      </div>

      <div className="mt-10 space-y-2">
        {Array.from({ length: 5 }).map((_, index) => (
          <div
            key={index}
            className="h-5 animate-pulse rounded-full bg-surface-elevated"
          />
        ))}
      </div>

      <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
        {Array.from({ length: 6 }).map((_, index) => (
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
    </div>
  );
}

export default function RatedMoviesDashboard() {
  const { ratings, isLoaded, getMovieRating } = useMovieRatings();
  const { settings } = useSettings();
  const language = settings.language;

  const movieIds = useMemo(() => Object.keys(ratings).map(Number), [ratings]);
  const ratingValues = useMemo(() => Object.values(ratings), [ratings]);

  const { movies, isLoading: isLoadingMovies, hasError } =
    useMoviesByIds(movieIds);

  const totalCount = ratingValues.length;
  const average =
    totalCount > 0
      ? ratingValues.reduce((sum, value) => sum + value, 0) / totalCount
      : null;

  const distribution = useMemo(
    () => getDistribution(ratingValues),
    [ratingValues]
  );
  const maxBucketCount = Math.max(
    1,
    ...distribution.map((bucket) => bucket.count)
  );

  const sortedMovies = useMemo(() => {
    return [...movies].sort((a, b) => {
      const ratingA = getMovieRating(a.id) ?? 0;
      const ratingB = getMovieRating(b.id) ?? 0;

      if (ratingB !== ratingA) {
        return ratingB - ratingA;
      }

      return a.title.localeCompare(b.title, language === "tr" ? "tr" : "en");
    });
  }, [movies, getMovieRating, language]);

  if (!isLoaded) {
    return <DashboardSkeleton />;
  }

  if (totalCount === 0) {
    return (
      <div className="mt-10 rounded-2xl border border-dashed border-border-strong bg-surface p-10 text-center">
        <h2 className="text-xl font-semibold">
          {t(language, "ratings", "emptyTitle")}
        </h2>

        <p className="mt-3 text-muted">
          {t(language, "ratings", "emptyDescription")}
        </p>

        <div className="mt-6 flex flex-wrap justify-center gap-4">
          <Link
            href="/"
            className="rounded-lg bg-accent px-5 py-3 font-semibold text-accent-foreground transition hover:bg-accent-hover"
          >
            {t(language, "common", "exploreMovies")}
          </Link>

          <Link
            href="/search"
            className="rounded-lg border border-border px-5 py-3 font-semibold text-foreground transition hover:border-accent hover:text-accent"
          >
            {t(language, "common", "searchMoviesCta")}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-10">
      <section>
        <div className="grid grid-cols-2 gap-4">
          <StatTile
            label={t(language, "ratings", "totalRated")}
            value={totalCount.toString()}
          />
          <StatTile
            label={t(language, "ratings", "averageRating")}
            value={average !== null ? `${average.toFixed(1)} / 10` : "-"}
          />
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-xl font-semibold">
          {t(language, "ratings", "distributionHeading")}
        </h2>

        <ul className="mt-4 space-y-2">
          {distribution.map((bucket) => (
            <li
              key={bucket.label}
              className="flex items-center gap-3 text-sm"
            >
              <span className="w-16 shrink-0 text-muted">
                {bucket.label}
              </span>

              <div
                role="img"
                aria-label={buildRatingDistributionAriaLabel(
                  language,
                  bucket.label,
                  bucket.count
                )}
                className="h-3 flex-1 overflow-hidden rounded-full bg-surface-elevated"
              >
                <div
                  className="h-full rounded-full bg-accent"
                  style={{
                    width: `${(bucket.count / maxBucketCount) * 100}%`,
                  }}
                />
              </div>

              <span className="w-8 shrink-0 text-right text-foreground">
                {bucket.count}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-10">
        <h2 className="text-xl font-semibold">
          {t(language, "ratings", "ratedMoviesHeading")}
        </h2>

        {isLoadingMovies ? (
          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {Array.from({ length: 6 }).map((_, index) => (
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
        ) : hasError ? (
          <div className="mt-6 rounded-2xl border border-danger/40 bg-danger/10 p-10 text-center">
            <h3 className="text-lg font-semibold text-danger">
              {t(language, "ratings", "movieInfoErrorTitle")}
            </h3>

            <p className="mt-3 text-muted">
              {t(language, "common", "loadErrorDescription")}
            </p>
          </div>
        ) : (
          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {sortedMovies.map((movie) => (
              <CompactRatedMovieCard
                key={movie.id}
                movie={movie}
                userRating={getMovieRating(movie.id) ?? 0}
                showTmdbRating
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
