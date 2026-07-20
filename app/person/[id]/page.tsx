import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import MovieCard from "@/components/MovieCard";
import {
  getPersonDetails,
  getPersonMovieCredits,
  getPosterUrl,
  getProfileUrl,
  TmdbNotFoundError,
  type PersonMovieCredit,
} from "@/lib/tmdb";

type PersonDetailsPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export async function generateMetadata({
  params,
}: PersonDetailsPageProps): Promise<Metadata> {
  const { id } = await params;

  try {
    const person = await getPersonDetails(id);
    const profileUrl = getProfileUrl(person.profile_path);

    return {
      title: person.name,
      description: person.biography || undefined,
      openGraph: profileUrl
        ? {
            images: [{ url: profileUrl }],
          }
        : undefined,
    };
  } catch (error) {
    if (error instanceof TmdbNotFoundError) {
      return {};
    }

    throw error;
  }
}

function formatDate(dateString: string | null) {
  if (!dateString) {
    return null;
  }

  return new Date(dateString).toLocaleDateString("tr-TR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function getTopUniqueMovies(
  credits: PersonMovieCredit[]
): PersonMovieCredit[] {
  const seenIds = new Set<number>();
  const uniqueCredits: PersonMovieCredit[] = [];

  const sortedCredits = [...credits].sort(
    (a, b) => b.popularity - a.popularity
  );

  for (const credit of sortedCredits) {
    if (seenIds.has(credit.id)) {
      continue;
    }

    seenIds.add(credit.id);
    uniqueCredits.push(credit);
  }

  return uniqueCredits.slice(0, 12);
}

export default async function PersonDetailsPage({
  params,
}: PersonDetailsPageProps) {
  const { id } = await params;

  let person;
  let credits;

  try {
    [person, credits] = await Promise.all([
      getPersonDetails(id),
      getPersonMovieCredits(id),
    ]);
  } catch (error) {
    if (error instanceof TmdbNotFoundError) {
      notFound();
    }

    throw error;
  }

  const profileUrl = getProfileUrl(person.profile_path);
  const birthDate = formatDate(person.birthday);
  const movies = getTopUniqueMovies(credits);

  return (
    <main className="min-h-screen bg-neutral-950 text-white">
      <section className="mx-auto max-w-7xl px-6 py-16">
        <div className="grid gap-10 md:grid-cols-[280px_1fr]">
          <div className="relative aspect-[2/3] overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-900 shadow-2xl">
            {profileUrl ? (
              <Image
                src={profileUrl}
                alt={person.name}
                fill
                priority
                sizes="(max-width: 768px) 100vw, 280px"
                className="object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center px-4 text-center text-neutral-500">
                Görsel bulunamadı
              </div>
            )}
          </div>

          <div className="flex flex-col justify-center">
            <p className="text-sm font-semibold uppercase tracking-widest text-yellow-400">
              Kişi Detayları
            </p>

            <h1 className="mt-4 text-4xl font-bold sm:text-5xl">
              {person.name}
            </h1>

            <div className="mt-6 flex flex-wrap gap-3 text-sm">
              {person.known_for_department && (
                <span className="rounded-full bg-yellow-400 px-3 py-1 font-semibold text-black">
                  {person.known_for_department}
                </span>
              )}

              <span className="rounded-full border border-neutral-700 px-3 py-1 text-neutral-300">
                {birthDate || "Doğum tarihi yok"}
              </span>

              <span className="rounded-full border border-neutral-700 px-3 py-1 text-neutral-300">
                {person.place_of_birth || "Doğum yeri yok"}
              </span>
            </div>

            <section className="mt-8 max-w-3xl">
              <h2 className="text-xl font-semibold">Biyografi</h2>

              <p className="mt-3 leading-7 text-neutral-300">
                {person.biography || "Bu kişi için biyografi bulunmuyor."}
              </p>
            </section>
          </div>
        </div>

        <section className="mt-16">
          <div className="mb-8">
            <p className="text-sm font-semibold uppercase tracking-widest text-yellow-400">
              Filmography
            </p>

            <h2 className="mt-3 text-3xl font-bold">Filmleri</h2>
          </div>

          {movies.length > 0 ? (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
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
            <div className="rounded-2xl border border-dashed border-neutral-700 bg-neutral-900 p-10 text-center">
              <h3 className="text-xl font-semibold">
                Film bulunamadı
              </h3>

              <p className="mt-3 text-neutral-400">
                Bu kişi için filmografi bilgisi bulunmuyor.
              </p>
            </div>
          )}
        </section>
      </section>
    </main>
  );
}
