"use client";

import { useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { useMoviesByIds } from "@/components/hooks/useMoviesByIds";
import { useSettings } from "@/components/SettingsProvider";
import {
  useMovieRatings,
  useWatchStatuses,
  type WatchStatus,
} from "@/components/SavedMoviesProvider";
import { t } from "@/lib/i18n";
import { getPosterUrl, type MovieDetails } from "@/lib/tmdb";
import type { AppLanguage } from "@/lib/settings";

const STATUS_KEY: Record<WatchStatus, "watched" | "watching" | "dropped" | "planToWatch"> = {
  watched: "watched",
  watching: "watching",
  dropped: "dropped",
  "plan-to-watch": "planToWatch",
};

const STATUS_BADGE_CLASSES: Record<WatchStatus, string> = {
  watched: "bg-success text-white",
  watching: "bg-accent text-accent-foreground",
  dropped: "bg-danger text-white",
  "plan-to-watch": "bg-surface-elevated text-foreground",
};

function getStatusLabel(language: AppLanguage, status: WatchStatus): string {
  return t(language, "ratingStatus", STATUS_KEY[status]);
}

// İzliyorum ve Daha Sonra İzle bölümleri fetch sırasını (statuses
// objesinin anahtar sırasını) korur; İzledim ve Yarım Bıraktım alfabetik
// sıralanır. Henüz tarih bilgisi saklanmadığından "en son eklenen" gibi
// bir sıralama iddia edilmiyor.
const SECTION_ORDER: WatchStatus[] = [
  "watching",
  "plan-to-watch",
  "watched",
  "dropped",
];

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

function WatchActivityMovieCard({
  movie,
  status,
  personalRating,
  language,
}: {
  movie: MovieDetails;
  status: WatchStatus;
  personalRating: number | null;
  language: AppLanguage;
}) {
  const posterUrl = getPosterUrl(movie.poster_path);
  const year = movie.release_date?.slice(0, 4) ?? "";

  return (
    <Link
      href={`/movie/${movie.id}`}
      className="group flex h-full flex-col overflow-hidden rounded-xl border border-border bg-surface transition duration-200 hover:-translate-y-1 hover:border-accent/60"
    >
      <div className="relative aspect-[2/3] overflow-hidden bg-surface-elevated">
        {posterUrl ? (
          <Image
            src={posterUrl}
            alt={`${movie.title} poster`}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 16vw"
            className="object-cover transition duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center px-4 text-center text-xs text-muted">
            {t(language, "common", "noPoster")}
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col p-3">
        <h3 className="line-clamp-1 text-base font-semibold text-foreground">
          {movie.title}
        </h3>

        <div className="mt-1 flex items-center justify-between text-xs text-muted">
          <span>{year || t(language, "common", "noDate")}</span>

          {personalRating !== null && (
            <span className="text-muted">{personalRating} / 10</span>
          )}
        </div>

        <div className="mt-auto pt-3">
          <span
            className={`inline-block rounded-md px-2 py-1 text-xs font-semibold ${STATUS_BADGE_CLASSES[status]}`}
          >
            {getStatusLabel(language, status)}
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
            className="rounded-xl border border-border bg-surface p-4"
          >
            <div className="h-3 w-20 animate-pulse rounded bg-surface-elevated" />
            <div className="mt-3 h-7 w-16 animate-pulse rounded bg-surface-elevated" />
          </div>
        ))}
      </div>

      <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {Array.from({ length: 5 }).map((_, index) => (
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

export default function WatchActivityDashboard() {
  const { statuses, isLoaded, getWatchStatus } = useWatchStatuses();
  const { getMovieRating } = useMovieRatings();
  const { settings } = useSettings();
  const language = settings.language;

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

    const localeTag = language === "tr" ? "tr" : "en";

    grouped.watched.sort((a, b) => a.title.localeCompare(b.title, localeTag));
    grouped.dropped.sort((a, b) => a.title.localeCompare(b.title, localeTag));

    return grouped;
  }, [movies, getWatchStatus, language]);

  if (!isLoaded) {
    return <DashboardSkeleton />;
  }

  if (totalCount === 0) {
    return (
      <div className="mt-10 rounded-2xl border border-dashed border-border-strong bg-surface p-10 text-center">
        <h2 className="text-xl font-semibold">
          {t(language, "activity", "emptyTitle")}
        </h2>

        <p className="mt-3 text-muted">
          {t(language, "activity", "emptyDescription")}
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
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatTile
            label={t(language, "activity", "statWatched")}
            value={counts.watched.toString()}
          />
          <StatTile
            label={t(language, "activity", "statWatching")}
            value={counts.watching.toString()}
          />
          <StatTile
            label={t(language, "activity", "statDropped")}
            value={counts.dropped.toString()}
          />
          <StatTile
            label={t(language, "activity", "statPlanToWatch")}
            value={counts["plan-to-watch"].toString()}
          />
        </div>
      </section>

      {isLoading ? (
        <DashboardSkeleton />
      ) : hasError ? (
        <div className="mt-10 rounded-2xl border border-danger/40 bg-danger/10 p-10 text-center">
          <h2 className="text-xl font-semibold text-danger">
            {t(language, "ratings", "movieInfoErrorTitle")}
          </h2>

          <p className="mt-3 text-muted">
            {t(language, "common", "loadErrorDescription")}
          </p>
        </div>
      ) : (
        SECTION_ORDER.map((status) => {
          const sectionMovies = moviesByStatus[status];

          if (sectionMovies.length === 0) {
            return null;
          }

          return (
            <section key={status} className="mt-10">
              <h2 className="text-xl font-semibold">
                {getStatusLabel(language, status)}
              </h2>

              <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                {sectionMovies.map((movie) => (
                  <WatchActivityMovieCard
                    key={movie.id}
                    movie={movie}
                    status={status}
                    personalRating={getMovieRating(movie.id)}
                    language={language}
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
