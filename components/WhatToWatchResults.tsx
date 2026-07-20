import Link from "next/link";
import MovieCard from "@/components/MovieCard";
import { getPosterUrl, type TmdbMovie } from "@/lib/tmdb";

type WhatToWatchResultsProps = {
  movies: TmdbMovie[];
  description: string;
};

export default function WhatToWatchResults({
  movies,
  description,
}: WhatToWatchResultsProps) {
  return (
    <section className="mt-12">
      <div className="mb-7 rounded-xl border border-yellow-400/20 bg-yellow-400/5 p-4">
        <p className="text-sm font-semibold text-yellow-400">
          Senin İçin Seçtiklerimiz
        </p>

        <p className="mt-1 text-sm text-neutral-300">{description}</p>
      </div>

      {movies.length > 0 ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {movies.map((movie) => (
            <MovieCard
              key={movie.id}
              id={movie.id}
              title={movie.title}
              year={movie.release_date?.slice(0, 4) ?? ""}
              rating={movie.vote_average}
              voteCount={movie.vote_count}
              overview={movie.overview}
              posterUrl={getPosterUrl(movie.poster_path)}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-neutral-700 bg-neutral-900 p-10 text-center">
          <h3 className="text-xl font-semibold">
            Bu tercihlerle film bulunamadı
          </h3>

          <p className="mt-3 text-neutral-400">
            Daha geniş tercihler dene — örneğin süreyi &quot;Fark
            etmez&quot; yap ya da türü kaldır.
          </p>

          <Link
            href="/what-to-watch"
            className="mt-6 inline-block rounded-lg bg-yellow-400 px-5 py-3 font-semibold text-black transition hover:bg-yellow-300"
          >
            Formu Sıfırla
          </Link>
        </div>
      )}
    </section>
  );
}
