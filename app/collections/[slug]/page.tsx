import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import MovieCard from "@/components/MovieCard";
import EmptyState from "@/components/ui/EmptyState";
import PageShell from "@/components/ui/PageShell";
import { buildPageSummary, buildTotalResultsSummary, t } from "@/lib/i18n";
import { getCollectionBySlug } from "@/lib/cineaCollections";
import { getCineaCollectionPage } from "@/lib/collectionEngine";
import { getServerLanguage } from "@/lib/serverLanguage";
import { getPosterUrl } from "@/lib/tmdb";

type CollectionDetailsPageProps = {
  params: Promise<{
    slug: string;
  }>;
  searchParams: Promise<{
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

export async function generateMetadata({
  params,
}: CollectionDetailsPageProps): Promise<Metadata> {
  const { slug } = await params;
  const collection = getCollectionBySlug(slug);

  if (!collection) {
    return {};
  }

  return {
    title: collection.title,
    description: collection.longDescription,
  };
}

export default async function CollectionDetailsPage({
  params,
  searchParams,
}: CollectionDetailsPageProps) {
  const { slug } = await params;
  const collection = getCollectionBySlug(slug);

  if (!collection) {
    notFound();
  }

  const { page } = await searchParams;
  const requestedPage = parsePage(page);

  const [
    {
      movies,
      currentPage,
      totalPages,
      totalFilteredCount,
      hasNextPage,
      hasPreviousPage,
    },
    language,
  ] = await Promise.all([
    getCineaCollectionPage(collection, requestedPage),
    getServerLanguage(),
  ]);

  return (
    <main className="min-h-screen bg-background text-foreground">
      <PageShell>
        <p className="text-sm font-semibold uppercase tracking-widest text-accent">
          {t(language, "collections", "detailEyebrow")}
        </p>

        <h1 className="mt-4 text-4xl font-bold">{collection.title}</h1>

        <p className="mt-4 text-muted">{collection.shortDescription}</p>

        <div className="mt-6 rounded-xl border border-accent/20 bg-accent/5 p-4">
          <p className="text-sm text-foreground">
            {collection.longDescription}
          </p>

          <p className="mt-3 text-xs text-muted">
            {collection.themeSignalSummary}
          </p>
        </div>

        <div className="mt-8 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted">
          <span>{buildPageSummary(language, currentPage, totalPages)}</span>

          <span>
            {buildTotalResultsSummary(language, totalFilteredCount)}
          </span>
        </div>

        {movies.length > 0 ? (
          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
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
        ) : (
          <EmptyState
            className="mt-10"
            title={t(language, "collections", "noResultsTitle")}
            description={t(language, "collections", "noResultsDescription")}
          />
        )}

        {movies.length > 0 && (
          <nav className="mt-12 flex flex-wrap items-center justify-center gap-4">
            {hasPreviousPage ? (
              <Link
                href={`/collections/${collection.slug}?page=${currentPage - 1}`}
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

            {hasNextPage ? (
              <Link
                href={`/collections/${collection.slug}?page=${currentPage + 1}`}
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
      </PageShell>
    </main>
  );
}
