"use client";

import { useMemo } from "react";
import Link from "next/link";
import CompactRatedMovieCard from "@/components/CompactRatedMovieCard";
import { useMoviesByIds } from "@/components/hooks/useMoviesByIds";
import { useMovieRatings, useSavedMovies } from "@/components/SavedMoviesProvider";

type GenreStat = {
  id: number;
  name: string;
  count: number;
  totalScore: number;
};

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

function getTasteSummary(average: number | null): string | null {
  if (average === null) {
    return null;
  }

  if (average >= 8) {
    return "Seçici ama sevdiğinde yüksek puan veriyorsun.";
  }

  if (average >= 6) {
    return "Dengeli bir puanlama eğilimin var.";
  }

  return "Filmleri daha eleştirel değerlendiriyorsun.";
}

function DashboardSkeleton() {
  return (
    <div className="mt-10">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <div
            key={index}
            className="rounded-xl border border-neutral-800 bg-neutral-900 p-4"
          >
            <div className="h-3 w-20 animate-pulse rounded bg-neutral-800" />
            <div className="mt-3 h-7 w-16 animate-pulse rounded bg-neutral-800" />
          </div>
        ))}
      </div>

      <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {Array.from({ length: 5 }).map((_, index) => (
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

export default function ProfileDashboard() {
  const { favoriteIds, watchlistIds } = useSavedMovies();
  const { ratings, isLoaded, getMovieRating } = useMovieRatings();

  const ratedMovieIds = useMemo(
    () => Object.keys(ratings).map(Number),
    [ratings]
  );
  const ratingValues = useMemo(() => Object.values(ratings), [ratings]);

  const { movies, isLoading: isLoadingMovies, hasError } =
    useMoviesByIds(ratedMovieIds);

  const totalRated = ratingValues.length;
  const average =
    totalRated > 0
      ? ratingValues.reduce((sum, value) => sum + value, 0) / totalRated
      : null;
  const highest = totalRated > 0 ? Math.max(...ratingValues) : null;
  const lowest = totalRated > 0 ? Math.min(...ratingValues) : null;
  const tasteSummary = getTasteSummary(average);

  const topGenres = useMemo(() => {
    const genreStats = new Map<number, GenreStat>();

    for (const movie of movies) {
      const rating = getMovieRating(movie.id);

      if (rating === null) {
        continue;
      }

      for (const genre of movie.genres) {
        const existing = genreStats.get(genre.id);

        if (existing) {
          existing.count += 1;
          existing.totalScore += rating;
        } else {
          genreStats.set(genre.id, {
            id: genre.id,
            name: genre.name,
            count: 1,
            totalScore: rating,
          });
        }
      }
    }

    return Array.from(genreStats.values())
      .sort((a, b) => {
        if (b.totalScore !== a.totalScore) {
          return b.totalScore - a.totalScore;
        }

        return b.count - a.count;
      })
      .slice(0, 5);
  }, [movies, getMovieRating]);

  const favoriteMovies = useMemo(() => {
    return [...movies]
      .filter((movie) => getMovieRating(movie.id) !== null)
      .sort((a, b) => {
        const ratingA = getMovieRating(a.id) ?? 0;
        const ratingB = getMovieRating(b.id) ?? 0;

        if (ratingB !== ratingA) {
          return ratingB - ratingA;
        }

        return a.title.localeCompare(b.title, "tr");
      })
      .slice(0, 5);
  }, [movies, getMovieRating]);

  if (!isLoaded) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="mt-10">
      <section>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <StatTile
            label="Favori Film"
            value={favoriteIds.length.toString()}
          />
          <StatTile
            label="Watchlist Film"
            value={watchlistIds.length.toString()}
          />
          <StatTile
            label="Puanlanan Film"
            value={totalRated.toString()}
          />
          <StatTile
            label="Ortalama Puan"
            value={average !== null ? `${average.toFixed(1)} / 10` : "-"}
          />
          <StatTile
            label="En Yüksek Puan"
            value={highest !== null ? `${highest} / 10` : "-"}
          />
          <StatTile
            label="En Düşük Puan"
            value={lowest !== null ? `${lowest} / 10` : "-"}
          />
        </div>
      </section>

      {tasteSummary && (
        <section className="mt-8 rounded-xl border border-yellow-400/20 bg-yellow-400/5 p-5">
          <p className="text-sm font-semibold uppercase tracking-widest text-yellow-400">
            Değerlendirme Eğilimin
          </p>

          <p className="mt-2 text-neutral-200">{tasteSummary}</p>
        </section>
      )}

      {totalRated === 0 ? (
        <div className="mt-10 rounded-2xl border border-dashed border-neutral-700 bg-neutral-900 p-10 text-center">
          <h2 className="text-xl font-semibold">
            Zevk özeti için henüz veri yok
          </h2>

          <p className="mt-3 text-neutral-400">
            Filmlere puan vermeye başladığında burada tür tercihlerini ve en
            sevdiğin filmleri görebilirsin.
          </p>

          <div className="mt-6 flex flex-wrap justify-center gap-4">
            <Link
              href="/"
              className="rounded-lg bg-yellow-400 px-5 py-3 font-semibold text-black transition hover:bg-yellow-300"
            >
              Filmleri Keşfet
            </Link>

            <Link
              href="/ratings"
              className="rounded-lg border border-neutral-700 px-5 py-3 font-semibold text-neutral-200 transition hover:border-yellow-400 hover:text-yellow-400"
            >
              Ratings Sayfasına Git
            </Link>
          </div>
        </div>
      ) : isLoadingMovies ? (
        <DashboardSkeleton />
      ) : hasError ? (
        <div className="mt-10 rounded-2xl border border-red-500/40 bg-red-500/10 p-10 text-center">
          <h2 className="text-xl font-semibold text-red-400">
            Film bilgileri yüklenemedi
          </h2>

          <p className="mt-3 text-neutral-400">
            Sayfayı yenileyip tekrar dene.
          </p>
        </div>
      ) : (
        <>
          <section className="mt-10">
            <h2 className="text-xl font-semibold">En Çok Puanladığın Türler</h2>

            {topGenres.length > 0 ? (
              <ul className="mt-4 space-y-2">
                {topGenres.map((genre) => (
                  <li
                    key={genre.id}
                    className="flex items-center justify-between rounded-lg border border-neutral-800 bg-neutral-900 px-4 py-3"
                  >
                    <span className="font-semibold text-white">
                      {genre.name}
                    </span>

                    <span className="text-sm text-neutral-400">
                      {genre.count} film · Ortalama{" "}
                      {(genre.totalScore / genre.count).toFixed(1)} / 10
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-4 text-neutral-400">
                Tür istatistiği için yeterli veri yok.
              </p>
            )}
          </section>

          <section className="mt-10">
            <h2 className="text-xl font-semibold">En Sevdiğin Filmler</h2>

            {favoriteMovies.length > 0 ? (
              <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                {favoriteMovies.map((movie) => (
                  <CompactRatedMovieCard
                    key={movie.id}
                    movie={movie}
                    userRating={getMovieRating(movie.id) ?? 0}
                  />
                ))}
              </div>
            ) : (
              <p className="mt-4 text-neutral-400">
                Gösterilecek film bulunamadı.
              </p>
            )}
          </section>
        </>
      )}
    </div>
  );
}
