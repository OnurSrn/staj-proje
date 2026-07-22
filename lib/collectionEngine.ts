import type { CineaCollection } from "@/lib/cineaCollections";
import {
  getCollectionCandidates,
  getMovieCollectionId,
  getMovieKeywordsAndCollectionId,
  type CollectionCandidateMovie,
  type MovieKeywordsAndCollection,
  type TmdbMovie,
} from "@/lib/tmdb";

// TMDB discover'dan aday toplarken kaç sayfa taranacağı (spec: "ilk 3-5
// sayfadan aday topla"). Tüm koleksiyonlarda tutarlılık için sabit tutulur.
const CANDIDATE_PAGES = 4;

// Anahtar kelime (+ franchise dedup için binen belongs_to_collection.id)
// isteklerinin aynı anda kaç tanesinin uçuşacağını sınırlar (spec:
// "kontrolsüz biçimde yüzlerce paralel istek atma").
const KEYWORD_FETCH_CONCURRENCY = 6;

// Koleksiyon keyword'e ihtiyaç duymadığı (bu yüzden hiç per-movie isteği
// olmadığı) nadir durumda, olası franchise tekrarlarını doğrulamak için
// kullanılan ayrı, küçük eşzamanlılık sınırı.
const COLLECTION_ID_FETCH_CONCURRENCY = 6;

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

// Anahtar kelimeleri ve (aynı istekte binen) belongs_to_collection.id'yi
// birlikte çeker — bkz. getMovieKeywordsAndCollectionId. Bu, keyword'e
// ihtiyaç duyan (bugün itibarıyla tüm CiNeA Collections tanımları)
// koleksiyonlar için franchise dedup'ın TEK istek maliyeti olmasını sağlar;
// ayrı bir "collection id" isteği fazı gerekmez.
async function fetchKeywordsAndCollectionIdsForMovies(
  movieIds: number[]
): Promise<Map<number, MovieKeywordsAndCollection>> {
  const result = new Map<number, MovieKeywordsAndCollection>();
  let cursor = 0;

  async function worker() {
    while (cursor < movieIds.length) {
      const movieId = movieIds[cursor];
      cursor += 1;

      try {
        result.set(movieId, await getMovieKeywordsAndCollectionId(movieId));
      } catch {
        result.set(movieId, { keywordIds: [], collectionId: null });
      }
    }
  }

  const workerCount = Math.min(KEYWORD_FETCH_CONCURRENCY, movieIds.length);
  await Promise.all(Array.from({ length: workerCount }, () => worker()));

  return result;
}

// Yalnızca koleksiyon hiç keyword'e ihtiyaç duymadığında (bu yüzden
// yukarıdaki birleşik istekle "binecek" bir keyword akışı olmadığında)
// devreye giren dar kapsamlı yol — çağıran taraf (bkz.
// resolveCollectionIdsWithoutKeywords) burayı yalnızca başlığa göre olası
// franchise tekrarı tespit edilen küçük bir alt küme için çağırır, kabul
// edilen adayların TAMAMI için değil.
async function fetchCollectionIdsForMovies(
  movieIds: number[]
): Promise<Map<number, number | null>> {
  const result = new Map<number, number | null>();
  let cursor = 0;

  async function worker() {
    while (cursor < movieIds.length) {
      const movieId = movieIds[cursor];
      cursor += 1;

      try {
        result.set(movieId, await getMovieCollectionId(movieId));
      } catch {
        result.set(movieId, null);
      }
    }
  }

  const workerCount = Math.min(
    COLLECTION_ID_FETCH_CONCURRENCY,
    movieIds.length
  );
  await Promise.all(Array.from({ length: workerCount }, () => worker()));

  return result;
}

export type FranchiseDiversityCandidate = {
  id: number;
  score: number;
  releaseDate: string;
  collectionId: number | null;
};

function parseReleaseTime(releaseDate: string): number {
  if (!releaseDate) {
    return Number.POSITIVE_INFINITY;
  }

  const parsed = Date.parse(releaseDate);

  return Number.isNaN(parsed) ? Number.POSITIVE_INFINITY : parsed;
}

// candidate, currentBest'in yerini almalı mı? Kural sırası (spec):
// 1) daha yüksek CiNeA collection score'u, 2) eşitlikte daha eski
// release date, 3) hâlâ eşitlikte daha küçük TMDB movie id.
function isMoreRepresentative(
  candidate: FranchiseDiversityCandidate,
  currentBest: FranchiseDiversityCandidate
): boolean {
  if (candidate.score !== currentBest.score) {
    return candidate.score > currentBest.score;
  }

  const candidateTime = parseReleaseTime(candidate.releaseDate);
  const bestTime = parseReleaseTime(currentBest.releaseDate);

  if (candidateTime !== bestTime) {
    return candidateTime < bestTime;
  }

  return candidate.id < currentBest.id;
}

/**
 * Aynı TMDB `belongs_to_collection.id`'ye (franchise) sahip filmlerden
 * yalnızca en iyi temsilciyi tutar. `collectionId` yoksa (null) film kendi
 * başına ayrı bir grup sayılır — standalone spin-off'lar bu sayede ana
 * seriyle birleştirilmeden ayrıca görünebilir.
 *
 * Sıra korunur: her grubun sonuçtaki konumu, o grubun girdi listesinde İLK
 * karşılaşıldığı pozisyondur (grubun kendisi en yüksek skorlu temsilciyle
 * doldurulur). Saf bir fonksiyondur — fetch içermez, sırası önceden
 * skorlanmış/sıralanmış bir liste üzerinde çalışır.
 */
