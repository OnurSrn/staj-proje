import type { CineaCollection } from "@/lib/cineaCollections";
import {
  getCollectionCandidates,
  getMovieKeywords,
  type CollectionCandidateMovie,
  type TmdbMovie,
} from "@/lib/tmdb";

// TMDB discover'dan aday toplarken kaç sayfa taranacağı (spec: "ilk 3-5
// sayfadan aday topla"). Tüm koleksiyonlarda tutarlılık için sabit tutulur.
const CANDIDATE_PAGES = 4;

// Anahtar kelime isteklerinin aynı anda kaç tanesinin uçuşacağını sınırlar
// (spec: "kontrolsüz biçimde yüzlerce paralel istek atma").
const KEYWORD_FETCH_CONCURRENCY = 6;

const RESULTS_PER_PAGE = 20;

export type CollectionEvaluation = {
  movieId: number;
  score: number;
  matchedGenres: number[];
  matchedCoreKeywords: number[];
  matchedSupportingKeywords: number[];
  matchedBroadKeywords: number[];
  genrePenalties: number[];
  failedRequiredRules: string[];
  accepted: boolean;
  acceptanceReason?: string;
  rejectionReason?: string;
};

export type CineaCollectionPageResult = {
  movies: TmdbMovie[];
  currentPage: number;
  totalPages: number;
  totalFilteredCount: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
};

function matchesAnyGroup(
  group: number[],
  candidateIds: number[]
): number[] {
  return group.filter((id) => candidateIds.includes(id));
}

// Zorunlu gruplar AND ile birleştiği için, gruplardan HERHANGİ biriyle
// (özellikle en küçük/en seçici olanla) TMDB discover seviyesinde ön
// eleme yapmak asla yanlış negatif üretmez — o grubu sağlamayan bir film
// zaten puanlama aşamasında elenecekti. Bu, geniş bir OR havuzunun
// popülerlik sıralamasında nadir zorunlu sinyalleri boğmasını önler.
function pickNarrowestGroup(
  groups: number[][] | undefined
): number[] | undefined {
  if (!groups || groups.length === 0) {
    return undefined;
  }

  return groups.reduce((smallest, group) =>
    group.length < smallest.length ? group : smallest
  );
}

/**
 * Bir filmi tek bir koleksiyonun kurallarına göre değerlendirir. Saf bir
 * fonksiyondur (fetch içermez) — test edilebilir ve okunabilir olması
 * için puanlama ve zorunlu kural kontrolleri burada ayrıştırılmıştır.
 */
