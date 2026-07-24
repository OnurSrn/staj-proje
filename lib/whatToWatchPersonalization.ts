import {
  applyDiversitySelection,
  type RecommendationMovie,
} from "@/lib/recommendationEngine";
import {
  CONFIDENCE_MULTIPLIERS,
  WHAT_TO_WATCH_DIVERSITY_CONFIG,
  WHAT_TO_WATCH_PERSONAL_SCORE_CAPS,
} from "@/lib/recommendationConfig";
import type { TasteProfile, WeightedPreference } from "@/lib/tasteProfile";

// ─── Model ───────────────────────────────────────────────────────────────
//
// What to Watch'ta mood/runtime/intensity/company/discovery/genre BİRİNCİL
// filtrelerdir — bu modül onları hiçbir zaman değiştirmez, yalnızca onlardan
// zaten geçmiş `candidates` dizisini TasteProfile'a göre yeniden sıralar.
// Yeni aday EKLEMEZ, mevcut adayı ÇIKARMAZ (bkz. görev talimatı bölüm 2/4).

export type RankWhatToWatchInput = {
  candidates: RecommendationMovie[];
  tasteProfile: TasteProfile;
  selectedMood: string;
  selectedGenreId: number | null;
  selectedRuntime: string;
  selectedIntensity: string;
  selectedCompany: string;
  selectedDiscovery: string;
};

export type PersonalizedWhatToWatchCandidate = {
  movie: RecommendationMovie;
  baseScore: number;
  personalScore: number;
  finalScore: number;
  reasons: string[];
};

// ─── Config ──────────────────────────────────────────────────────────────
//
// Tüm magic number'lar burada toplanır. /for-you'nun aksine burada
// kullanıcının ANLIK seçimi (mood/company/discovery/genre) baskındır;
// kişiselleştirme yalnızca küçük, sınırlı bir ek katmandır.
export const WHAT_TO_WATCH_PERSONALIZATION_WEIGHTS = {
  // Genre uyumu: en fazla genreMaxMatches güçlü eşleşme, her biri en fazla
  // genrePerMatch puan (pozitif/negatif işaretiyle).
  genrePerMatch: 3,
  genreMaxMatches: 3,

  // DNA uyumu: en fazla dnaMaxMatches güçlü eşleşme.
  dnaPerMatch: 2.5,
  dnaMaxMatches: 2,

  // Explicit favoriler — confidence'tan bağımsız, küçük ama güvenilir bonus.
  // Yönetmen biraz daha yüksek, stüdyo en düşük (bkz. görev talimatı bölüm 6/7).
  explicitActor: 2,
  explicitDirector: 3,
  explicitCompany: 1.5,

  // Inferred tercihler aynı kategori ağırlığının bu oranı kadar katkı verir
  // — explicit'ten daha düşük, ama tamamen sıfır değil.
  inferredMultiplier: 0.5,

  // Era/dil/süre tercihi — küçük, birleşik "context" bonusu.
  eraMax: 1,
  languageMax: 0.5,
  runtimeMax: 0.5,

  // baseScore, aday listesindeki orijinal konumdan (mood/company/discovery
  // için zaten doğru sıralanmış TMDB sırası) türetilir. Adımın büyüklüğü,
  // en yüksek confidence'taki personalScore tavanından (20) belirgin şekilde
  // büyük tutulur ki güçlü bir kişisel sinyal, base sırası çok uzak iki
  // adayı asla yer değiştirmesin — yalnızca YAKIN adaylar arasında görünür
  // bir etki yaratabilsin (bkz. görev talimatı bölüm 3).
  baseScoreStep: 10,

  // discovery=different seçiliyken kişisel etki bu çarpanla küçültülür —
  // keşif modu kullanıcının zaten bildiği zevklerine hapsolmasın.
  discoveryDampening: 0.5,

  // Çeşitlilik ve genre-yığılma kontrolü yalnızca ilk N sonucu kapsar —
  // recommendationEngine'deki diversity penceresiyle aynı büyüklük. Bu iki
  // değer artık lib/recommendationConfig.ts'teki
  // WHAT_TO_WATCH_DIVERSITY_CONFIG'ten gelir (merkezi config — bkz. görev
  // talimatı Aşama 1), değer DEĞİŞMEDİ.
  diversityWindow: WHAT_TO_WATCH_DIVERSITY_CONFIG.window,
  maxConsecutiveSameGenreSignature:
    WHAT_TO_WATCH_DIVERSITY_CONFIG.maxConsecutiveSameGenreSignature,
} as const;

