"use client";

import { useMemo } from "react";
import Link from "next/link";
import CompactRatedMovieCard from "@/components/CompactRatedMovieCard";
import { useMoviesByIds } from "@/components/hooks/useMoviesByIds";
import { useMovieRatings } from "@/components/SavedMoviesProvider";

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
    <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-4">
      <p className="text-xs font-semibold uppercase tracking-widest text-neutral-500">
        {label}
      </p>

      <p className="mt-2 text-2xl font-bold text-white">{value}</p>
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
            className="rounded-xl border border-neutral-800 bg-neutral-900 p-4"
          >
            <div className="h-3 w-20 animate-pulse rounded bg-neutral-800" />
            <div className="mt-3 h-7 w-16 animate-pulse rounded bg-neutral-800" />
          </div>
        ))}
      </div>

      <div className="mt-10 space-y-2">
        {Array.from({ length: 5 }).map((_, index) => (
          <div
            key={index}
            className="h-5 animate-pulse rounded-full bg-neutral-800"
          />
        ))}
      </div>

      <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
        {Array.from({ length: 6 }).map((_, index) => (
          <div
            key={index}
            className="overflow-hidden rounded-xl border border-neutral-800 bg-neutral-900"
          >
            <div className="aspect-[2/3] animate-pulse bg-neutral-800" />

            <div className="space-y-2 p-3">
              <div className="h-4 animate-pulse rounded bg-neutral-800" />
              <div className="h-3 w-2/3 animate-pulse rounded bg-neutral-800" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function RatedMoviesDashboard() {
  const { ratings, isLoaded, getMovieRating } = useMovieRatings();

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

      return a.title.localeCompare(b.title, "tr");
    });
  }, [movies, getMovieRating]);

  if (!isLoaded) {
    return <DashboardSkeleton />;
  }

  if (totalCount === 0) {
    return (
      <div className="mt-10 rounded-2xl border border-dashed border-neutral-700 bg-neutral-900 p-10 text-center">
        <h2 className="text-xl font-semibold">
          Henüz hiçbir filme puan vermedin
        </h2>

        <p className="mt-3 text-neutral-400">
          Bir film detay sayfasından kendi puanını verebilirsin.
        </p>

        <div className="mt-6 flex flex-wrap justify-center gap-4">
          <Link
            href="/"
            className="rounded-lg bg-yellow-400 px-5 py-3 font-semibold text-black transition hover:bg-yellow-300"
          >
            Filmleri Keşfet
          </Link>

          <Link
            href="/search"
            className="rounded-lg border border-neutral-700 px-5 py-3 font-semibold text-neutral-200 transition hover:border-yellow-400 hover:text-yellow-400"
          >
            Film Ara
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-10">
      <section>
        <div className="grid grid-cols-2 gap-4">
          <StatTile label="Toplam Puanlanan Film" value={totalCount.toString()} />
          <StatTile
            label="Ortalama Puan"
            value={average !== null ? `${average.toFixed(1)} / 10` : "-"}
          />
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-xl font-semibold">Puan Dağılımı</h2>

        <ul className="mt-4 space-y-2">
          {distribution.map((bucket) => (
            <li
              key={bucket.label}
              className="flex items-center gap-3 text-sm"
            >
              <span className="w-16 shrink-0 text-neutral-400">
                {bucket.label}
              </span>

              <div
                role="img"
                aria-label={`${bucket.label} puan aralığında ${bucket.count} film`}
                className="h-3 flex-1 overflow-hidden rounded-full bg-neutral-800"
              >
                <div
                  className="h-full rounded-full bg-yellow-400"
                  style={{
                    width: `${(bucket.count / maxBucketCount) * 100}%`,
                  }}
                />
              </div>

              <span className="w-8 shrink-0 text-right text-neutral-300">
                {bucket.count}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-10">
        <h2 className="text-xl font-semibold">Puanladığın Filmler</h2>

        {isLoadingMovies ? (
          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {Array.from({ length: 6 }).map((_, index) => (
              <div
                key={index}
                className="overflow-hidden rounded-xl border border-neutral-800 bg-neutral-900"
              >
                <div className="aspect-[2/3] animate-pulse bg-neutral-800" />

                <div className="space-y-2 p-3">
                  <div className="h-4 animate-pulse rounded bg-neutral-800" />
                  <div className="h-3 w-2/3 animate-pulse rounded bg-neutral-800" />
                </div>
              </div>
            ))}
          </div>
        ) : hasError ? (
          <div className="mt-6 rounded-2xl border border-red-500/40 bg-red-500/10 p-10 text-center">
            <h3 className="text-lg font-semibold text-red-400">
              Film bilgileri yüklenemedi
            </h3>

            <p className="mt-3 text-neutral-400">
              Sayfayı yenileyip tekrar dene.
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
