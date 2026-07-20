import Link from "next/link";
import MovieCard from "@/components/MovieCard";
import MovieFilters from "@/components/MovieFilters";
import {
  discoverMovies,
  getMovieGenres,
  getMoviesByCategory,
  getPosterUrl,
  type MovieCategory,
  type MovieSort,
} from "@/lib/tmdb";

type HomePageProps = {
  searchParams: Promise<{
    category?: string;
    genre?: string;
    sort?: string;
    page?: string;
  }>;
};

const categoryLabels: Record<MovieCategory, string> = {
  popular: "Popular",
  "top-rated": "Top Rated",
  "now-playing": "Now Playing",
  upcoming: "Upcoming",
};

const sortLabels: Record<MovieSort, string> = {
  "popularity.desc": "En Popüler",
  "vote_average.desc": "En Yüksek Puan",
  "primary_release_date.desc": "En Yeni",
};

const allowedCategories: MovieCategory[] = [
  "popular",
  "top-rated",
  "now-playing",
  "upcoming",
];

const allowedSortValues: MovieSort[] = [
  "popularity.desc",
  "vote_average.desc",
  "primary_release_date.desc",
];

function isMovieCategory(value: string): value is MovieCategory {
  return allowedCategories.includes(value as MovieCategory);
}

function isMovieSort(value: string): value is MovieSort {
  return allowedSortValues.includes(value as MovieSort);
}

function parsePage(value: string | undefined): number {
  const parsedPage = Number(value);

  if (!Number.isInteger(parsedPage) || parsedPage < 1) {
    return 1;
  }

  return Math.min(parsedPage, 500);
}

function parseGenre(value: string | undefined): number {
  const parsedGenre = Number(value);

  if (!Number.isInteger(parsedGenre) || parsedGenre < 1) {
    return 0;
  }

  return parsedGenre;
}

export default async function Home({
  searchParams,
}: HomePageProps) {
  const params = await searchParams;
  const genres = await getMovieGenres();

  const category: MovieCategory =
    params.category && isMovieCategory(params.category)
      ? params.category
      : "popular";

  const requestedGenre = parseGenre(params.genre);

  const selectedGenre = genres.some(
    (genre) => genre.id === requestedGenre
  )
    ? requestedGenre
    : 0;

  const selectedSort: MovieSort =
    params.sort && isMovieSort(params.sort)
      ? params.sort
      : "popularity.desc";

  const requestedPage = parsePage(params.page);

  const isFilterMode =
    selectedGenre > 0 ||
    (params.sort !== undefined && isMovieSort(params.sort));

  const movieData = isFilterMode
    ? await discoverMovies(
        selectedGenre,
        selectedSort,
        requestedPage
      )
    : await getMoviesByCategory(
        category,
        requestedPage
      );

  const currentPage = movieData.page || 1;
  const totalPages = Math.max(
    1,
    Math.min(movieData.total_pages || 1, 500)
  );

  const selectedGenreName =
    genres.find((genre) => genre.id === selectedGenre)?.name ??
    "Tüm Türler";

  const paginationParams = isFilterMode
    ? `genre=${selectedGenre}&sort=${selectedSort}`
    : `category=${category}`;

  return (
    <main className="min-h-screen bg-neutral-950 text-white">
      <section className="mx-auto max-w-7xl px-5 py-8 sm:px-6">
        <section className="py-14 sm:py-20">
          <p className="mb-4 text-sm font-semibold uppercase tracking-widest text-yellow-400">
            Movie Discovery App
          </p>

          <h1 className="max-w-3xl text-4xl font-bold leading-tight sm:text-5xl">
            Discover movies, explore details, and build your own watchlist.
          </h1>

          <p className="mt-6 max-w-2xl text-lg text-neutral-400">
            Film kategorilerini incele, tür seç ve sonuçları
            istediğin şekilde sırala.
          </p>

          <div className="mt-8 flex flex-wrap gap-4">
            <a
              href="#movies"
              className="rounded-lg bg-yellow-400 px-6 py-3 font-semibold text-black transition hover:bg-yellow-300"
            >
              Explore Movies
            </a>

            <Link
              href="/search"
              className="rounded-lg border border-neutral-700 px-6 py-3 font-semibold text-white transition hover:border-yellow-400 hover:text-yellow-400"
            >
              Search
            </Link>
          </div>
        </section>

        <section id="movies" className="scroll-mt-24 pb-20">
          <div className="mb-7">
            <p className="text-sm font-semibold uppercase tracking-widest text-yellow-400">
              Browse
            </p>

            <h2 className="mt-3 text-3xl font-bold">
              {isFilterMode
                ? "Filtered Movies"
                : `${categoryLabels[category]} Movies`}
            </h2>

            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-neutral-500">
              <span>
                Sayfa {currentPage} / {totalPages}
              </span>

              <span>
                Toplam {movieData.total_results.toLocaleString("tr-TR")} sonuç
              </span>
            </div>
          </div>

          <div className="mb-7 flex flex-wrap gap-3">
            {(
              Object.entries(categoryLabels) as [
                MovieCategory,
                string
              ][]
            ).map(([categoryKey, label]) => (
              <Link
                key={categoryKey}
                href={`/?category=${categoryKey}&page=1#movies`}
                className={
                  !isFilterMode && categoryKey === category
                    ? "rounded-lg bg-yellow-400 px-5 py-3 text-sm font-semibold text-black"
                    : "rounded-lg border border-neutral-700 bg-neutral-900 px-5 py-3 text-sm font-semibold text-neutral-300 transition hover:border-yellow-400 hover:text-yellow-400"
                }
              >
                {label}
              </Link>
            ))}
          </div>

          <MovieFilters
            genres={genres}
            selectedGenre={selectedGenre}
            selectedSort={selectedSort}
          />

          {isFilterMode && (
            <div className="mb-7 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-yellow-400/20 bg-yellow-400/5 p-4">
              <div>
                <p className="text-sm font-semibold text-yellow-400">
                  Aktif Filtreler
                </p>

                <p className="mt-1 text-sm text-neutral-300">
                  Tür: {selectedGenreName} · Sıralama:{" "}
                  {sortLabels[selectedSort]}
                </p>
              </div>

              <Link
                href="/?category=popular&page=1#movies"
                className="rounded-lg border border-neutral-700 px-4 py-2 text-sm font-semibold text-neutral-200 transition hover:border-yellow-400 hover:text-yellow-400"
              >
                Filtreleri Temizle
              </Link>
            </div>
          )}

          {movieData.results.length > 0 ? (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
              {movieData.results.map((movie) => (
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
                Bu filtrelerle film bulunamadı
              </h3>

              <p className="mt-3 text-neutral-400">
                Farklı bir tür veya sıralama seçeneği dene.
              </p>

              <Link
                href="/?category=popular&page=1#movies"
                className="mt-6 inline-block rounded-lg bg-yellow-400 px-5 py-3 font-semibold text-black transition hover:bg-yellow-300"
              >
                Filtreleri Temizle
              </Link>
            </div>
          )}

          {movieData.results.length > 0 && (
            <nav className="mt-12 flex flex-wrap items-center justify-center gap-4">
              {currentPage > 1 ? (
                <Link
                  href={`/?${paginationParams}&page=${
                    currentPage - 1
                  }#movies`}
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
                  href={`/?${paginationParams}&page=${
                    currentPage + 1
                  }#movies`}
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
          )}
        </section>
      </section>
    </main>
  );
}