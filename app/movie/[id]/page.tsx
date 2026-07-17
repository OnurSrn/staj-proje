import Image from "next/image";
import CastCard from "@/components/CastCard";
import MovieActions from "@/components/MovieActions";
import MovieCard from "@/components/MovieCard";
import {
  getBackdropUrl,
  getMovieDetails,
  getPosterUrl,
  getProfileUrl,
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

  const cast = movie.credits.cast.slice(0, 10);

  const trailer =
    movie.videos.results.find(
      (video) =>
        video.site === "YouTube" &&
        video.type === "Trailer" &&
        video.official
    ) ??
    movie.videos.results.find(
      (video) => video.site === "YouTube" && video.type === "Trailer"
    );

  const recommendations = movie.recommendations.results.slice(0, 5);

  return (
    <main className="min-h-screen bg-neutral-950 text-white">
      <section className="relative overflow-hidden">
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

        <div className="relative mx-auto max-w-7xl px-6 py-16">
          <div className="grid gap-10 md:grid-cols-[280px_1fr]">
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
                <div className="flex h-full items-center justify-center px-4 text-center text-neutral-500">
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

              <MovieActions movieId={movie.id} />
            </div>
          </div>
        </div>
      </section>

      {trailer && (
        <section className="mx-auto max-w-7xl px-6 py-16">
          <div className="mb-6">
            <p className="text-sm font-semibold uppercase tracking-widest text-yellow-400">
              Official Video
            </p>

            <h2 className="mt-3 text-3xl font-bold">Fragman</h2>
          </div>

          <div className="aspect-video overflow-hidden rounded-2xl border border-neutral-800 bg-black">
            <iframe
              src={`https://www.youtube.com/embed/${trailer.key}`}
              title={`${movie.title} fragmanı`}
              className="h-full w-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </section>
      )}

      {cast.length > 0 && (
        <section className="mx-auto max-w-7xl px-6 py-16">
          <div className="mb-8">
            <p className="text-sm font-semibold uppercase tracking-widest text-yellow-400">
              Cast
            </p>

            <h2 className="mt-3 text-3xl font-bold">Oyuncular</h2>
          </div>

          <div className="grid gap-6 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {cast.map((castMember) => (
              <CastCard
                key={castMember.id}
                name={castMember.name}
                character={castMember.character}
                profileUrl={getProfileUrl(castMember.profile_path)}
              />
            ))}
          </div>
        </section>
      )}

      {recommendations.length > 0 && (
        <section className="mx-auto max-w-7xl px-6 py-16">
          <div className="mb-8">
            <p className="text-sm font-semibold uppercase tracking-widest text-yellow-400">
              You May Also Like
            </p>

            <h2 className="mt-3 text-3xl font-bold">Benzer Filmler</h2>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {recommendations.map((recommendedMovie) => (
              <MovieCard
                key={recommendedMovie.id}
                id={recommendedMovie.id}
                title={recommendedMovie.title}
                year={recommendedMovie.release_date?.slice(0, 4) ?? ""}
                rating={recommendedMovie.vote_average}
                overview={recommendedMovie.overview}
                posterUrl={getPosterUrl(recommendedMovie.poster_path)}
              />
            ))}
          </div>
        </section>
      )}
    </main>
  );
}