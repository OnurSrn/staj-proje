import Link from "next/link";
import ActiveFilterChips from "@/components/search/ActiveFilterChips";
import SearchFilterForm from "@/components/search/SearchFilterForm";
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
import {
  buildSearchHref,
  parseSearchFilters,
  resolveSearchMode,
  SEARCH_FILTER_DEFAULTS,
  updateSearchFilters,
  type SearchParamsInput,
} from "@/lib/searchFilters";
import {
  buildDiscoverMovieParams,
  sortSearchResultsForDisplay,
} from "@/lib/searchQuery";
import { getServerLanguage } from "@/lib/serverLanguage";
import { getTmdbLanguage } from "@/lib/settings";
import {
  discoverMoviesForSearch,
  getMovieGenres,
  getPosterUrl,
  searchMovies,
  type MovieListResponse,
} from "@/lib/tmdb";

export const metadata = {
  title: "Search",
};

type SearchPageProps = {
  searchParams: Promise<SearchParamsInput>;
};

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const rawParams = await searchParams;
  const { filters, hadInvalidParams } = parseSearchFilters(rawParams);
  const language = await getServerLanguage();
  const tmdbLanguage = getTmdbLanguage(language);
  const mode = resolveSearchMode(filters);

  // Genre listesi mevcut, önbelleklenmiş helper ile çekilir (bkz.
  // lib/tmdb.ts getMovieGenres, revalidate: 86400) — başarısız olursa
  // filtre alanı çökmez, yalnızca "Tüm Türler" seçeneğiyle kalır (bkz.
  // görev talimatı bölüm 5).
  const genres = await getMovieGenres().catch(() => []);

  let searchData: MovieListResponse | null = null;
  let fetchError = false;

  if (mode === "search") {
    try {
      const rawSearchData = await searchMovies(filters.query, filters.page);

      searchData = {
        ...rawSearchData,
        results: sortSearchResultsForDisplay(rawSearchData.results, filters.sort),
      };
    } catch {
      fetchError = true;
    }
  } else if (mode === "discover") {
    try {
      const params = buildDiscoverMovieParams(filters, tmdbLanguage);

      searchData = await discoverMoviesForSearch(params);
    } catch {
      fetchError = true;
    }
  }

  const movies = searchData?.results ?? [];
  const currentPage = searchData?.page || 1;
  const totalPages = Math.max(1, Math.min(searchData?.total_pages || 1, 500));

  // "Clear filters" yalnızca yapısal filtreleri sıfırlar, arama metnini
  // korur — Clear'a basmak kullanıcının yazdığı kelimeyi silmez, yalnızca
  // tür/yıl/puan/sıralamayı varsayılana döndürür (bkz. görev talimatı
  // bölüm 6 ve rapor).
  const clearFiltersHref = buildSearchHref({
    ...SEARCH_FILTER_DEFAULTS,
    query: filters.query,
  });

  const queryIgnoredNotice = mode === "discover" && filters.query.length > 0;

  return (
    <main className="min-h-screen bg-background text-foreground">
      <PageShell pattern="subtle">
        <p className="text-sm font-semibold uppercase tracking-widest text-accent">
          {t(language, "search", "eyebrow")}
        </p>

        <h1 className="mt-4 text-4xl font-bold">
          {t(language, "search", "title")}
        </h1>

        <p className="mt-4 text-muted">{t(language, "search", "subtitle")}</p>

        <SearchFilterForm
          filters={filters}
          genres={genres}
          language={language}
          clearFiltersHref={clearFiltersHref}
        />

        {hadInvalidParams && (
          <p className="mt-4 max-w-3xl rounded-lg border border-accent-secondary/40 bg-accent-secondary-soft px-4 py-3 text-sm text-foreground">
            {t(language, "search", "invalidParamsNotice")}
          </p>
        )}

        {queryIgnoredNotice && (
          <p className="mt-4 max-w-3xl rounded-lg border border-border bg-surface px-4 py-3 text-sm text-muted">
            {t(language, "search", "queryIgnoredNotice")}
          </p>
        )}

        {mode === "empty" && (
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

        {mode !== "empty" && (
          <section className="mt-12">
            <ActiveFilterChips
              filters={filters}
              genres={genres}
              language={language}
            />

            {fetchError ? (
              <EmptyState
                title={
                  <h2 className="text-xl font-semibold">
                    {t(language, "common", "loadErrorTitle")}
                  </h2>
                }
                description={t(language, "common", "loadErrorDescription")}
                action={
                  <Link
                    href={buildSearchHref(filters)}
                    className="rounded-lg bg-accent px-5 py-2.5 font-semibold text-accent-foreground transition hover:bg-accent-hover"
                  >
                    {t(language, "common", "retry")}
                  </Link>
                }
              />
            ) : (
              <>
                <SectionHeader
                  className="mb-6"
                  title={
                    <h2 className="text-2xl font-bold">
                      {mode === "search"
                        ? buildSearchResultsForHeading(language, filters.query)
                        : t(language, "home", "filteredMoviesTitle")}
                    </h2>
                  }
                  description={
                    movies.length > 0 ? (
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted">
                        <span>
                          {buildPageSummary(language, currentPage, totalPages)}
                        </span>

                        <span>
                          {buildTotalResultsSummary(
                            language,
                            searchData?.total_results ?? 0
                          )}
                        </span>
                      </div>
                    ) : undefined
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
                          href={buildSearchHref(
                            updateSearchFilters(filters, {
                              page: currentPage - 1,
                            })
                          )}
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
                          href={buildSearchHref(
                            updateSearchFilters(filters, {
                              page: currentPage + 1,
                            })
                          )}
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
                    description={
                      mode === "discover"
                        ? t(language, "search", "noResultsForFiltersDescription")
                        : t(language, "search", "noResultsDescription")
                    }
                  />
                )}
              </>
            )}
          </section>
        )}
      </PageShell>
    </main>
  );
}
