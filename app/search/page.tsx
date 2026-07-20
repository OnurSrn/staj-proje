import Link from "next/link";
import MovieCard from "@/components/MovieCard";
import { getPosterUrl, searchMovies } from "@/lib/tmdb";

export const metadata = {
  title: "Search",
};

type SearchPageProps = {
  searchParams: Promise<{
    query?: string;
    page?: string;
  }>;
};

function parsePage(value: string | undefined): number {
  const parsedPage = Number(value);

  if (!Number.isInteger(parsedPage) || parsedPage < 1) {
    return 1;
  }

  return Math.min(parsedPage, 500);
}

export default async function SearchPage({
  searchParams,
}: SearchPageProps) {
  const { query = "", page } = await searchParams;
  const trimmedQuery = query.trim();
  const requestedPage = parsePage(page);

  const searchData = trimmedQuery
    ? await searchMovies(trimmedQuery, requestedPage)
    : null;

  const movies = searchData?.results ?? [];
  const currentPage = searchData?.page || 1;
  const totalPages = Math.max(
    1,
    Math.min(searchData?.total_pages || 1, 500)
  );

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
          <label htmlFor="query" className="sr-only">
            Film adı
          </label>

          <input
            id="query"
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

        {!trimmedQuery && (
          <div className="mt-12 rounded-2xl border border-dashed border-neutral-700 bg-neutral-900 p-10 text-center">
            <h2 className="text-xl font-semibold">
              Bir film aramaya başla
            </h2>

            <p className="mt-3 text-neutral-400">
              Arama kutusuna bir film adı yaz ve Search butonuna bas.
            </p>
          </div>
        )}

        {trimmedQuery && (
          <section className="mt-12">
            <div className="mb-6">
              <h2 className="text-2xl font-bold">
                “{trimmedQuery}” için sonuçlar
              </h2>

              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-neutral-500">
                <span>
                  Sayfa {currentPage} / {totalPages}
                </span>

                <span>
                  Toplam{" "}
                  {(searchData?.total_results ?? 0).toLocaleString(
                    "tr-TR"
                  )}{" "}
                  sonuç
                </span>
              </div>
            </div>

            {movies.length > 0 ? (
              <>
                <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
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

                <nav className="mt-12 flex flex-wrap items-center justify-center gap-4">
                  {currentPage > 1 ? (
                    <Link
                      href={`/search?query=${encodeURIComponent(
                        trimmedQuery
                      )}&page=${currentPage - 1}`}
                      className="rounded-lg border border-neutral-700 px-5 py-3 font-semibold transition hover:border-yellow-400 hover:text-yellow-400"
                    >
                      ← Önceki
                    </Link>
                  ) : (
                    <span className="cursor-not-allowed rounded-lg border border-neutral-800 px-5 py-3 font-semibold text-neutral-600">
                      ← Önceki
                    </span>
                  )}

                  <span className="rounded-lg bg-neutral-900 px-5 py-3 text-sm text-neutral-300">
                    {currentPage} / {totalPages}
                  </span>

                  {currentPage < totalPages ? (
                    <Link
                      href={`/search?query=${encodeURIComponent(
                        trimmedQuery
                      )}&page=${currentPage + 1}`}
                      className="rounded-lg border border-neutral-700 px-5 py-3 font-semibold transition hover:border-yellow-400 hover:text-yellow-400"
                    >
                      Sonraki →
                    </Link>
                  ) : (
                    <span className="cursor-not-allowed rounded-lg border border-neutral-800 px-5 py-3 font-semibold text-neutral-600">
                      Sonraki →
                    </span>
                  )}
                </nav>
              </>
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
