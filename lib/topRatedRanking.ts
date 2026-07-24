import {
  calculateBayesianQualityScore,
  isValidVoteData,
} from "@/lib/qualityConfidence";
import type { TmdbMovie } from "@/lib/tmdb";

// Top Rated rail'i TMDB'nin ham vote_average sıralamasında bırakmak yerine,
// oy sayısına duyulan güveni de hesaba katan bir Bayesian/weighted-rating
// skoru üretir. Bkz. görev talimatı "Top Rated Quality Confidence v1".
//
// R = filmin vote_average'ı, v = filmin vote_count'u, C = aday havuzunun
// güvenilir ortalama puanı, m = "güven" oy eşiği (v, m'e yaklaştıkça skor
// R ile C arasında yarı yarıya karışır; v arttıkça skor R'ye yaklaşır).
export type TopRatedConfig = {
  // Bu eşiğin altındaki vote_count'a sahip filmlere ekstra bir güven
  // cezası uygulanır (Bayesian shrinkage'a ek olarak) — çok az oy alan
  // yapımların üst sıraları işgal etmesini engeller.
  minimumVoteCount: number;
  // Bayesian formülündeki "m" — skorun R ile C arasında yarı yarıya
  // karıştığı oy sayısı. Yükseltmek düşük oylu filmleri daha da bastırır.
  confidenceVoteCount: number;
  // Aday havuzu için en fazla kaç TMDB sayfası çekilecek.
  maxCandidatePages: number;
  // Sıralama öncesi aday havuzunun üst sınırı.
  maxCandidates: number;
  // Rail'de gösterilecek nihai film sayısı.
  maxResults: number;
  // "Yeni" sayılan filmler için referans yıldan geriye kaç yıl.
  recentYearsThreshold: number;
  // Nihai sonuçta "yeni" filmlere ayrılan hedef pay (0-1).
  recentMovieShare: number;
};

export const TOP_RATED_CONFIG: TopRatedConfig = {
  minimumVoteCount: 50,
  confidenceVoteCount: 3000,
  maxCandidatePages: 3,
  maxCandidates: 60,
  maxResults: 20,
  recentYearsThreshold: 10,
  recentMovieShare: 0.35,
};

function isValidMovie(movie: TmdbMovie): boolean {
  return (
    isValidVoteData(movie.vote_average, movie.vote_count) &&
    Number.isInteger(movie.id)
  );
}

function getReleaseTime(releaseDate: string | undefined): number | null {
  if (!releaseDate) {
    return null;
  }

  const time = new Date(releaseDate).getTime();

  return Number.isFinite(time) ? time : null;
}

function dedupeById(movies: TmdbMovie[]): TmdbMovie[] {
  const seenIds = new Set<number>();
  const result: TmdbMovie[] = [];

  for (const movie of movies) {
    if (seenIds.has(movie.id)) {
      continue;
    }

    seenIds.add(movie.id);
    result.push(movie);
  }

  return result;
}

// Aday havuzunun güvenilir ortalama puanı (C). Yalnızca geçerli alanlara
// sahip filmler ortalamaya katılır; boş/geçersiz havuzda 0 döner.
export function calculatePriorMean(movies: TmdbMovie[]): number {
  const validMovies = movies.filter(isValidMovie);

  if (validMovies.length === 0) {
    return 0;
  }

  const sum = validMovies.reduce((total, movie) => total + movie.vote_average, 0);

  return sum / validMovies.length;
}

// Merkezi kalite-güven skoru. Geçersiz/eksik veri güvenli biçimde en düşük
// skora (-Infinity) düşer, hiçbir zaman fırlatmaz.
//
// Ham Bayesian matematiği artık lib/qualityConfidence.ts'teki paylaşılan
// primitive'ten gelir (Recommendation Engine v2 aynı primitive'i kendi
// kalite sinyali için tüketir — bkz. o dosyanın başındaki not). Bu
// fonksiyonun DIŞ davranışı (imza, dönüş değeri, isValidMovie/tie-break)
// birebir aynı kalır; yalnızca iç hesap tek bir yerde paylaşılıyor.
export function calculateQualityConfidenceScore(
  movie: TmdbMovie,
  priorMean: number,
  config: TopRatedConfig = TOP_RATED_CONFIG
): number {
  if (!isValidMovie(movie)) {
    return Number.NEGATIVE_INFINITY;
  }

  return calculateBayesianQualityScore(
    movie.vote_average,
    movie.vote_count,
    priorMean,
    {
      confidenceVoteCount: config.confidenceVoteCount,
      minimumVoteCount: config.minimumVoteCount,
    }
  );
}

