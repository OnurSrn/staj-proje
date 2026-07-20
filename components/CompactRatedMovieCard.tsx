import Image from "next/image";
import Link from "next/link";
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
  const posterUrl = getPosterUrl(movie.poster_path);
  const year = movie.release_date?.slice(0, 4) ?? "";
  const hasTmdbRating =
    movie.vote_count > 0 &&
    Number.isFinite(movie.vote_average) &&
    movie.vote_average > 0;

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

        {showTmdbRating ? (
          <>
            <div className="mt-1 flex items-center justify-between text-xs text-neutral-400">
              <span>{year || "Tarih yok"}</span>

              {hasTmdbRating && (
                <span className="rounded-md bg-neutral-800 px-2 py-1 font-semibold text-neutral-300">
                  TMDB {movie.vote_average.toFixed(1)}
                </span>
              )}
            </div>

            <div className="mt-auto pt-3">
              <span className="inline-block rounded-md bg-yellow-400 px-2 py-1 text-xs font-semibold text-black">
                Senin Puanın: {userRating} / 10
              </span>
            </div>
          </>
        ) : (
          <div className="mt-auto flex items-center justify-between pt-3 text-xs text-neutral-400">
            <span>{year || "Tarih yok"}</span>

            <span className="rounded-md bg-yellow-400 px-2 py-1 font-semibold text-black">
              {userRating} / 10
            </span>
          </div>
        )}
      </div>
    </Link>
  );
}
