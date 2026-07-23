import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import CastCard from "@/components/CastCard";
import CompanyPreferenceButton from "@/components/CompanyPreferenceButton";
import MovieActions from "@/components/MovieActions";
import MovieCard from "@/components/MovieCard";
import MovieRating from "@/components/MovieRating";
import MovieWatchStatus from "@/components/MovieWatchStatus";
import PersonPreferenceButton from "@/components/PersonPreferenceButton";
import { buildRuntimeLabel, t } from "@/lib/i18n";
import { getKeyCrewSections, getUniqueCompanies } from "@/lib/movieDetail";
import { getServerLanguage } from "@/lib/serverLanguage";
import type { AppLanguage } from "@/lib/settings";
import {
  getBackdropUrl,
  getCollectionDetails,
  getMovieDetails,
  getPosterUrl,
  getProfileUrl,
  normalizeCollectionMovies,
  TmdbNotFoundError,
  type TmdbCollectionDetails,
} from "@/lib/tmdb";

// Çok kalabalık serilerde (ör. James Bond) bölümün taşmaması için üst
// sınır — Harry Potter gibi 8 filmlik seriler bu sınırın çok altında
// kaldığı için eksiksiz gösterilir.
const COLLECTION_SECTION_LIMIT = 12;

type MovieDetailsPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export async function generateMetadata({
  params,
}: MovieDetailsPageProps): Promise<Metadata> {
  const { id } = await params;

  try {
    const movie = await getMovieDetails(id);
    const posterUrl = getPosterUrl(movie.poster_path);

    return {
      title: movie.title,
      description: movie.overview || undefined,
      openGraph: posterUrl
        ? {
            images: [{ url: posterUrl }],
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

export default async function MovieDetailsPage({
  params,
}: MovieDetailsPageProps) {
  const { id } = await params;

  let movie;
  let language: AppLanguage;

  try {
    [movie, language] = await Promise.all([
      getMovieDetails(id),
      getServerLanguage(),
    ]);
  } catch (error) {
    if (error instanceof TmdbNotFoundError) {
      notFound();
    }

    throw error;
  }

  const posterUrl = getPosterUrl(movie.poster_path);
  const backdropUrl = getBackdropUrl(movie.backdrop_path);
  const hasTmdbRating =
    movie.vote_count > 0 &&
    Number.isFinite(movie.vote_average) &&
    movie.vote_average > 0;

  const cast = movie.credits.cast.slice(0, 10);
  const crewSections = getKeyCrewSections(movie.credits.crew);
  const uniqueCompanies = getUniqueCompanies(movie.production_companies);

  const trailer =
    movie.videos.results.find(
      (video) =>
        video.site === "YouTube" &&
        video.type === "Trailer" &&
        video.official
    ) ??
    movie.videos.results.find(
      (video) => video.site === "YouTube" && video.type === "Trailer"
    );

  // Collection isteği başarısız olursa (veya film hiç bir collection'a ait
  // değilse) bölüm sessizce gizlenir — film detayının geri kalanı bundan
  // etkilenmez (bkz. görev talimatı bölüm 4/8).
  let collectionDetails: TmdbCollectionDetails | null = null;

  if (movie.belongs_to_collection) {
    try {
      collectionDetails = await getCollectionDetails(
        movie.belongs_to_collection.id
      );
    } catch {
      collectionDetails = null;
    }
  }

  const collectionMovies = collectionDetails
    ? normalizeCollectionMovies(collectionDetails, movie.id)
    : [];

  const displayedCollectionMovies = collectionMovies.slice(
    0,
    COLLECTION_SECTION_LIMIT
  );

  // Recommended'da hiç seri tekrarı olmasın diye ekranda gösterilen sınırlı
  // liste değil, collection.parts içindeki TÜM geçerli id'ler dışlanır
  // (bkz. görev talimatı bölüm 7).
  const collectionMovieIds = new Set(collectionMovies.map((m) => m.id));

  const recommendations = movie.recommendations.results
    .filter(
      (recommendedMovie) =>
        recommendedMovie.id !== movie.id &&
        !collectionMovieIds.has(recommendedMovie.id)
    )
    .slice(0, 5);

  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="pattern-brand pattern-subtle relative overflow-hidden">
        {backdropUrl && (
          <Image
            src={backdropUrl}
            alt={`${movie.title} backdrop`}
            fill
            priority
            sizes="100vw"
            className="object-cover opacity-30"
          />
        )}

        <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/80 to-background" />

        <div className="relative mx-auto max-w-7xl px-6 py-16">
          <div className="grid gap-10 md:grid-cols-[280px_1fr]">
            <div className="relative aspect-[2/3] overflow-hidden rounded-2xl border border-border bg-surface shadow-2xl">
              {posterUrl ? (
                <Image
                  src={posterUrl}
                  alt={`${movie.title} poster`}
                  fill
                  priority
                  sizes="(max-width: 768px) 100vw, 280px"
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center px-4 text-center text-muted">
                  {t(language, "common", "noPoster")}
                </div>
              )}
            </div>

            <div className="flex flex-col justify-center">
              <p className="text-sm font-semibold uppercase tracking-widest text-accent">
                {t(language, "movieDetail", "eyebrow")}
              </p>

              <h1 className="mt-4 text-4xl font-bold sm:text-5xl">
                {movie.title}
              </h1>

              {movie.tagline && (
                <p className="mt-3 text-lg italic text-muted">
                  “{movie.tagline}”
                </p>
              )}

              <div className="mt-6 flex flex-wrap gap-3 text-sm">
                {hasTmdbRating && (
                  <span className="rounded-full bg-accent px-3 py-1 font-semibold text-accent-foreground">
                    {t(language, "movieDetail", "ratingPrefix")}{" "}
                    {movie.vote_average.toFixed(1)}
                  </span>
                )}

                <span className="rounded-full border border-border px-3 py-1 text-foreground">
                  {movie.release_date?.slice(0, 4) ||
                    t(language, "common", "noDate")}
                </span>

                <span className="rounded-full border border-border px-3 py-1 text-foreground">
                  {buildRuntimeLabel(language, movie.runtime)}
                </span>

                <span className="rounded-full border border-border px-3 py-1 uppercase text-foreground">
                  {movie.original_language}
                </span>
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                {movie.genres.map((genre) => (
                  <span
                    key={genre.id}
                    className="rounded-md bg-surface-elevated px-3 py-1 text-sm text-foreground"
                  >
                    {genre.name}
                  </span>
                ))}
              </div>

              <section className="mt-8 max-w-3xl">
                <h2 className="text-xl font-semibold">
                  {t(language, "movieDetail", "summaryHeading")}
                </h2>

                <p className="mt-3 leading-7 text-foreground">
                  {movie.overview || t(language, "movieDetail", "noOverview")}
                </p>
              </section>

              {crewSections.length > 0 && (
                <section className="mt-6 max-w-3xl">
                  <h2 className="text-sm font-semibold uppercase tracking-widest text-muted">
                    {t(language, "movieDetail", "creativeTeamHeading")}
                  </h2>

                  <dl className="mt-3 grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-4">
                    {crewSections.map((section) => (
                      <div key={section.labelKey}>
                        <dt className="text-xs uppercase tracking-wide text-muted">
                          {t(language, "movieDetail", section.labelKey)}
                        </dt>

                        <dd className="mt-1 text-sm text-foreground">
                          {section.isDirectorSection ? (
                            <ul className="flex flex-wrap gap-x-3 gap-y-1.5">
                              {section.people.map((director) => (
                                <li
                                  key={director.id}
                                  className="flex items-center gap-1.5"
                                >
                                  <span>{director.name}</span>

                                  <PersonPreferenceButton
                                    id={director.id}
                                    name={director.name}
                                    profilePath={director.profile_path}
                                    role="director"
                                  />
                                </li>
                              ))}
                            </ul>
                          ) : (
                            section.people
                              .map((person) => person.name)
                              .join(", ")
                          )}
                        </dd>
                      </div>
                    ))}
                  </dl>
                </section>
              )}

              {uniqueCompanies.length > 0 && (
                <section className="mt-6 max-w-3xl">
                  <h2 className="text-sm font-semibold uppercase tracking-widest text-muted">
                    {t(language, "movieDetail", "studiosHeading")}
                  </h2>

                  <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-2">
                    {uniqueCompanies.map((company) => (
                      <li
                        key={company.id}
                        className="flex items-center gap-1.5 text-sm text-foreground"
                      >
                        <span>{company.name}</span>

                        <CompanyPreferenceButton
                          id={company.id}
                          name={company.name}
                          logoPath={company.logo_path}
                          originCountry={company.origin_country || null}
                        />
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              <MovieWatchStatus movieId={movie.id} />

              <MovieRating movieId={movie.id} />

              <MovieActions movieId={movie.id} />
            </div>
          </div>
        </div>
      </section>

      {trailer && (
        <section className="mx-auto max-w-7xl px-6 py-16">
          <div className="mb-6">
            <p className="text-sm font-semibold uppercase tracking-widest text-accent">
              {t(language, "movieDetail", "trailerEyebrow")}
            </p>

            <h2 className="mt-3 text-3xl font-bold">
              {t(language, "movieDetail", "trailerHeading")}
            </h2>
          </div>

          <div className="aspect-video overflow-hidden rounded-2xl border border-border bg-black">
            <iframe
              src={`https://www.youtube.com/embed/${trailer.key}`}
              title={`${movie.title} ${t(language, "movieDetail", "trailerHeading")}`}
              className="h-full w-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </section>
      )}

      {cast.length > 0 && (
        <section className="mx-auto max-w-7xl px-6 py-16">
          <div className="mb-8">
            <p className="text-sm font-semibold uppercase tracking-widest text-accent">
              {t(language, "movieDetail", "castEyebrow")}
            </p>

            <h2 className="mt-3 text-3xl font-bold">
              {t(language, "movieDetail", "castHeading")}
            </h2>
          </div>

          <div className="grid gap-6 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {cast.map((castMember) => (
              <CastCard
                key={castMember.id}
                personId={castMember.id}
                name={castMember.name}
                character={castMember.character}
                profileUrl={getProfileUrl(castMember.profile_path)}
              />
            ))}
          </div>
        </section>
      )}

      {displayedCollectionMovies.length > 0 && collectionDetails && (
        <section className="mx-auto max-w-7xl px-6 py-16">
          <div className="mb-8">
            <p className="text-sm font-semibold uppercase tracking-widest text-accent">
              {collectionDetails.name}
            </p>

            <h2 className="mt-3 text-3xl font-bold">
              {t(language, "movieDetail", "seriesHeading")}
            </h2>

            <p className="mt-2 text-sm text-muted">
              {t(language, "movieDetail", "seriesDescription")}
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {displayedCollectionMovies.map((seriesMovie) => (
              <MovieCard
                key={seriesMovie.id}
                id={seriesMovie.id}
                title={seriesMovie.title}
                year={seriesMovie.release_date?.slice(0, 4) ?? ""}
                rating={seriesMovie.vote_average}
                voteCount={seriesMovie.vote_count}
                overview={seriesMovie.overview}
                posterUrl={getPosterUrl(seriesMovie.poster_path)}
              />
            ))}
          </div>
        </section>
      )}

      {recommendations.length > 0 && (
        <section className="mx-auto max-w-7xl px-6 py-16">
          <div className="mb-8">
            <p className="text-sm font-semibold uppercase tracking-widest text-accent">
              {t(language, "movieDetail", "recommendedEyebrow")}
            </p>

            <h2 className="mt-3 text-3xl font-bold">
              {t(language, "movieDetail", "recommendedHeading")}
            </h2>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {recommendations.map((recommendedMovie) => (
              <MovieCard
                key={recommendedMovie.id}
                id={recommendedMovie.id}
                title={recommendedMovie.title}
                year={recommendedMovie.release_date?.slice(0, 4) ?? ""}
                rating={recommendedMovie.vote_average}
                voteCount={recommendedMovie.vote_count}
                overview={recommendedMovie.overview}
                posterUrl={getPosterUrl(recommendedMovie.poster_path)}
              />
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
