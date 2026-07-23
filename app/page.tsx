import HomeHero from "@/components/home/HomeHero";
import MovieRail from "@/components/home/MovieRail";
import PageShell from "@/components/ui/PageShell";
import { t } from "@/lib/i18n";
import { getServerLanguage } from "@/lib/serverLanguage";
import { getMovieDetails, getMoviesByCategory, type TmdbMovie } from "@/lib/tmdb";

// Popular ile Now Playing ilk kartlarda mümkün olduğunca farklı olsun
// (bkz. görev talimatı bölüm 1) — yeni bir istek atmadan, zaten çekilmiş
// iki liste üzerinde saf bir yeniden sıralama yapılır: Popular'da
// bulunmayan Now Playing filmleri öne alınır, yalnızca sonuç yetersiz
// kalırsa (öne alınacak tekil film azsa) ortak filmler sona eklenir.
// Girdi listeleri aynıysa çıktı her zaman aynıdır (deterministik).
function diversifyNowPlaying(
  popularMovies: TmdbMovie[],
  nowPlayingMovies: TmdbMovie[]
): TmdbMovie[] {
  const popularIds = new Set(popularMovies.map((movie) => movie.id));
  const seenIds = new Set<number>();
  const uniqueToNowPlaying: TmdbMovie[] = [];
  const sharedWithPopular: TmdbMovie[] = [];

  for (const movie of nowPlayingMovies) {
    if (seenIds.has(movie.id)) {
      continue;
    }

    seenIds.add(movie.id);

    if (popularIds.has(movie.id)) {
      sharedWithPopular.push(movie);
    } else {
      uniqueToNowPlaying.push(movie);
    }
  }

  return [...uniqueToNowPlaying, ...sharedWithPopular];
}

const MIN_HERO_VOTE_COUNT = 300;
const HERO_CANDIDATE_COUNT = 5;

// Hero, tek film yerine küçük bir aday havuzundan deterministik olarak
// seçilmiş 4-5 film gösterir (bkz. görev talimatı bölüm 3). Yeni bir TMDB
// isteği açmadan, zaten çekilmiş Popular + Now Playing listeleri
// birleştirilip: backdrop/poster'ı olmayanlar elenir, aynı film iki
// listede birden varsa tekilleştirilir (ilk görülen — Popular önce
// taranır — kazanır), yeterli oy sayısına sahip "kaliteli" adaylar öne
// alınır. Girdi listeleri aynıysa çıktı her zaman aynıdır.
function selectHeroCandidates(
  popularMovies: TmdbMovie[],
  nowPlayingMovies: TmdbMovie[]
): TmdbMovie[] {
  const seenIds = new Set<number>();
  const strong: TmdbMovie[] = [];
  const fallback: TmdbMovie[] = [];

  for (const movie of [...popularMovies, ...nowPlayingMovies]) {
    if (seenIds.has(movie.id)) {
      continue;
    }

    if (movie.backdrop_path === null || movie.poster_path === null) {
      continue;
    }

    seenIds.add(movie.id);

    if (movie.vote_count >= MIN_HERO_VOTE_COUNT) {
      strong.push(movie);
    } else {
      fallback.push(movie);
    }
  }

  return [...strong, ...fallback].slice(0, HERO_CANDIDATE_COUNT);
}

export default async function Home() {
  const [popular, nowPlaying, topRated, upcoming, language] =
    await Promise.all([
      getMoviesByCategory("popular", 1),
      getMoviesByCategory("now-playing", 1),
      getMoviesByCategory("top-rated", 1),
      getMoviesByCategory("upcoming", 1),
      getServerLanguage(),
    ]);

  const heroCandidates = selectHeroCandidates(popular.results, nowPlaying.results);
  const heroMovies = await Promise.all(
    heroCandidates.map((candidate) => getMovieDetails(String(candidate.id)))
  );

  const exploreAllCta = t(language, "home", "exploreAllCta");
  const diversifiedNowPlaying = diversifyNowPlaying(
    popular.results,
    nowPlaying.results
  );

  return (
    <main className="min-h-screen bg-background text-foreground">
      <PageShell>
        {heroMovies.length > 0 && (
          <HomeHero movies={heroMovies} language={language} />
        )}

        <MovieRail
          className="mt-14"
          title={t(language, "categories", "popular")}
          movies={popular.results}
          href="/search"
          actionLabel={exploreAllCta}
        />

        <MovieRail
          className="mt-20"
          tone="secondary"
          title={t(language, "categories", "now-playing")}
          description={t(language, "home", "nowPlayingDescription")}
          movies={diversifiedNowPlaying}
          href="/search"
          actionLabel={exploreAllCta}
        />

        <MovieRail
          className="mt-14"
          title={t(language, "categories", "top-rated")}
          movies={topRated.results}
          href="/search"
          actionLabel={exploreAllCta}
        />

        <MovieRail
          className="mt-14"
          tone="secondary"
          title={t(language, "categories", "upcoming")}
          movies={upcoming.results}
          href="/search"
          actionLabel={exploreAllCta}
        />
      </PageShell>
    </main>
  );
}
