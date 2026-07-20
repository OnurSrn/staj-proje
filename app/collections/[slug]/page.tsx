import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import MovieCard from "@/components/MovieCard";
import { getCollectionBySlug } from "@/lib/cineaCollections";
import { getCineaCollectionPage } from "@/lib/collectionEngine";
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

  const {
    movies,
    currentPage,
    totalPages,
    totalFilteredCount,
    hasNextPage,
    hasPreviousPage,
  } = await getCineaCollectionPage(collection, requestedPage);

  return (
    <main className="min-h-screen bg-neutral-950 text-white">
      <section className="mx-auto max-w-7xl px-6 py-16">
        <p className="text-sm font-semibold uppercase tracking-widest text-yellow-400">
          CiNeA Collection
        </p>

        <h1 className="mt-4 text-4xl font-bold">{collection.title}</h1>

        <p className="mt-4 text-neutral-400">{collection.shortDescription}</p>

        <div className="mt-6 rounded-xl border border-yellow-400/20 bg-yellow-400/5 p-4">
          <p className="text-sm text-neutral-300">
            {collection.longDescription}
          </p>

          <p className="mt-3 text-xs text-neutral-500">
            {collection.themeSignalSummary}
          </p>
        </div>

        <div className="mt-8 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-neutral-500">
          <span>
            Sayfa {currentPage} / {totalPages}
          </span>

          <span>
            Toplam {totalFilteredCount.toLocaleString("tr-TR")} sonuç
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
          <div className="mt-10 rounded-2xl border border-dashed border-neutral-700 bg-neutral-900 p-10 text-center">
            <h3 className="text-xl font-semibold">
              Bu koleksiyonda film bulunamadı
            </h3>

            <p className="mt-3 text-neutral-400">
              Daha sonra tekrar dene.
            </p>
          </div>
        )}

        {movies.length > 0 && (
          <nav className="mt-12 flex flex-wrap items-center justify-center gap-4">
            {hasPreviousPage ? (
              <Link
                href={`/collections/${collection.slug}?page=${currentPage - 1}`}
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

            {hasNextPage ? (
              <Link
                href={`/collections/${collection.slug}?page=${currentPage + 1}`}
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
    </main>
  );
}