export function evaluateMovieForCollection(
  collection: CineaCollection,
  movie: Pick<CollectionCandidateMovie, "id" | "vote_average" | "genre_ids">,
  keywordIds: number[],
  popularity: number
): CollectionEvaluation {
  const failedRequiredRules: string[] = [];
  const matchedGenres: number[] = [];

  let requiredGenreScore = 0;

  (collection.requiredGenreGroups ?? []).forEach((group, index) => {
    const matches = matchesAnyGroup(group, movie.genre_ids);

    if (matches.length === 0) {
      failedRequiredRules.push(`requiredGenreGroup:${index}`);
    } else {
      matchedGenres.push(...matches);
      requiredGenreScore += collection.scoringWeights.requiredGenre;
    }
  });

  let requiredKeywordScore = 0;
  const matchedRequiredKeywords: number[] = [];

  (collection.requiredKeywordGroups ?? []).forEach((group, index) => {
    const matches = matchesAnyGroup(group, keywordIds);

    if (matches.length === 0) {
      failedRequiredRules.push(`requiredKeywordGroup:${index}`);
    } else {
      matchedRequiredKeywords.push(...matches);
      requiredKeywordScore += collection.scoringWeights.requiredKeyword;
    }
  });

  // Katmanlı keyword kapısı: core/supporting/broad tanımlıysa, filmin en
  // az minimumCoreKeywordMatches kadar core YA DA en az
  // minimumSupportingSignalMatches kadar supporting sinyale sahip olması
  // gerekir. Bir keyword'ün var olması ile filmin ana temasını kurması
  // arasındaki fark burada ayrıştırılır.
  const hasKeywordTiering =
    (collection.coreKeywordIds?.length ?? 0) > 0 ||
    (collection.supportingKeywordIds?.length ?? 0) > 0 ||
    (collection.broadKeywordIds?.length ?? 0) > 0;

  const matchedCoreKeywords = matchesAnyGroup(
    collection.coreKeywordIds ?? [],
    keywordIds
  );
  const matchedSupportingKeywords = matchesAnyGroup(
    collection.supportingKeywordIds ?? [],
    keywordIds
  );
  const matchedBroadKeywords = matchesAnyGroup(
    collection.broadKeywordIds ?? [],
    keywordIds
  );

  let keywordTierReason = "";

  if (hasKeywordTiering) {
    const coreThreshold = collection.minimumCoreKeywordMatches ?? 1;
    const supportingThreshold = collection.minimumSupportingSignalMatches;

    const passesCore = matchedCoreKeywords.length >= coreThreshold;
    const passesSupporting =
      supportingThreshold !== undefined &&
      matchedSupportingKeywords.length >= supportingThreshold;

    if (!passesCore && !passesSupporting) {
      failedRequiredRules.push("keywordTier");
      keywordTierReason = `çekirdek sinyal yetersiz (${matchedCoreKeywords.length}/${coreThreshold}) ve destekleyici sinyal yetersiz (${matchedSupportingKeywords.length}/${supportingThreshold ?? "-"})`;
    } else {
      keywordTierReason = passesCore
        ? `çekirdek sinyal: ${matchedCoreKeywords.length}`
        : `destekleyici sinyal: ${matchedSupportingKeywords.length}`;
    }
  }

  const excludedGenreMatches = matchesAnyGroup(
    collection.excludedGenreIds ?? [],
    movie.genre_ids
  );
  const excludedKeywordMatches = matchesAnyGroup(
    collection.excludedKeywordIds ?? [],
    keywordIds
  );
  const isExcluded =
    excludedGenreMatches.length > 0 || excludedKeywordMatches.length > 0;

  const genrePenalties = matchesAnyGroup(
    collection.penalizedGenreIds ?? [],
    movie.genre_ids
  );

  const optionalGenreMatches = matchesAnyGroup(
    collection.optionalGenreIds ?? [],
    movie.genre_ids
  );
  const optionalKeywordMatches = matchesAnyGroup(
    collection.optionalKeywordIds ?? [],
    keywordIds
  );

  matchedGenres.push(...optionalGenreMatches);

  if (collection.minimumThemeSignals !== undefined) {
    const themeSignalCount =
      (collection.requiredGenreGroups ?? []).filter(
        (group) => matchesAnyGroup(group, movie.genre_ids).length > 0
      ).length +
      (collection.requiredKeywordGroups ?? []).filter(
        (group) => matchesAnyGroup(group, keywordIds).length > 0
      ).length +
      optionalGenreMatches.length +
      optionalKeywordMatches.length;

    if (themeSignalCount < collection.minimumThemeSignals) {
      failedRequiredRules.push("minimumThemeSignals");
    }
  }

  const qualityScore =
    collection.scoringWeights.quality * (movie.vote_average / 10);
  const popularityScore =
    collection.scoringWeights.popularity *
    (Math.min(popularity, 100) / 100);
  const exclusionPenaltyScore =
    collection.scoringWeights.penalty *
    (excludedGenreMatches.length + excludedKeywordMatches.length);
  const genrePenaltyScore =
    collection.scoringWeights.penalty * genrePenalties.length;

  const score =
    requiredGenreScore +
    requiredKeywordScore +
    matchedCoreKeywords.length * collection.scoringWeights.coreKeyword +
    matchedSupportingKeywords.length *
      collection.scoringWeights.supportingKeyword +
    matchedBroadKeywords.length * collection.scoringWeights.broadKeyword +
    optionalGenreMatches.length * collection.scoringWeights.optionalGenre +
    optionalKeywordMatches.length *
      collection.scoringWeights.optionalKeyword +
    qualityScore +
    popularityScore -
    exclusionPenaltyScore -
    genrePenaltyScore;

  const meetsMinimumScore = score >= collection.minimumCollectionScore;

  const accepted =
    failedRequiredRules.length === 0 && !isExcluded && meetsMinimumScore;

  const rejectionReason = accepted
    ? undefined
    : isExcluded
      ? `dışlanan sinyal eşleşti (genre: ${excludedGenreMatches.join(",") || "-"}, keyword: ${excludedKeywordMatches.join(",") || "-"})`
      : failedRequiredRules.length > 0
        ? `zorunlu kural sağlanmadı: ${failedRequiredRules.join(", ")}`
        : `skor eşiğin altında (${score.toFixed(1)} < ${collection.minimumCollectionScore})`;

  const acceptanceReason = accepted
    ? [
        matchedGenres.length > 0
          ? `tür eşleşmesi: ${matchedGenres.join(",")}`
          : null,
        keywordTierReason || null,
        genrePenalties.length > 0
          ? `ton cezasına rağmen kabul (${genrePenaltyScore} puan)`
          : null,
      ]
        .filter(Boolean)
        .join("; ")
    : undefined;

  return {
    movieId: movie.id,
    score,
    matchedGenres,
    matchedCoreKeywords,
    matchedSupportingKeywords,
    matchedBroadKeywords,
    genrePenalties,
    failedRequiredRules: isExcluded
      ? [...failedRequiredRules, "excludedSignal"]
      : failedRequiredRules,
    accepted,
    acceptanceReason,
    rejectionReason,
  };
}