// Personal score'un mutlak değeri, profil confidence'ına göre burada
// sınırlanır — düşük veriyle güçlü bir kişisel sıralama iddia edilmez.
// Artık lib/recommendationConfig.ts'ten (merkezi config), değer DEĞİŞMEDİ.
export const WHAT_TO_WATCH_CONFIDENCE_LIMITS: Record<
  TasteProfile["confidence"],
  number
> = WHAT_TO_WATCH_PERSONAL_SCORE_CAPS;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function round(value: number): number {
  return Math.round(value * 100) / 100;
}

// ─── Genre uyumu ─────────────────────────────────────────────────────────
function getGenreContribution(
  candidateGenreIds: number[],
  genrePreferences: WeightedPreference[]
): { score: number; topLabel: string | null } {
  if (genrePreferences.length === 0) {
    return { score: 0, topLabel: null };
  }

  const genreLookup = new Map(genrePreferences.map((g) => [Number(g.id), g]));
  const uniqueGenreIds = Array.from(new Set(candidateGenreIds));

  const matches = uniqueGenreIds
    .map((id) => genreLookup.get(id))
    .filter(
      (g): g is WeightedPreference => g !== undefined && g.score !== 0
    )
    .sort((a, b) => Math.abs(b.score) - Math.abs(a.score))
    .slice(0, WHAT_TO_WATCH_PERSONALIZATION_WEIGHTS.genreMaxMatches);

  if (matches.length === 0) {
    return { score: 0, topLabel: null };
  }

  const maxAbsScore = Math.max(
    ...genrePreferences.map((g) => Math.abs(g.score)),
    1
  );

  let total = 0;

  for (const match of matches) {
    total +=
      (match.score / maxAbsScore) *
      WHAT_TO_WATCH_PERSONALIZATION_WEIGHTS.genrePerMatch;
  }

  const topPositive = matches.find((match) => match.score > 0) ?? null;

  return { score: total, topLabel: topPositive?.label ?? null };
}

// ─── DNA uyumu ───────────────────────────────────────────────────────────
function getDnaContribution(
  movie: RecommendationMovie,
  dnaPreferences: WeightedPreference[]
): { score: number; topLabel: string | null } {
  if (dnaPreferences.length === 0) {
    return { score: 0, topLabel: null };
  }

  const dnaLookup = new Map(dnaPreferences.map((d) => [d.id, d]));
  const candidateSignalIds = Object.keys(movie.dnaProfile.signalScores);

  const matches = candidateSignalIds
    .map((id) => dnaLookup.get(id))
    .filter(
      (d): d is WeightedPreference => d !== undefined && d.score !== 0
    )
    .sort((a, b) => Math.abs(b.score) - Math.abs(a.score))
    .slice(0, WHAT_TO_WATCH_PERSONALIZATION_WEIGHTS.dnaMaxMatches);

  if (matches.length === 0) {
    return { score: 0, topLabel: null };
  }

  const maxAbsScore = Math.max(
    ...dnaPreferences.map((d) => Math.abs(d.score)),
    1
  );

  let total = 0;

  for (const match of matches) {
    total +=
      (match.score / maxAbsScore) *
      WHAT_TO_WATCH_PERSONALIZATION_WEIGHTS.dnaPerMatch;
  }

  const topPositive = matches.find((match) => match.score > 0) ?? null;

  return { score: total, topLabel: topPositive?.label ?? null };
}

// ─── Explicit / inferred favoriler ───────────────────────────────────────
type NamedMatch = { label: string };

