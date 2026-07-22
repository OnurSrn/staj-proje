import Link from "next/link";
import MovieCard from "@/components/MovieCard";
import MovieFilters from "@/components/MovieFilters";
import { buildPageSummary, buildTotalResultsSummary, t } from "@/lib/i18n";
import { getServerLanguage } from "@/lib/serverLanguage";
import {
  discoverMovies,
  getMovieGenres,
  getMoviesByCategory,
  getPosterUrl,
  type MovieCategory,
  type MovieSort,
} from "@/lib/tmdb";
import type { AppLanguage } from "@/lib/settings";

type HomePageProps = {
  searchParams: Promise<{
    category?: string;
    genre?: string;
    sort?: string;
    page?: string;
  }>;
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

function getCategoryLabel(language: AppLanguage, category: MovieCategory): string {
  return t(language, "categories", category);
}

function getSortLabel(language: AppLanguage, sort: MovieSort): string {
  return t(language, "sorts", sort);
}

export default async function Home({
  searchParams,
}: HomePageProps) {
  const params = await searchParams;
  const [genres, language] = await Promise.all([
    getMovieGenres(),
    getServerLanguage(),
  ]);

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
    t(language, "home", "allGenres");

  const paginationParams = isFilterMode
    ? `genre=${selectedGenre}&sort=${selectedSort}`
    : `category=${category}`;

  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="mx-auto max-w-7xl px-5 py-8 sm:px-6">
        <section className="py-14 sm:py-20">
          <p className="mb-4 text-sm font-semibold uppercase tracking-widest text-accent">
            {t(language, "home", "eyebrow")}
          </p>

          <h1 className="max-w-3xl text-4xl font-bold leading-tight sm:text-5xl">
            {t(language, "home", "title")}
          </h1>

          <p className="mt-6 max-w-2xl text-lg text-muted">
            {t(language, "home", "subtitle")}
          </p>

          <div className="mt-8 flex flex-wrap gap-4">
            <a
              href="#movies"
              className="rounded-lg bg-accent px-6 py-3 font-semibold text-accent-foreground transition hover:bg-accent-hover"
            >
              {t(language, "common", "exploreMovies")}
            </a>

            <Link
              href="/search"
              className="rounded-lg border border-border px-6 py-3 font-semibold text-foreground transition hover:border-accent hover:text-accent"
            >
              {t(language, "navbar", "search")}
            </Link>
          </div>
        </section>

        <section id="movies" className="scroll-mt-24 pb-20">
          <div className="mb-7">
            <p className="text-sm font-semibold uppercase tracking-widest text-accent">
              {t(language, "home", "browseEyebrow")}
            </p>

            <h2 className="mt-3 text-3xl font-bold">
              {isFilterMode
                ? t(language, "home", "filteredMoviesTitle")
                : `${getCategoryLabel(language, category)} ${t(language, "home", "categoryMoviesSuffix")}`}
            </h2>

            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted">
              <span>{buildPageSummary(language, currentPage, totalPages)}</span>

              <span>
                {buildTotalResultsSummary(language, movieData.total_results)}
              </span>
            </div>
          </div>

          <div className="mb-7 flex flex-wrap gap-3">
            {allowedCategories.map((categoryKey) => (
              <Link
                key={categoryKey}
                href={`/?category=${categoryKey}&page=1#movies`}
                className={
                  !isFilterMode && categoryKey === category
                    ? "rounded-lg bg-accent px-5 py-3 text-sm font-semibold text-accent-foreground"
                    : "rounded-lg border border-border bg-surface px-5 py-3 text-sm font-semibold text-muted transition hover:border-accent hover:text-accent"
                }
              >
                {getCategoryLabel(language, categoryKey)}
              </Link>
            ))}
          </div>

          <MovieFilters
            genres={genres}
            selectedGenre={selectedGenre}
            selectedSort={selectedSort}
            language={language}
          />

          {isFilterMode && (
            <div className="mb-7 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-accent/20 bg-accent/5 p-4">
              <div>
                <p className="text-sm font-semibold text-accent">
                  {t(language, "home", "activeFilters")}
                </p>

                <p className="mt-1 text-sm text-foreground">
                  {t(language, "home", "genreLabel")} {selectedGenreName} ·{" "}
                  {t(language, "home", "sortLabel")}{" "}
                  {getSortLabel(language, selectedSort)}
                </p>
              </div>

              <Link
                href="/?category=popular&page=1#movies"
                className="rounded-lg border border-border px-4 py-2 text-sm font-semibold text-foreground transition hover:border-accent hover:text-accent"
              >
                {t(language, "common", "clearFilters")}
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
            <div className="rounded-2xl border border-dashed border-border-strong bg-surface p-10 text-center">
              <h3 className="text-xl font-semibold">
                {t(language, "home", "noResultsTitle")}
              </h3>

              <p className="mt-3 text-muted">
                {t(language, "home", "noResultsDescription")}
              </p>

              <Link
                href="/?category=popular&page=1#movies"
                className="mt-6 inline-block rounded-lg bg-accent px-5 py-3 font-semibold text-accent-foreground transition hover:bg-accent-hover"
              >
                {t(language, "common", "clearFilters")}
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
                  className="rounded-lg border border-border px-5 py-3 font-semibold transition hover:border-accent hover:text-accent"
                >
                  {t(language, "common", "previous")}
                </Link>
              ) : (
                <span className="cursor-not-allowed rounded-lg border border-border px-5 py-3 font-semibold text-muted">
                  {t(language, "common", "previous")}
                </span>
              )}

              <span className="rounded-lg bg-surface px-5 py-3 text-sm text-muted">
                {currentPage} / {totalPages}
              </span>

              {currentPage < totalPages ? (
                <Link
                  href={`/?${paginationParams}&page=${
                    currentPage + 1
                  }#movies`}
                  className="rounded-lg border border-border px-5 py-3 font-semibold transition hover:border-accent hover:text-accent"
                >
                  {t(language, "common", "next")}
                </Link>
              ) : (
                <span className="cursor-not-allowed rounded-lg border border-border px-5 py-3 font-semibold text-muted">
                  {t(language, "common", "next")}
                </span>
              )}
            </nav>
          )}
        </section>
      </section>
    </main>
  );
}
