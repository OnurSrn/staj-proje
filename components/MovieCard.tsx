"use client";

import Image from "next/image";
import Link from "next/link";
import { useSavedMovies } from "@/components/SavedMoviesProvider";
import type { CineaMatch } from "@/lib/cineaMatch";

type MovieCardProps = {
  id: number;
  title: string;
  year: string;
  rating: number;
  voteCount: number;
  overview: string;
  posterUrl: string | null;
  // Yalnızca /for-you tarafından geçirilir — TMDB puan rozetiyle
  // karışmaması için ayrı bir satırda, ayrı bir stille gösterilir (bkz.
  // görev talimatı bölüm 9). Diğer tüm MovieCard kullanıcıları bu prop'u
  // hiç geçirmez, davranışları değişmez.
  cineaMatch?: CineaMatch;
};

function getRatingClass(rating: number) {
  if (rating >= 8) {
    return "bg-success text-white";
  }

  if (rating >= 6) {
    return "bg-accent text-accent-foreground";
  }

  return "bg-danger text-white";
}

export default function MovieCard({
  id,
  title,
  year,
  rating,
  voteCount,
  overview,
  posterUrl,
  cineaMatch,
}: MovieCardProps) {
  const { isFavorite, isInWatchlist } = useSavedMovies();

  const favorite = isFavorite(id);
  const inWatchlist = isInWatchlist(id);
  const hasRating = voteCount > 0 && Number.isFinite(rating) && rating > 0;

  return (
    <Link
      href={`/movie/${id}`}
      className="group flex h-full flex-col overflow-hidden rounded-xl border border-border bg-surface transition duration-200 hover:-translate-y-1 hover:border-accent/60"
    >
      <div className="relative aspect-[2/3] overflow-hidden bg-surface-elevated">
        {(favorite || inWatchlist) && (
          <div className="absolute left-2 top-2 z-10 flex flex-wrap gap-1">
            {favorite && (
              <span className="rounded-full bg-danger/90 px-2 py-0.5 text-[10px] font-semibold text-white shadow">
                ♥ Favorite
              </span>
            )}

            {inWatchlist && (
              <span className="rounded-full bg-success/90 px-2 py-0.5 text-[10px] font-semibold text-white shadow">
                Watchlist
              </span>
            )}
          </div>
        )}

        {posterUrl ? (
          <Image
            src={posterUrl}
            alt={`${title} poster`}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 16vw"
            className="object-cover transition duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center px-4 text-center text-xs text-muted">
            Poster bulunamadı
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col p-3">
        <h3 className="line-clamp-1 text-base font-semibold text-foreground">
          {title}
        </h3>

        <p className="mt-1 line-clamp-2 text-xs leading-5 text-muted">
          {overview || "Bu film için açıklama bulunmuyor."}
        </p>

        {cineaMatch && (
          <div
            className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1"
            role="group"
            aria-label={`CiNeA Match yüzde ${cineaMatch.percentage}, ${cineaMatch.label}`}
          >
            <span className="whitespace-nowrap rounded-md border border-accent/40 bg-surface-elevated px-2 py-1 text-[11px] font-semibold text-accent">
              %{cineaMatch.percentage} CiNeA Match
            </span>

            <span className="truncate text-[11px] text-muted">
              {cineaMatch.label}
            </span>
          </div>
        )}

        <div className="mt-auto flex items-center justify-between pt-3 text-xs text-muted">
          <span>{year || "Tarih yok"}</span>

          {hasRating && (
            <span
              className={`rounded-md px-2 py-1 font-semibold ${getRatingClass(
                rating
              )}`}
            >
              {rating.toFixed(1)}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
