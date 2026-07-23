import Link from "next/link";
import MovieCard from "@/components/MovieCard";
import EmptyState from "@/components/ui/EmptyState";
import PageShell from "@/components/ui/PageShell";
import SectionHeader from "@/components/ui/SectionHeader";
import {
  buildPageSummary,
  buildSearchResultsForHeading,
  buildTotalResultsSummary,
  t,
} from "@/lib/i18n";
import { getServerLanguage } from "@/lib/serverLanguage";
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

  const [searchData, language] = await Promise.all([
    trimmedQuery ? searchMovies(trimmedQuery, requestedPage) : Promise.resolve(null),
    getServerLanguage(),
  ]);

  const movies = searchData?.results ?? [];
  const currentPage = searchData?.page || 1;
  const totalPages = Math.max(
    1,
    Math.min(searchData?.total_pages || 1, 500)
  );

  return (
    <main className="min-h-screen bg-background text-foreground">
      <PageShell pattern="subtle">
        <p className="text-sm font-semibold uppercase tracking-widest text-accent">
          {t(language, "search", "eyebrow")}
        </p>

        <h1 className="mt-4 text-4xl font-bold">
          {t(language, "search", "title")}
        </h1>

        <p className="mt-4 text-muted">
          {t(language, "search", "subtitle")}
        </p>

        <form action="/search" method="GET" className="mt-8 flex max-w-3xl gap-3">
          <label htmlFor="query" className="sr-only">
            {t(language, "search", "inputLabel")}
          </label>

          <input
            id="query"
            type="text"
            name="query"
            defaultValue={query}
            placeholder={t(language, "search", "inputPlaceholder")}
            required
            className="min-w-0 flex-1 rounded-xl border border-border bg-input px-5 py-4 text-foreground outline-none transition placeholder:text-muted focus:border-accent"
          />

          <button
            type="submit"
            className="rounded-xl bg-accent px-6 py-4 font-semibold text-accent-foreground transition hover:bg-accent-hover"
          >
            {t(language, "search", "submit")}
          </button>
        </form>

        {!trimmedQuery && (
          <EmptyState
            className="mt-12"
            title={
              <h2 className="text-xl font-semibold">
                {t(language, "search", "promptTitle")}
              </h2>
            }
            description={t(language, "search", "promptDescription")}
          />
        )}

        {trimmedQuery && (
          <section className="mt-12">
            <SectionHeader
              className="mb-6"
              title={
                <h2 className="text-2xl font-bold">
                  {buildSearchResultsForHeading(language, trimmedQuery)}
                </h2>
              }
              description={
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted">
                  <span>{buildPageSummary(language, currentPage, totalPages)}</span>

                  <span>
                    {buildTotalResultsSummary(
                      language,
                      searchData?.total_results ?? 0
                    )}
                  </span>
                </div>
              }
            />

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
                      href={`/search?query=${encodeURIComponent(
                        trimmedQuery
                      )}&page=${currentPage + 1}`}
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
              </>
            ) : (
              <EmptyState
                title={
                  <h2 className="text-xl font-semibold">
                    {t(language, "search", "noResultsTitle")}
                  </h2>
                }
                description={t(language, "search", "noResultsDescription")}
              />
            )}
          </section>
        )}
      </PageShell>
    </main>
  );
}