// Explicit + inferred aynı kişi için ÇİFT katkı üretmesin diye inferred
// eşleşmeleri, explicit setlerinde olan id'leri hariç tutar (bkz. görev
// talimatı bölüm 6 — recommendationEngine.ts'teki aynı desen).
function getExplicitContribution(
  movie: RecommendationMovie,
  explicitActorSet: Set<number>,
  explicitDirectorSet: Set<number>,
  explicitCompanySet: Set<number>
): { score: number; topMatch: NamedMatch | null } {
  let score = 0;
  const matches: NamedMatch[] = [];

  const matchedDirectorId = movie.directorIds.find((id) =>
    explicitDirectorSet.has(id)
  );

  if (matchedDirectorId !== undefined) {
    score += WHAT_TO_WATCH_PERSONALIZATION_WEIGHTS.explicitDirector;
    matches.push({ label: "Favori yönetmenlerinden biri" });
  }

  const matchedActorId = movie.castIds.find((id) => explicitActorSet.has(id));

  if (matchedActorId !== undefined) {
    score += WHAT_TO_WATCH_PERSONALIZATION_WEIGHTS.explicitActor;
    matches.push({ label: "Favori oyuncularından biri" });
  }

  const matchedCompanyId = movie.companyIds.find((id) =>
    explicitCompanySet.has(id)
  );

  if (matchedCompanyId !== undefined) {
    score += WHAT_TO_WATCH_PERSONALIZATION_WEIGHTS.explicitCompany;
    matches.push({ label: "Sevdiğin bir stüdyodan" });
  }

  return { score, topMatch: matches[0] ?? null };
}

function getInferredContribution(
  movie: RecommendationMovie,
  tasteProfile: TasteProfile,
  explicitActorSet: Set<number>,
  explicitDirectorSet: Set<number>,
  explicitCompanySet: Set<number>
): { score: number; topMatch: NamedMatch | null } {
  let score = 0;
  const matches: NamedMatch[] = [];

  const directorMatch = tasteProfile.inferredDirectorPreferences.find(
    (preference) =>
      preference.score > 0 &&
      movie.directorIds.includes(preference.id) &&
      !explicitDirectorSet.has(preference.id)
  );

  if (directorMatch) {
    score +=
      WHAT_TO_WATCH_PERSONALIZATION_WEIGHTS.explicitDirector *
      WHAT_TO_WATCH_PERSONALIZATION_WEIGHTS.inferredMultiplier;
    matches.push({ label: "Sık izlediğin bir yönetmenden" });
  }

  const actorMatch = tasteProfile.inferredActorPreferences.find(
    (preference) =>
      preference.score > 0 &&
      movie.castIds.includes(preference.id) &&
      !explicitActorSet.has(preference.id)
  );

  if (actorMatch) {
    score +=
      WHAT_TO_WATCH_PERSONALIZATION_WEIGHTS.explicitActor *
      WHAT_TO_WATCH_PERSONALIZATION_WEIGHTS.inferredMultiplier;
    matches.push({ label: "Sık gördüğün bir oyuncudan" });
  }

  const companyMatch = tasteProfile.inferredCompanyPreferences.find(
    (preference) =>
      preference.score > 0 &&
      movie.companyIds.includes(preference.id) &&
      !explicitCompanySet.has(preference.id)
  );

  if (companyMatch) {
    score +=
      WHAT_TO_WATCH_PERSONALIZATION_WEIGHTS.explicitCompany *
      WHAT_TO_WATCH_PERSONALIZATION_WEIGHTS.inferredMultiplier;
    matches.push({ label: "Sık tercih ettiğin bir stüdyodan" });
  }

  return { score, topMatch: matches[0] ?? null };
}