export function applyFranchiseDiversity<T extends FranchiseDiversityCandidate>(
  candidates: T[]
): T[] {
  const bestByGroup = new Map<string, T>();
  const firstIndexByGroup = new Map<string, number>();

  candidates.forEach((candidate, index) => {
    const key =
      candidate.collectionId !== null
        ? `tmdb-collection:${candidate.collectionId}`
        : `movie:${candidate.id}`;

    if (!firstIndexByGroup.has(key)) {
      firstIndexByGroup.set(key, index);
    }

    const currentBest = bestByGroup.get(key);

    if (!currentBest || isMoreRepresentative(candidate, currentBest)) {
      bestByGroup.set(key, candidate);
    }
  });

  return Array.from(firstIndexByGroup.entries())
    .sort((a, b) => a[1] - b[1])
    .map(([key]) => bestByGroup.get(key) as T);
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

// "Olası franchise tekrarı" tespiti: başlığı devam-filmi işaretlerinden
// (": alt başlık", sondaki roma rakamı veya rakam) arındırarak kaba bir
// gövde çıkarır. TMDB'ye hiç sormadan, yalnızca AYNI gövdeye sahip 2+ aday
// varsa gerçekten aynı collection'a ait olup olmadıkları doğrulanır — tekil
// gövdeli filmler hiç sorgulanmadan bağımsız kabul edilir. Bu, "yanlışlıkla
// farklı filmleri aynı franchise kabul etme" ilkesiyle güvenlidir: gövde
// eşleşmesi yalnızca kimin DOĞRULANACAĞINI seçer, collectionId'yi asla
// doğrudan atamaz — gerçek değer her zaman TMDB'den gelir. Gövdesi hiçbir
// adayla eşleşmeyen bir film en kötü ihtimalle "belirsiz durumda bağımsız
// bırakılmış" olur (spec), asla yanlış birleştirilmez.
function normalizeFranchiseTitleStem(title: string): string {
  return title
    .toLowerCase()
    .split(":")[0]
    .replace(/\b(i{1,3}|iv|vi{0,3}|ix|x)\b\s*$/g, "")
    .replace(/\b[2-9]\b\s*$/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

async function resolveCollectionIdsWithoutKeywords(
  scored: { movie: TmdbMovie; evaluation: CollectionEvaluation }[]
): Promise<Map<number, number | null>> {
  const idsByStem = new Map<string, number[]>();

  scored.forEach((entry) => {
    const stem = normalizeFranchiseTitleStem(entry.movie.title);
    const ids = idsByStem.get(stem) ?? [];
    ids.push(entry.movie.id);
    idsByStem.set(stem, ids);
  });

  const idsNeedingVerification = Array.from(idsByStem.values())
    .filter((ids) => ids.length > 1)
    .flat();

  const verifiedCollectionIds = await fetchCollectionIdsForMovies(
    idsNeedingVerification
  );

  const result = new Map<number, number | null>();

  scored.forEach((entry) => {
    result.set(
      entry.movie.id,
      verifiedCollectionIds.get(entry.movie.id) ?? null
    );
  });

  return result;
}

export async function getCineaCollectionPage(
  collection: CineaCollection,
  page: number
): Promise<CineaCollectionPageResult> {
  const candidates = await fetchCandidatePool(collection);
  const needsKeywords = collectionNeedsKeywords(collection);

  // Franchise dedup'ın ihtiyaç duyduğu belongs_to_collection.id, discover
  // adaylarında yoktur (yalnızca temel /movie/{id} gövdesinde bulunur).
  // Koleksiyon zaten keyword'e ihtiyaç duyuyorsa (bugün itibarıyla tüm CiNeA
  // Collections tanımları), collection id AYNI per-movie isteğe biner
  // (getMovieKeywordsAndCollectionId) — ayrı bir enrichment fazı YOKTUR.
  const keywordsAndCollectionByMovieId = needsKeywords
    ? await fetchKeywordsAndCollectionIdsForMovies(
        candidates.map((movie) => movie.id)
      )
    : new Map<number, MovieKeywordsAndCollection>();

  const scored = candidates
    .map((movie) => {
      const keywordIds =
        keywordsAndCollectionByMovieId.get(movie.id)?.keywordIds ?? [];
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
    });

  // Nadir durumda (koleksiyon keyword'e ihtiyaç duymuyorsa) binecek bir
  // istek olmadığından, olası tekrarlar başlık gövdesiyle önce daraltılır
  // ve yalnızca o küçük alt küme için doğrulama isteği atılır (bkz.
  // resolveCollectionIdsWithoutKeywords) — kabul edilen adayların tamamı
  // için değil.
  const collectionIdByMovieId = needsKeywords
    ? new Map(
        scored.map((entry) => [
          entry.movie.id,
          keywordsAndCollectionByMovieId.get(entry.movie.id)?.collectionId ??
            null,
        ])
      )
    : await resolveCollectionIdsWithoutKeywords(scored);

  // Dedup (bkz. applyFranchiseDiversity), TÜM kabul edilen listede
  // (sayfalama öncesi) uygulanır — aynı franchise tekrarlarının
  // kaldırılmasıyla açılan boşluklar, sonraki sayfalardaki farklı franchise
  // adaylarıyla doğal biçimde dolar; ayrı bir "doldurma" adımına gerek
  // kalmaz.
  const accepted = applyFranchiseDiversity(
    scored.map((entry) => ({
      id: entry.movie.id,
      score: entry.evaluation.score,
      releaseDate: entry.movie.release_date,
      collectionId: collectionIdByMovieId.get(entry.movie.id) ?? null,
      movie: entry.movie,
    }))
  ).map((entry) => entry.movie);

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
