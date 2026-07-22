"use client";

import Image from "next/image";
import Link from "next/link";
import { useSettings } from "@/components/SettingsProvider";
import { t } from "@/lib/i18n";
import { getPosterUrl, type MovieDetails } from "@/lib/tmdb";

type CompactRatedMovieCardProps = {
  movie: MovieDetails;
  userRating: number;
  showTmdbRating?: boolean;
};

export default function CompactRatedMovieCard({
  movie,
  userRating,
  showTmdbRating = false,
}: CompactRatedMovieCardProps) {
  const { settings } = useSettings();
  const language = settings.language;
  const posterUrl = getPosterUrl(movie.poster_path);
  const year = movie.release_date?.slice(0, 4) ?? "";
  const hasTmdbRating =
    movie.vote_count > 0 &&
    Number.isFinite(movie.vote_average) &&
    movie.vote_average > 0;

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

        {showTmdbRating ? (
          <>
            <div className="mt-1 flex items-center justify-between text-xs text-muted">
              <span>{year || t(language, "common", "noDate")}</span>

              {hasTmdbRating && (
                <span className="rounded-md bg-surface-elevated px-2 py-1 font-semibold text-foreground">
                  TMDB {movie.vote_average.toFixed(1)}
                </span>
              )}
            </div>

            <div className="mt-auto pt-3">
              <span className="inline-block rounded-md bg-accent px-2 py-1 text-xs font-semibold text-accent-foreground">
                {t(language, "ratings", "yourRatingPrefix")} {userRating} / 10
              </span>
            </div>
          </>
        ) : (
          <div className="mt-auto flex items-center justify-between pt-3 text-xs text-muted">
            <span>{year || t(language, "common", "noDate")}</span>

            <span className="rounded-md bg-accent px-2 py-1 font-semibold text-accent-foreground">
              {userRating} / 10
            </span>
          </div>
        )}
      </div>
    </Link>
  );
}
