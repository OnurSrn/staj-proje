import MovieCard from "@/components/MovieCard";

const movies = [
  {
    id: 1,
    title: "Inception",
    year: "2010",
    rating: 8.8,
  },
  {
    id: 2,
    title: "Interstellar",
    year: "2014",
    rating: 8.7,
  },
  {
    id: 3,
    title: "The Dark Knight",
    year: "2008",
    rating: 9.0,
  },
  {
    id: 4,
    title: "Dune",
    year: "2021",
    rating: 8.1,
  },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-neutral-950 text-white">
      <section className="mx-auto flex min-h-screen max-w-6xl flex-col px-6 py-8">
        <nav className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-yellow-400">CineScope</h1>

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

        <div className="flex flex-1 flex-col justify-center py-20">
          <p className="mb-4 text-sm font-semibold uppercase tracking-widest text-yellow-400">
            Movie Discovery App
          </p>

          <h2 className="max-w-3xl text-5xl font-bold leading-tight">
            Discover movies, explore details, and build your own watchlist.
          </h2>

          <p className="mt-6 max-w-2xl text-lg text-neutral-400">
            CineScope is a Next.js movie discovery project powered by a public
            movie API.
          </p>

          <div className="mt-8 flex gap-4">
            <button className="rounded-lg bg-yellow-400 px-6 py-3 font-semibold text-black transition hover:bg-yellow-300">
              Explore Movies
            </button>

            <button className="rounded-lg border border-neutral-700 px-6 py-3 font-semibold text-white transition hover:border-yellow-400 hover:text-yellow-400">
              Search
            </button>
          </div>

          <section className="mt-16">
            <h3 className="mb-6 text-2xl font-bold">Popular Movies</h3>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {movies.map((movie) => (
                <MovieCard
                  key={movie.id}
                  title={movie.title}
                  year={movie.year}
                  rating={movie.rating}
                />
              ))}
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}