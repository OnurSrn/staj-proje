import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import MovieCard from "@/components/MovieCard";
import PersonDetailPreferenceActions from "@/components/PersonDetailPreferenceActions";
import PersonSocialLinks from "@/components/PersonSocialLinks";
import { t } from "@/lib/i18n";
import { buildPersonExternalLinks, detectPersonRoles } from "@/lib/personProfile";
import { getServerLanguage } from "@/lib/serverLanguage";
import type { AppLanguage } from "@/lib/settings";
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

function formatDate(language: AppLanguage, dateString: string | null) {
  if (!dateString) {
    return null;
  }

  return new Date(dateString).toLocaleDateString(
    language === "tr" ? "tr-TR" : "en-US",
    {
      day: "numeric",
      month: "long",
      year: "numeric",
    }
  );
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
  let language: AppLanguage;

  try {
    [person, credits, language] = await Promise.all([
      getPersonDetails(id),
      getPersonMovieCredits(id),
      getServerLanguage(),
    ]);
  } catch (error) {
    if (error instanceof TmdbNotFoundError) {
      notFound();
    }

    throw error;
  }

  const profileUrl = getProfileUrl(person.profile_path);
  const birthDate = formatDate(language, person.birthday);
  const movies = getTopUniqueMovies(credits.cast);
  const socialLinks = buildPersonExternalLinks(person.external_ids);
  const { canFavoriteAsActor, canFavoriteAsDirector } = detectPersonRoles(
    person,
    credits.cast,
    credits.crew
  );

  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="mx-auto max-w-7xl px-6 py-16">
        <div className="grid gap-10 md:grid-cols-[280px_1fr]">
          <div className="relative aspect-[2/3] overflow-hidden rounded-2xl border border-border bg-surface shadow-2xl">
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
              <div className="flex h-full items-center justify-center px-4 text-center text-muted">
                {t(language, "common", "noProfileImage")}
              </div>
            )}
          </div>

          <div className="flex flex-col justify-center">
            <p className="text-sm font-semibold uppercase tracking-widest text-accent">
              {t(language, "personDetail", "eyebrow")}
            </p>

            <h1 className="mt-4 text-4xl font-bold sm:text-5xl">
              {person.name}
            </h1>

            <div className="mt-6 flex flex-wrap gap-3 text-sm">
              {person.known_for_department && (
                <span className="rounded-full bg-accent px-3 py-1 font-semibold text-accent-foreground">
                  {person.known_for_department}
                </span>
              )}

              <span className="rounded-full border border-border px-3 py-1 text-foreground">
                {birthDate || t(language, "personDetail", "noBirthDate")}
              </span>

              <span className="rounded-full border border-border px-3 py-1 text-foreground">
                {person.place_of_birth ||
                  t(language, "personDetail", "noBirthPlace")}
              </span>

              <PersonSocialLinks links={socialLinks} />
            </div>

            <PersonDetailPreferenceActions
              id={person.id}
              name={person.name}
              profilePath={person.profile_path}
              canFavoriteAsActor={canFavoriteAsActor}
              canFavoriteAsDirector={canFavoriteAsDirector}
            />

            <section className="mt-8 max-w-3xl">
              <h2 className="text-xl font-semibold">
                {t(language, "personDetail", "biographyHeading")}
              </h2>

              <p className="mt-3 leading-7 text-foreground">
                {person.biography ||
                  t(language, "personDetail", "noBiography")}
              </p>
            </section>
          </div>
        </div>

        <section className="mt-16">
          <div className="mb-8">
            <p className="text-sm font-semibold uppercase tracking-widest text-accent">
              {t(language, "personDetail", "filmographyEyebrow")}
            </p>

            <h2 className="mt-3 text-3xl font-bold">
              {t(language, "personDetail", "filmographyHeading")}
            </h2>
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
            <div className="rounded-2xl border border-dashed border-border-strong bg-surface p-10 text-center">
              <h3 className="text-xl font-semibold">
                {t(language, "personDetail", "noMoviesTitle")}
              </h3>

              <p className="mt-3 text-muted">
                {t(language, "personDetail", "noMoviesDescription")}
              </p>
            </div>
          )}
        </section>
      </section>
    </main>
  );
}