// ─── Era / dil / süre (context) ─────────────────────────────────────────
//
// Runtime burada bir HARD filtre değildir (o zaten server-side discover
// çağrısında uygulanmıştır) — yalnızca kullanıcının geçmişte tercih ettiği
// süre bandına uyan adaylara küçük bir ek bonus verir.
function getContextContribution(
  movie: RecommendationMovie,
  tasteProfile: TasteProfile
): number {
  let score = 0;

  const year = movie.releaseDate ? Number(movie.releaseDate.slice(0, 4)) : NaN;

  if (Number.isInteger(year) && year > 0 && tasteProfile.eraPreferences.length > 0) {
    const decadeLabel = `${Math.floor(year / 10) * 10}s`;
    const match = tasteProfile.eraPreferences.find(
      (era) => era.id === decadeLabel
    );

    if (match && match.score !== 0) {
      const maxAbsScore = Math.max(
        ...tasteProfile.eraPreferences.map((era) => Math.abs(era.score)),
        1
      );

      score +=
        (match.score / maxAbsScore) *
        WHAT_TO_WATCH_PERSONALIZATION_WEIGHTS.eraMax;
    }
  }

  if (movie.originalLanguage && tasteProfile.languagePreferences.length > 0) {
    const match = tasteProfile.languagePreferences.find(
      (lang) => lang.id === movie.originalLanguage
    );

    if (match && match.score !== 0) {
      const maxAbsScore = Math.max(
        ...tasteProfile.languagePreferences.map((lang) => Math.abs(lang.score)),
        1
      );

      score +=
        (match.score / maxAbsScore) *
        WHAT_TO_WATCH_PERSONALIZATION_WEIGHTS.languageMax;
    }
  }

  const { preferredMin, preferredMax } = tasteProfile.runtimePreference;

  if (movie.runtime !== null && preferredMin !== null) {
    const inRange =
      movie.runtime >= preferredMin &&
      (preferredMax === null || movie.runtime <= preferredMax);

    if (inRange) {
      score += WHAT_TO_WATCH_PERSONALIZATION_WEIGHTS.runtimeMax;
    }
  }

  return score;
}

// ─── Genre-yığılma koruması ──────────────────────────────────────────────
//
// Kişiselleştirme, aynı genre kombinasyonuna sahip filmleri art arda
// yığmasın diye — recommendationEngine'in director/company diversity'sine
// ek, WhatToWatch'a özgü hafif bir koruma (bkz. görev talimatı bölüm 12).
function getGenreSignature(genreIds: number[]): string {
  return Array.from(new Set(genreIds))
    .sort((a, b) => a - b)
    .join(",");
}

function breakConsecutiveGenreStacking(
  items: PersonalizedWhatToWatchCandidate[]
): PersonalizedWhatToWatchCandidate[] {
  const result: PersonalizedWhatToWatchCandidate[] = [];
  const deferred: PersonalizedWhatToWatchCandidate[] = [];

  let lastSignature: string | null = null;
  let runLength = 0;

  for (const item of items) {
    const signature = getGenreSignature(item.movie.genreIds);
    const isSameAsLast = signature !== "" && signature === lastSignature;

    if (
      isSameAsLast &&
      runLength >=
        WHAT_TO_WATCH_PERSONALIZATION_WEIGHTS.maxConsecutiveSameGenreSignature
    ) {
      deferred.push(item);
      continue;
    }

    if (isSameAsLast) {
      runLength += 1;
    } else {
      lastSignature = signature;
      runLength = 1;
    }

    result.push(item);
  }

  return [...result, ...deferred];
}

// ─── Ana giriş noktası ───────────────────────────────────────────────────
/**
 * Mood/runtime/intensity/company/discovery/genre filtrelerinden ZATEN
 * geçmiş `candidates` dizisini TasteProfile'a göre kontrollü biçimde
 * yeniden sıralar. Yeni aday eklemez, mevcut adayı çıkarmaz — yalnızca
 * sırayı değiştirir. Saf bir fonksiyondur: fetch yapmaz, React'a bağımlı
 * değildir, random/Date.now kullanmaz. Aynı girdi her zaman aynı
 * (deterministik) sıralamayı üretir.
 */