// Aynı skorda deterministik tie-break: yüksek vote_count, sonra yüksek
// vote_average, sonra daha eski release_date, sonra küçük movie ID.
function compareScoredMovies(
  a: { movie: TmdbMovie; score: number },
  b: { movie: TmdbMovie; score: number }
): number {
  if (a.score !== b.score) {
    return b.score - a.score;
  }

  if (a.movie.vote_count !== b.movie.vote_count) {
    return b.movie.vote_count - a.movie.vote_count;
  }

  if (a.movie.vote_average !== b.movie.vote_average) {
    return b.movie.vote_average - a.movie.vote_average;
  }

  const aTime = getReleaseTime(a.movie.release_date);
  const bTime = getReleaseTime(b.movie.release_date);

  if (aTime === null && bTime === null) {
    return a.movie.id - b.movie.id;
  }

  if (aTime === null) {
    return 1;
  }

  if (bTime === null) {
    return -1;
  }

  if (aTime !== bTime) {
    return aTime - bTime;
  }

  return a.movie.id - b.movie.id;
}

// Aday havuzunu kalite-güven skoruna göre sıralar, ardından basit ve
// deterministik bir dönem çeşitliliği (recent/classic) uygular. Franchise
// çeşitliliği bilinçli olarak atlanmıştır: mevcut aday verisinde
// belongs_to_collection alanı yoktur ve yeni bir istek eklemeden güvenilir
// biçimde üretilemez; başlık benzerliğiyle film eşleştirmek yanlış
// birleştirmelere yol açabileceği için tercih edilmemiştir.
export function rankTopRatedMovies(
  candidates: TmdbMovie[],
  config: TopRatedConfig = TOP_RATED_CONFIG,
  referenceDate: Date = new Date()
): TmdbMovie[] {
  const deduped = dedupeById(candidates).slice(0, config.maxCandidates);
  const priorMean = calculatePriorMean(deduped);

  const scored = deduped.map((movie) => ({
    movie,
    score: calculateQualityConfidenceScore(movie, priorMean, config),
  }));

  scored.sort(compareScoredMovies);

  const qualitySorted = scored.map((entry) => entry.movie);

  const recentYearCutoff = referenceDate.getFullYear() - config.recentYearsThreshold;

  const isRecent = (movie: TmdbMovie): boolean => {
    const year = Number.parseInt((movie.release_date ?? "").slice(0, 4), 10);

    return Number.isFinite(year) && year >= recentYearCutoff;
  };

  const recentPool = qualitySorted.filter(isRecent);
  const classicPool = qualitySorted.filter((movie) => !isRecent(movie));

  const targetRecentCount = Math.round(config.maxResults * config.recentMovieShare);
  const targetClassicCount = config.maxResults - targetRecentCount;

  const selectedIds = new Set<number>();

  for (const movie of recentPool.slice(0, targetRecentCount)) {
    selectedIds.add(movie.id);
  }

  for (const movie of classicPool.slice(0, targetClassicCount)) {
    selectedIds.add(movie.id);
  }

  // Kotalardan biri (ör. yeterli "yeni" film yok) tamamen dolmadıysa,
  // kalan boşlukları saf kalite sıralamasından doldur.
  if (selectedIds.size < Math.min(config.maxResults, qualitySorted.length)) {
    for (const movie of qualitySorted) {
      if (selectedIds.size >= config.maxResults) {
        break;
      }

      selectedIds.add(movie.id);
    }
  }

  return qualitySorted.filter((movie) => selectedIds.has(movie.id)).slice(0, config.maxResults);
}