// Katmanlı modelde kabul iki bağımsız yoldan gelebilir (core YENİ supporting)
// — discover seviyesinde yalnızca core keyword'lerle daraltmak, sadece
// supporting yoluyla geçecek adayları yanlışlıkla eler. Bu yüzden ikisinin
// birleşimi (OR) kullanılır; bu hâlâ eski geniş candidateGenreIds'ten çok
// daha seçicidir ve hiçbir geçerli adayı kaçırmaz.
function getDiscoverKeywordFilter(
  collection: CineaCollection
): number[] | undefined {
  const tieredKeywords = [
    ...(collection.coreKeywordIds ?? []),
    ...(collection.supportingKeywordIds ?? []),
  ];

  if (tieredKeywords.length > 0) {
    return Array.from(new Set(tieredKeywords));
  }

  return pickNarrowestGroup(collection.requiredKeywordGroups);
}

async function fetchCandidatePool(
  collection: CineaCollection
): Promise<CollectionCandidateMovie[]> {
  const seen = new Map<number, CollectionCandidateMovie>();

  const narrowGenreGroup =
    pickNarrowestGroup(collection.requiredGenreGroups) ??
    collection.candidateGenreIds;
  const narrowKeywordGroup = getDiscoverKeywordFilter(collection);

  for (let page = 1; page <= CANDIDATE_PAGES; page++) {
    const data = await getCollectionCandidates(
      {
        candidateGenreIds: narrowGenreGroup,
        candidateKeywordIds: narrowKeywordGroup,
        excludedGenreIds: collection.excludedGenreIds,
        sortBy: collection.sortBy,
        voteCountMin: collection.voteCountMin,
        voteAverageMin: collection.voteAverageMin,
        runtimeMin: collection.runtimeMin,
        runtimeMax: collection.runtimeMax,
      },
      page
    );

    for (const movie of data.results) {
      if (!seen.has(movie.id)) {
        seen.set(movie.id, movie);
      }
    }

    if (page >= data.total_pages) {
      break;
    }
  }

  return Array.from(seen.values());
}

async function fetchKeywordsForMovies(
  movieIds: number[]
): Promise<Map<number, number[]>> {
  const result = new Map<number, number[]>();
  let cursor = 0;

  async function worker() {
    while (cursor < movieIds.length) {
      const movieId = movieIds[cursor];
      cursor += 1;

      try {
        const keywords = await getMovieKeywords(movieId);
        result.set(
          movieId,
          keywords.map((keyword) => keyword.id)
        );
      } catch {
        result.set(movieId, []);
      }
    }
  }

  const workerCount = Math.min(KEYWORD_FETCH_CONCURRENCY, movieIds.length);
  await Promise.all(Array.from({ length: workerCount }, () => worker()));

  return result;
}

/**
 * İki aşamalı aday + doğrulama akışı: TMDB discover'dan geniş bir aday
 * havuzu toplar, her aday için anahtar kelimeleri (sınırlı eşzamanlılıkla)
 * çeker, koleksiyon kurallarına göre puanlar, eşiğin altında kalanları
 * eler ve sonucu istikrarlı biçimde sayfalar.
 */
function collectionNeedsKeywords(collection: CineaCollection): boolean {
  return (
    (collection.requiredKeywordGroups?.length ?? 0) > 0 ||
    (collection.optionalKeywordIds?.length ?? 0) > 0 ||
    (collection.excludedKeywordIds?.length ?? 0) > 0 ||
    (collection.coreKeywordIds?.length ?? 0) > 0 ||
    (collection.supportingKeywordIds?.length ?? 0) > 0 ||
    (collection.broadKeywordIds?.length ?? 0) > 0
  );
}

export async function getCineaCollectionPage(
  collection: CineaCollection,
  page: number
): Promise<CineaCollectionPageResult> {
  const candidates = await fetchCandidatePool(collection);

  const keywordsByMovieId = collectionNeedsKeywords(collection)
    ? await fetchKeywordsForMovies(candidates.map((movie) => movie.id))
    : new Map<number, number[]>();

  const accepted = candidates
    .map((movie) => {
      const keywordIds = keywordsByMovieId.get(movie.id) ?? [];
      const evaluation = evaluateMovieForCollection(
        collection,
        movie,
        keywordIds,
        movie.popularity ?? 0
      );

      return { movie, evaluation };
    })
    .filter((entry) => entry.evaluation.accepted)
    .sort((a, b) => {
      if (b.evaluation.score !== a.evaluation.score) {
        return b.evaluation.score - a.evaluation.score;
      }

      return b.movie.vote_average - a.movie.vote_average;
    })
    .map((entry) => entry.movie);

  const totalFilteredCount = accepted.length;
  const totalPages = Math.max(
    1,
    Math.ceil(totalFilteredCount / RESULTS_PER_PAGE)
  );
  const safePage = Math.max(1, Math.min(page, totalPages));

  const startIndex = (safePage - 1) * RESULTS_PER_PAGE;
  const movies = accepted.slice(startIndex, startIndex + RESULTS_PER_PAGE);

  return {
    movies,
    currentPage: safePage,
    totalPages,
    totalFilteredCount,
    hasNextPage: safePage < totalPages,
    hasPreviousPage: safePage > 1,
  };
}