export function rankWhatToWatchCandidates(
  input: RankWhatToWatchInput
): PersonalizedWhatToWatchCandidate[] {
  const { candidates, tasteProfile, selectedDiscovery } = input;

  const explicitActorSet = new Set(tasteProfile.explicitFavoriteActorIds);
  const explicitDirectorSet = new Set(tasteProfile.explicitFavoriteDirectorIds);
  const explicitCompanySet = new Set(tasteProfile.explicitFavoriteCompanyIds);

  const confidenceMultiplier = CONFIDENCE_MULTIPLIERS[tasteProfile.confidence];
  const personalCap = WHAT_TO_WATCH_CONFIDENCE_LIMITS[tasteProfile.confidence];

  // Keşif modunda kişisel etki bilinçli olarak küçültülür — kullanıcıyı
  // zaten bildiği zevklerine hapsetmemek için (bkz. görev talimatı bölüm 8).
  const discoveryDampening =
    selectedDiscovery === "different"
      ? WHAT_TO_WATCH_PERSONALIZATION_WEIGHTS.discoveryDampening
      : 1;

  const total = candidates.length;

  const scored: PersonalizedWhatToWatchCandidate[] = candidates.map(
    (movie, index) => {
      // baseScore, orijinal (mood/company/discovery'ye göre zaten doğru
      // sıralanmış) konumdan türetilir — index 0 en yüksek baseScore'u alır.
      const baseScore =
        (total - index) * WHAT_TO_WATCH_PERSONALIZATION_WEIGHTS.baseScoreStep;

      const genre = getGenreContribution(
        movie.genreIds,
        tasteProfile.genrePreferences
      );
      const dna = getDnaContribution(movie, tasteProfile.dnaPreferences);
      const explicit = getExplicitContribution(
        movie,
        explicitActorSet,
        explicitDirectorSet,
        explicitCompanySet
      );
      const inferred = getInferredContribution(
        movie,
        tasteProfile,
        explicitActorSet,
        explicitDirectorSet,
        explicitCompanySet
      );
      const context = getContextContribution(movie, tasteProfile);

      const rawPersonalScore =
        genre.score * confidenceMultiplier +
        dna.score * confidenceMultiplier +
        explicit.score +
        inferred.score * confidenceMultiplier +
        context * confidenceMultiplier;

      const cappedPersonalScore = clamp(
        rawPersonalScore,
        -personalCap,
        personalCap
      );
      const personalScore = round(cappedPersonalScore * discoveryDampening);

      // Reason önceliği: explicit (en güvenilir) > genre > DNA > inferred.
      const reasons: string[] = [];

      if (explicit.topMatch) {
        reasons.push(explicit.topMatch.label);
      } else if (genre.topLabel) {
        reasons.push(`${genre.topLabel} tercihin`);
      } else if (dna.topLabel) {
        reasons.push(`${dna.topLabel} hikâyeleri seviyorsun`);
      } else if (inferred.topMatch) {
        reasons.push(inferred.topMatch.label);
      }

      return {
        movie,
        baseScore,
        personalScore,
        finalScore: round(baseScore + personalScore),
        reasons,
      };
    }
  );

  scored.sort((a, b) => {
    if (b.finalScore !== a.finalScore) {
      return b.finalScore - a.finalScore;
    }

    return a.movie.id - b.movie.id;
  });

  const windowSize = Math.min(
    scored.length,
    WHAT_TO_WATCH_PERSONALIZATION_WEIGHTS.diversityWindow
  );

  const diversified = applyDiversitySelection(scored, windowSize, {
    getId: (candidate) => candidate.movie.id,
    getScore: (candidate) => candidate.finalScore,
    getDirectorIds: (candidate) => candidate.movie.directorIds,
    getCompanyIds: (candidate) => candidate.movie.companyIds,
  });

  return breakConsecutiveGenreStacking(diversified);
}

// ─── Profil sinyali var mı? ──────────────────────────────────────────────
/**
 * UI'da kişiselleştirme açıklamasının gösterilip gösterilmeyeceğine karar
 * vermek için kullanılır — hiç rating/status/tercih yoksa personalScore
 * zaten her aday için 0 üretir, bu yüzden açıklama göstermenin bir anlamı
 * yoktur (bkz. görev talimatı bölüm 9/10).
 */
export function hasAnyTasteProfileSignal(tasteProfile: TasteProfile): boolean {
  return (
    tasteProfile.totalRatedMovies > 0 ||
    tasteProfile.totalStatusMovies > 0 ||
    tasteProfile.explicitFavoriteActorIds.length > 0 ||
    tasteProfile.explicitFavoriteDirectorIds.length > 0 ||
    tasteProfile.explicitFavoriteCompanyIds.length > 0
  );
}
