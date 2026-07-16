import MovieCard from "@/components/MovieCard";
import { getPopularMovies, getPosterUrl } from "@/lib/tmdb";

export default async function Home() {
  const movies = await getPopularMovies();

  return (
    <main className="min-h-screen bg-neutral-950 text-white">
      <section className="mx-auto max-w-7xl px-6 py-8">
        <nav className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-yellow-400">
            CineScope
          </h1>

          <div className="flex gap-6 text-sm text-neutral-300">
            <a href="#" className="transition hover:text-yellow-400">
              Movies
            </a>

            <a href="#" className="transition hover:text-yellow-400">
              Search
            </a>

            <a href="#" className="transition hover:text-yellow-400">
              Favorites
            </a>
          </div>
        </nav>

        <section className="py-20">
          <p className="mb-4 text-sm font-semibold uppercase tracking-widest text-yellow-400">
            Movie Discovery App
          </p>

          <h2 className="max-w-3xl text-4xl font-bold leading-tight sm:text-5xl">
            Discover movies, explore details, and build your own watchlist.
          </h2>

          <p className="mt-6 max-w-2xl text-lg text-neutral-400">
            Popüler filmler TMDB API üzerinden gerçek zamanlı olarak
            yükleniyor.
          </p>

          <div className="mt-8 flex flex-wrap gap-4">
            <button className="rounded-lg bg-yellow-400 px-6 py-3 font-semibold text-black transition hover:bg-yellow-300">
              Explore Movies
            </button>

            <button className="rounded-lg border border-neutral-700 px-6 py-3 font-semibold text-white transition hover:border-yellow-400 hover:text-yellow-400">
              Search
            </button>
          </div>
        </section>

        <section className="pb-20">
          <div className="mb-6">
            <h3 className="text-2xl font-bold">
              Popular Movies
            </h3>

            <p className="mt-1 text-sm text-neutral-500">
              TMDB API üzerinden getirilen {movies.length} film
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {movies.map((movie) => (
              <MovieCard
                key={movie.id}
                id={movie.id}
                title={movie.title}
                year={movie.release_date?.slice(0, 4) ?? ""}
                rating={movie.vote_average}
                overview={movie.overview}
                posterUrl={getPosterUrl(movie.poster_path)}
              />
            ))}
          </div>
        </section>
      </section>
    </main>
  );
}