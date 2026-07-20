"use client";

import { useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { useMoviesByIds } from "@/components/hooks/useMoviesByIds";
import {
  useMovieRatings,
  useWatchStatuses,
  type WatchStatus,
} from "@/components/SavedMoviesProvider";
import { getPosterUrl, type MovieDetails } from "@/lib/tmdb";

const STATUS_LABELS: Record<WatchStatus, string> = {
  watched: "İzledim",
  watching: "İzliyorum",
  dropped: "Yarım Bıraktım",
  "plan-to-watch": "Daha Sonra İzle",
};

const STATUS_BADGE_CLASSES: Record<WatchStatus, string> = {
  watched: "bg-green-500 text-black",
  watching: "bg-yellow-400 text-black",
  dropped: "bg-red-500 text-white",
  "plan-to-watch": "bg-neutral-700 text-neutral-100",
};

// İzliyorum ve Daha Sonra İzle bölümleri fetch sırasını (statuses
// objesinin anahtar sırasını) korur; İzledim ve Yarım Bıraktım alfabetik
// sıralanır. Henüz tarih bilgisi saklanmadığından "en son eklenen" gibi
// bir sıralama iddia edilmiyor.
const SECTION_ORDER: {
  status: WatchStatus;
  title: string;
  sortAlphabetically: boolean;
}[] = [
  { status: "watching", title: "İzliyorum", sortAlphabetically: false },
  {
    status: "plan-to-watch",
    title: "Daha Sonra İzle",
    sortAlphabetically: false,
  },
  { status: "watched", title: "İzledim", sortAlphabetically: true },
  { status: "dropped", title: "Yarım Bıraktım", sortAlphabetically: true },
];

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

function WatchActivityMovieCard({
  movie,
  status,
  personalRating,
}: {
  movie: MovieDetails;
  status: WatchStatus;
  personalRating: number | null;
}) {
  const posterUrl = getPosterUrl(movie.poster_path);
  const year = movie.release_date?.slice(0, 4) ?? "";

  return (
    <Link
      href={`/movie/${movie.id}`}
      className="group flex h-full flex-col overflow-hidden rounded-xl border border-neutral-800 bg-neutral-900 transition duration-200 hover:-translate-y-1 hover:border-yellow-400/60"
    >
      <div className="relative aspect-[2/3] overflow-hidden bg-neutral-800">
        {posterUrl ? (
          <Image
            src={posterUrl}
            alt={`${movie.title} poster`}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 16vw"
            className="object-cover transition duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center px-4 text-center text-xs text-neutral-500">
            Poster bulunamadı
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col p-3">
        <h3 className="line-clamp-1 text-base font-semibold text-white">
          {movie.title}
        </h3>

        <div className="mt-1 flex items-center justify-between text-xs text-neutral-400">
          <span>{year || "Tarih yok"}</span>

          {personalRating !== null && (
            <span className="text-neutral-500">{personalRating} / 10</span>
          )}
        </div>

        <div className="mt-auto pt-3">
          <span
            className={`inline-block rounded-md px-2 py-1 text-xs font-semibold ${STATUS_BADGE_CLASSES[status]}`}
          >
            {STATUS_LABELS[status]}
          </span>
        </div>
      </div>
    </Link>
  );
}

function DashboardSkeleton() {
  return (
    <div className="mt-10">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
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

export default function WatchActivityDashboard() {
  const { statuses, isLoaded, getWatchStatus } = useWatchStatuses();
  const { getMovieRating } = useMovieRatings();

  const movieIds = useMemo(
    () => Object.keys(statuses).map(Number),
    [statuses]
  );

  const { movies, isLoading, hasError } = useMoviesByIds(movieIds);

  const counts = useMemo(() => {
    const result: Record<WatchStatus, number> = {
      watched: 0,
      watching: 0,
      dropped: 0,
      "plan-to-watch": 0,
    };

    for (const status of Object.values(statuses)) {
      result[status] += 1;
    }

    return result;
  }, [statuses]);

  const totalCount = movieIds.length;

  const moviesByStatus = useMemo(() => {
    const grouped: Record<WatchStatus, MovieDetails[]> = {
      watched: [],
      watching: [],
      dropped: [],
      "plan-to-watch": [],
    };

    for (const movie of movies) {
      const status = getWatchStatus(movie.id);

      if (status) {
        grouped[status].push(movie);
      }
    }

    grouped.watched.sort((a, b) => a.title.localeCompare(b.title, "tr"));
    grouped.dropped.sort((a, b) => a.title.localeCompare(b.title, "tr"));

    return grouped;
  }, [movies, getWatchStatus]);

  if (!isLoaded) {
    return <DashboardSkeleton />;
  }

  if (totalCount === 0) {
    return (
      <div className="mt-10 rounded-2xl border border-dashed border-neutral-700 bg-neutral-900 p-10 text-center">
        <h2 className="text-xl font-semibold">
          Henüz izleme aktiviten yok
        </h2>

        <p className="mt-3 text-neutral-400">
          Bir film detay sayfasından izleme durumunu işaretleyebilirsin.
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
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatTile label="İzlenen" value={counts.watched.toString()} />
          <StatTile
            label="Şu An İzlenen"
            value={counts.watching.toString()}
          />
          <StatTile
            label="Yarım Bırakılan"
            value={counts.dropped.toString()}
          />
          <StatTile
            label="İzleme Planında"
            value={counts["plan-to-watch"].toString()}
          />
        </div>
      </section>

      {isLoading ? (
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
        SECTION_ORDER.map((section) => {
          const sectionMovies = moviesByStatus[section.status];

          if (sectionMovies.length === 0) {
            return null;
          }

          return (
            <section key={section.status} className="mt-10">
              <h2 className="text-xl font-semibold">{section.title}</h2>

              <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                {sectionMovies.map((movie) => (
                  <WatchActivityMovieCard
                    key={movie.id}
                    movie={movie}
                    status={section.status}
                    personalRating={getMovieRating(movie.id)}
                  />
                ))}
              </div>
            </section>
          );
        })
      )}
    </div>
  );
}
