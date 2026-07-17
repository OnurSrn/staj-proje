import MovieCard from "@/components/MovieCard";
import { getPosterUrl, searchMovies } from "@/lib/tmdb";

export const metadata = {
  title: "Search",
};

type SearchPageProps = {
  searchParams: Promise<{
    query?: string;
  }>;
};

export default async function SearchPage({
  searchParams,
}: SearchPageProps) {
  const { query = "" } = await searchParams;
  const movies = query.trim() ? await searchMovies(query) : [];

  return (
    <main className="min-h-screen bg-neutral-950 text-white">
      <section className="mx-auto max-w-7xl px-6 py-16">
        <p className="text-sm font-semibold uppercase tracking-widest text-yellow-400">
          Film Search
        </p>

        <h1 className="mt-4 text-4xl font-bold">Search Movies</h1>

        <p className="mt-4 text-neutral-400">
          Aramak istediğin filmin adını yaz.
        </p>

        <form action="/search" method="GET" className="mt-8 flex max-w-3xl gap-3">
          <input
            type="text"
            name="query"
            defaultValue={query}
            placeholder="Örneğin: Interstellar"
            required
            className="min-w-0 flex-1 rounded-xl border border-neutral-700 bg-neutral-900 px-5 py-4 text-white outline-none transition placeholder:text-neutral-500 focus:border-yellow-400"
          />

          <button
            type="submit"
            className="rounded-xl bg-yellow-400 px-6 py-4 font-semibold text-black transition hover:bg-yellow-300"
          >
            Search
          </button>
        </form>

        {!query.trim() && (
          <div className="mt-12 rounded-2xl border border-dashed border-neutral-700 bg-neutral-900 p-10 text-center">
            <h2 className="text-xl font-semibold">
              Bir film aramaya başla
            </h2>

            <p className="mt-3 text-neutral-400">
              Arama kutusuna bir film adı yaz ve Search butonuna bas.
            </p>
          </div>
        )}

        {query.trim() && (
          <section className="mt-12">
            <div className="mb-6">
              <h2 className="text-2xl font-bold">
                “{query}” için sonuçlar
              </h2>

              <p className="mt-2 text-sm text-neutral-500">
                {movies.length} film bulundu
              </p>
            </div>

            {movies.length > 0 ? (
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
            ) : (
              <div className="rounded-2xl border border-dashed border-neutral-700 bg-neutral-900 p-10 text-center">
                <h2 className="text-xl font-semibold">
                  Film bulunamadı
                </h2>

                <p className="mt-3 text-neutral-400">
                  Başka bir film adıyla tekrar arama yap.
                </p>
              </div>
            )}
          </section>
        )}
      </section>
    </main>
  );
}   