import Image from "next/image";
import Link from "next/link";
import {
  getBackdropUrl,
  getMovieDetails,
  getPosterUrl,
} from "@/lib/tmdb";

type MovieDetailsPageProps = {
  params: Promise<{
    id: string;
  }>;
};

function formatRuntime(runtime: number | null) {
  if (!runtime) {
    return "Süre bilgisi yok";
  }

  const hours = Math.floor(runtime / 60);
  const minutes = runtime % 60;

  if (hours === 0) {
    return `${minutes} dakika`;
  }

  return `${hours} saat ${minutes} dakika`;
}

export default async function MovieDetailsPage({
  params,
}: MovieDetailsPageProps) {
  const { id } = await params;
  const movie = await getMovieDetails(id);

  const posterUrl = getPosterUrl(movie.poster_path);
  const backdropUrl = getBackdropUrl(movie.backdrop_path);

  return (
    <main className="min-h-screen bg-neutral-950 text-white">
      <section className="relative min-h-screen overflow-hidden">
        {backdropUrl && (
          <Image
            src={backdropUrl}
            alt={`${movie.title} backdrop`}
            fill
            priority
            sizes="100vw"
            className="object-cover opacity-30"
          />
        )}

        <div className="absolute inset-0 bg-gradient-to-b from-neutral-950/40 via-neutral-950/80 to-neutral-950" />

        <div className="relative mx-auto max-w-7xl px-6 py-8">
          <nav className="flex items-center justify-between">
            <Link href="/" className="text-2xl font-bold text-yellow-400">
              CineScope
            </Link>

            <Link
              href="/"
              className="rounded-lg border border-neutral-700 px-4 py-2 text-sm transition hover:border-yellow-400 hover:text-yellow-400"
            >
              Ana sayfaya dön
            </Link>
          </nav>

          <div className="grid gap-10 pb-16 pt-20 md:grid-cols-[280px_1fr]">
            <div className="relative aspect-[2/3] overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-900 shadow-2xl">
              {posterUrl ? (
                <Image
                  src={posterUrl}
                  alt={`${movie.title} poster`}
                  fill
                  priority
                  sizes="(max-width: 768px) 100vw, 280px"
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-neutral-500">
                  Poster bulunamadı
                </div>
              )}
            </div>

            <div className="flex flex-col justify-center">
              <p className="text-sm font-semibold uppercase tracking-widest text-yellow-400">
                Film Detayları
              </p>

              <h1 className="mt-4 text-4xl font-bold sm:text-5xl">
                {movie.title}
              </h1>

              {movie.tagline && (
                <p className="mt-3 text-lg italic text-neutral-400">
                  “{movie.tagline}”
                </p>
              )}

              <div className="mt-6 flex flex-wrap gap-3 text-sm">
                <span className="rounded-full bg-yellow-400 px-3 py-1 font-semibold text-black">
                  Puan: {movie.vote_average.toFixed(1)}
                </span>

                <span className="rounded-full border border-neutral-700 px-3 py-1 text-neutral-300">
                  {movie.release_date?.slice(0, 4) || "Tarih yok"}
                </span>

                <span className="rounded-full border border-neutral-700 px-3 py-1 text-neutral-300">
                  {formatRuntime(movie.runtime)}
                </span>

                <span className="rounded-full border border-neutral-700 px-3 py-1 uppercase text-neutral-300">
                  {movie.original_language}
                </span>
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                {movie.genres.map((genre) => (
                  <span
                    key={genre.id}
                    className="rounded-md bg-neutral-800 px-3 py-1 text-sm text-neutral-300"
                  >
                    {genre.name}
                  </span>
                ))}
              </div>

              <section className="mt-8 max-w-3xl">
                <h2 className="text-xl font-semibold">Özet</h2>

                <p className="mt-3 leading-7 text-neutral-300">
                  {movie.overview || "Bu film için açıklama bulunmuyor."}
                </p>
              </section>

              <div className="mt-8 flex flex-wrap gap-4">
                <button className="rounded-lg bg-yellow-400 px-6 py-3 font-semibold text-black transition hover:bg-yellow-300">
                  Favorilere Ekle
                </button>

                <button className="rounded-lg border border-neutral-700 px-6 py-3 font-semibold transition hover:border-yellow-400 hover:text-yellow-400">
                  Watchlist&apos;e Ekle
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}