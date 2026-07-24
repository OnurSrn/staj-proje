import {
  calculateCineaMatch,
  type CineaMatch,
  type RecommendationScoreBreakdown,
} from "@/lib/cineaMatch";
import type { MovieDnaProfile } from "@/lib/movieDna";
import {
  calculateBayesianQualityScore,
  normalizeQualityConfidence,
} from "@/lib/qualityConfidence";
import {
  CONFIDENCE_MULTIPLIERS,
  EXPLICIT_CATEGORY_WEIGHTS,
  EXPLICIT_MIN_CONFIDENCE_MULTIPLIER,
  INFERRED_PREFERENCE_CONFIG,
  MAX_DNA_MATCHES_PER_CANDIDATE,
  MAX_GENRE_MATCHES_PER_CANDIDATE,
  RECOMMENDATION_DIVERSITY_CONFIG,
  RECOMMENDATION_QUALITY_CONFIG,
  RECOMMENDATION_WEIGHT_CAPS,
  RUNTIME_FIT_CONFIG,
} from "@/lib/recommendationConfig";
import type { PersonPreference, TasteProfile } from "@/lib/tasteProfile";

export type { RecommendationScoreBreakdown } from "@/lib/cineaMatch";

// ─── Model ───────────────────────────────────────────────────────────────

export type RecommendationReasonType =
  | "genre"
  | "dna"
  | "actor"
  | "director"
  | "company"
  | "era"
  | "language"
  | "runtime"
  | "discovery";

export type RecommendationReason = {
  type: RecommendationReasonType;
  label: string;
  contribution: number;
};

export type RecommendationMovie = {
  id: number;
  title: string;
  originalTitle: string;
  overview: string;
  posterPath: string | null;
  backdropPath: string | null;
  releaseDate: string;
  originalLanguage: string;
  genreIds: number[];
  runtime: number | null;
  voteAverage: number;
  voteCount: number;
  popularity: number;
  castIds: number[];
  directorIds: number[];
  companyIds: number[];
  originCountryCodes: string[];
  dnaProfile: MovieDnaProfile;
  // Bu adayın hangi candidate source'lardan (bkz. lib/recommendationConfig.ts
  // RECOMMENDATION_SOURCES) geldiği — provenance. Opsiyonel: yalnızca
  // /api/recommendations tabanlı akış (useRecommendations.ts) doldurur;
  // What to Watch gibi başka çağıranlar boş bırakabilir (bkz. görev
  // talimatı Aşama 3 "candidate provenance korunmalı").
  sourceIds?: string[];
};

export type RecommendationCandidate = {
  movie: RecommendationMovie;
  score: number;
  // Bayesian kalite-güven sinyali, [0,1] — bkz. lib/qualityConfidence.ts.
  // Tie-break'te ve explain/debug helper'ında kullanılır (bkz. görev
  // talimatı Aşama 6/8/11).
  qualityConfidence: number;
  reasons: RecommendationReason[];
  breakdown: RecommendationScoreBreakdown;
  match: CineaMatch;
};

// Tek bir kişisel katkı sinyali — UI'daki 2 reason'a bağlı kalmadan,
// CiNeA Match'in kanıt sayımı (positive/negative/unique type) bu ham
// listeden hesaplanır (bkz. görev talimatı bölüm 5: "Hesaplama yalnızca
// UI'da gösterilen 2 reason'a bağlı olmasın").
type PersonalSignal = {
  type: RecommendationReasonType;
  contribution: number;
};

export type RankRecommendationInput = {
  tasteProfile: TasteProfile;
  candidates: RecommendationMovie[];
  excludedMovieIds: number[];
  // TasteProfile yalnızca explicit/inferred kişi id'lerini tutar; isimler
  // React provider'a bağımlı olmadan, saf birer lookup map olarak buraya
  // taşınır (bkz. görev talimatı: "Saf fonksiyonun doğrudan React
  // provider'a bağımlı olmaması gerekir").
  personNames?: Record<number, string>;
  companyNames?: Record<number, string>;
};

// ─── Config ──────────────────────────────────────────────────────────────
//
// Hiçbir kategori tek başına sonucu domine etmesin diye her bileşenin bir
// üst sınırı var; toplamın tam 100 olması şart değil (bkz. görev talimatı).
//
// Tüm ham sayısal değerler artık lib/recommendationConfig.ts'te yaşar (bkz.
// "CiNeA Recommendation Engine v2" Aşama 1) — burada yalnızca bu dosyanın
// geri kalanının kullandığı KISA yerel isimlere yeniden bağlanır; hiçbir
// değer değişmedi.
const RECOMMENDATION_WEIGHTS = RECOMMENDATION_WEIGHT_CAPS;
const EXPLICIT_MIN_MULTIPLIER = EXPLICIT_MIN_CONFIDENCE_MULTIPLIER;
const MAX_GENRE_MATCHES = MAX_GENRE_MATCHES_PER_CANDIDATE;
const MAX_DNA_MATCHES = MAX_DNA_MATCHES_PER_CANDIDATE;

const EXPLICIT_ACTOR_WEIGHT = EXPLICIT_CATEGORY_WEIGHTS.actor;
const EXPLICIT_DIRECTOR_WEIGHT = EXPLICIT_CATEGORY_WEIGHTS.director;
const EXPLICIT_COMPANY_WEIGHT = EXPLICIT_CATEGORY_WEIGHTS.company;
const EXPLICIT_MAX_RAW = EXPLICIT_ACTOR_WEIGHT + EXPLICIT_DIRECTOR_WEIGHT + EXPLICIT_COMPANY_WEIGHT;

const INFERRED_STRONG_EVIDENCE_COUNT = INFERRED_PREFERENCE_CONFIG.strongEvidenceCount;
const INFERRED_LOW_EVIDENCE_MULTIPLIER = INFERRED_PREFERENCE_CONFIG.lowEvidenceMultiplier;
const INFERRED_STRONG_EVIDENCE_MULTIPLIER = INFERRED_PREFERENCE_CONFIG.strongEvidenceMultiplier;
const INFERRED_CATEGORY_COUNT = INFERRED_PREFERENCE_CONFIG.categoryCount; // actor + director + company

const FAR_RUNTIME_DISTANCE_MINUTES = RUNTIME_FIT_CONFIG.farDistanceMinutes;
const FAR_RUNTIME_PENALTY = RUNTIME_FIT_CONFIG.farPenalty;

// Çeşitlilik penceresi (ilk N sonuç) ve kısıtları.
const DIVERSITY_WINDOW = RECOMMENDATION_DIVERSITY_CONFIG.window;
const MAX_PER_DIRECTOR_IN_WINDOW = RECOMMENDATION_DIVERSITY_CONFIG.maxPerDirectorInWindow;
const MAX_PER_COMPANY_IN_WINDOW = RECOMMENDATION_DIVERSITY_CONFIG.maxPerCompanyInWindow;
// Bir aday çeşitlilik kısıtını ihlal etse de, penceredeki en düşük skorlu
// seçilmiş adaydan bu kadar (veya daha fazla) yüksek puanlıysa yine de
// korunur — "score farkı büyükse güçlü eşleşme korunmalı" kuralı.
const DIVERSITY_SCORE_GUARD = RECOMMENDATION_DIVERSITY_CONFIG.scoreGuard;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function round(value: number): number {
  return Math.round(value * 100) / 100;
}

// ─── Genre uyumu ─────────────────────────────────────────────────────────
//
// Adayın türleri, TasteProfile.genrePreferences'taki skorlarla eşleştirilir.
// En güçlü (mutlak değerce) en fazla MAX_GENRE_MATCHES tür hesaba katılır —
// çok türlü bir film bu sayede haksız avantaj kazanmaz. Skorlar
// genrePreferences içindeki en yüksek mutlak değere göre normalize edilip
// genreMax'a dağıtılır; nötr (score===0) eşleşmeler hiç katkı üretmez.
function getGenreContribution(
  candidateGenreIds: number[],
  genrePreferences: TasteProfile["genrePreferences"],
  confidenceMultiplier: number
): {
  contribution: number;
  reasons: RecommendationReason[];
  signals: PersonalSignal[];
} {
  if (genrePreferences.length === 0) {
    return { contribution: 0, reasons: [], signals: [] };
  }

  const genreLookup = new Map(genrePreferences.map((g) => [Number(g.id), g]));
  const uniqueGenreIds = Array.from(new Set(candidateGenreIds));

  const matches = uniqueGenreIds
    .map((id) => genreLookup.get(id))
    .filter(
      (g): g is TasteProfile["genrePreferences"][number] =>
        g !== undefined && g.score !== 0
    )
    .sort((a, b) => Math.abs(b.score) - Math.abs(a.score))
    .slice(0, MAX_GENRE_MATCHES);

  if (matches.length === 0) {
    return { contribution: 0, reasons: [], signals: [] };
  }

  const maxAbsScore = Math.max(
    ...genrePreferences.map((g) => Math.abs(g.score)),
    1
  );
  const perMatchCap = RECOMMENDATION_WEIGHTS.genreMax / MAX_GENRE_MATCHES;

  let total = 0;
  const reasons: RecommendationReason[] = [];
  const signals: PersonalSignal[] = [];

  for (const match of matches) {
    const normalized = match.score / maxAbsScore;
    const contribution = normalized * perMatchCap * confidenceMultiplier;

    total += contribution;

    if (contribution !== 0) {
      signals.push({ type: "genre", contribution: round(contribution) });
    }

    if (contribution > 0) {
      reasons.push({
        type: "genre",
        label: `${match.label} tercihinle uyumlu`,
        contribution: round(contribution),
      });
    }
  }

  return {
    contribution: clamp(
      total,
      -RECOMMENDATION_WEIGHTS.genreMax,
      RECOMMENDATION_WEIGHTS.genreMax
    ),
    reasons,
    signals,
  };
}

// ─── Movie DNA uyumu ─────────────────────────────────────────────────────
//
// Aynı normalize+cap mantığı DNA sinyalleri için. Signal label'ları
// lib/movieDna.ts'teki TEK sözlükten (tasteProfile.ts üzerinden zaten
// çözülmüş `label` alanı) gelir — ikinci bir label sözlüğü kurulmaz.
function getDnaContribution(
  candidateSignalScores: Record<string, number>,
  dnaPreferences: TasteProfile["dnaPreferences"],
  confidenceMultiplier: number
): {
  contribution: number;
  reasons: RecommendationReason[];
  signals: PersonalSignal[];
} {
  if (dnaPreferences.length === 0) {
    return { contribution: 0, reasons: [], signals: [] };
  }

  const dnaLookup = new Map(dnaPreferences.map((d) => [d.id, d]));
  const candidateSignalIds = Object.keys(candidateSignalScores);

  const matches = candidateSignalIds
    .map((id) => dnaLookup.get(id))
    .filter(
      (d): d is TasteProfile["dnaPreferences"][number] =>
        d !== undefined && d.score !== 0
    )
    .sort((a, b) => Math.abs(b.score) - Math.abs(a.score))
    .slice(0, MAX_DNA_MATCHES);

  if (matches.length === 0) {
    return { contribution: 0, reasons: [], signals: [] };
  }

  const maxAbsScore = Math.max(
    ...dnaPreferences.map((d) => Math.abs(d.score)),
    1
  );
  const perMatchCap = RECOMMENDATION_WEIGHTS.dnaMax / MAX_DNA_MATCHES;

  let total = 0;
  const reasons: RecommendationReason[] = [];
  const signals: PersonalSignal[] = [];

  for (const match of matches) {
    const normalized = match.score / maxAbsScore;
    const contribution = normalized * perMatchCap * confidenceMultiplier;

    total += contribution;

    if (contribution !== 0) {
      signals.push({ type: "dna", contribution: round(contribution) });
    }

    if (contribution > 0) {
      reasons.push({
        type: "dna",
        label: `${match.label} eğilimine uyuyor`,
        contribution: round(contribution),
      });
    }
  }

  return {
    contribution: clamp(
      total,
      -RECOMMENDATION_WEIGHTS.dnaMax,
      RECOMMENDATION_WEIGHTS.dnaMax
    ),
    reasons,
    signals,
  };
}

// ─── Explicit favoriler ──────────────────────────────────────────────────
//
// Kullanıcının Preferences sayfasında AÇIKÇA seçtiği oyuncu/yönetmen/
// stüdyo — en güvenilir sinyal. Confidence düşük olsa bile
// EXPLICIT_MIN_MULTIPLIER'ın altına inmez. Aynı kategoride birden fazla
// eşleşme olsa da yalnızca ilk eşleşen kişi/stüdyo sayılır (sınırsız skor
// üretmez).
function getExplicitContribution(
  candidateCastIds: number[],
  candidateDirectorIds: number[],
  candidateCompanyIds: number[],
  tasteProfile: TasteProfile,
  personNames: Record<number, string> | undefined,
  companyNames: Record<number, string> | undefined,
  confidenceMultiplier: number
): {
  contribution: number;
  reasons: RecommendationReason[];
  signals: PersonalSignal[];
} {
  const explicitActorSet = new Set(tasteProfile.explicitFavoriteActorIds);
  const explicitDirectorSet = new Set(tasteProfile.explicitFavoriteDirectorIds);
  const explicitCompanySet = new Set(tasteProfile.explicitFavoriteCompanyIds);

  const multiplier = Math.max(confidenceMultiplier, EXPLICIT_MIN_MULTIPLIER);

  const parts: { weight: number; type: RecommendationReasonType; label: string }[] = [];

  const matchedActorId = candidateCastIds.find((id) => explicitActorSet.has(id));
  if (matchedActorId !== undefined) {
    const name = personNames?.[matchedActorId];
    parts.push({
      weight: EXPLICIT_ACTOR_WEIGHT,
      type: "actor",
      label: name ? `Favori oyuncun ${name}` : "Favori bir oyuncun bu filmde",
    });
  }

  const matchedDirectorId = candidateDirectorIds.find((id) =>
    explicitDirectorSet.has(id)
  );
  if (matchedDirectorId !== undefined) {
    const name = personNames?.[matchedDirectorId];
    parts.push({
      weight: EXPLICIT_DIRECTOR_WEIGHT,
      type: "director",
      label: name
        ? `Favori yönetmenin ${name}`
        : "Favori bir yönetmenin bu filmde",
    });
  }

  const matchedCompanyId = candidateCompanyIds.find((id) =>
    explicitCompanySet.has(id)
  );
  if (matchedCompanyId !== undefined) {
    const name = companyNames?.[matchedCompanyId];
    parts.push({
      weight: EXPLICIT_COMPANY_WEIGHT,
      type: "company",
      label: name ? `Sevdiğin stüdyolardan ${name}` : "Sevdiğin bir stüdyodan",
    });
  }

  if (parts.length === 0) {
    return { contribution: 0, reasons: [], signals: [] };
  }

  const rawTotal = parts.reduce((sum, part) => sum + part.weight, 0);
  const contribution =
    (rawTotal / EXPLICIT_MAX_RAW) * RECOMMENDATION_WEIGHTS.explicitMax * multiplier;
  const perUnit = contribution / rawTotal;

  const reasons: RecommendationReason[] = parts.map((part) => ({
    type: part.type,
    label: part.label,
    contribution: round(perUnit * part.weight),
  }));

  const signals: PersonalSignal[] = reasons.map((reason) => ({
    type: reason.type,
    contribution: reason.contribution,
  }));

  return { contribution, reasons, signals };
}

// ─── Inferred kişi/stüdyo tercihleri ────────────────────────────────────
//
// Puanlama geçmişinden ÇIKARILAN, daha zayıf bir sinyal. Explicit favori
// olan bir kişi/stüdyo için inferred katkı burada YOK SAYILIR — aynı kişi
// için çift tam katkı üretilmez (explicit ana sinyal kalır). evidenceCount
// 2 ise düşük, 3+ ise tam ağırlık uygulanır.
function getInferredEvidenceMultiplier(evidenceCount: number): number {
  return evidenceCount >= INFERRED_STRONG_EVIDENCE_COUNT
    ? INFERRED_STRONG_EVIDENCE_MULTIPLIER
    : INFERRED_LOW_EVIDENCE_MULTIPLIER;
}

function findInferredMatch(
  preferences: PersonPreference[],
  candidateIds: number[],
  explicitSet: Set<number>
): PersonPreference | undefined {
  return preferences.find(
    (preference) =>
      preference.score > 0 &&
      candidateIds.includes(preference.id) &&
      !explicitSet.has(preference.id)
  );
}

function getInferredContribution(
  candidateCastIds: number[],
  candidateDirectorIds: number[],
  candidateCompanyIds: number[],
  tasteProfile: TasteProfile,
  personNames: Record<number, string> | undefined,
  companyNames: Record<number, string> | undefined,
  confidenceMultiplier: number
): {
  contribution: number;
  reasons: RecommendationReason[];
  signals: PersonalSignal[];
} {
  const explicitActorSet = new Set(tasteProfile.explicitFavoriteActorIds);
  const explicitDirectorSet = new Set(tasteProfile.explicitFavoriteDirectorIds);
  const explicitCompanySet = new Set(tasteProfile.explicitFavoriteCompanyIds);

  const matches: {
    pref: PersonPreference;
    type: RecommendationReasonType;
    name: string | undefined;
    reasonTemplate: (name: string) => string;
  }[] = [];

  const actorMatch = findInferredMatch(
    tasteProfile.inferredActorPreferences,
    candidateCastIds,
    explicitActorSet
  );
  if (actorMatch) {
    matches.push({
      pref: actorMatch,
      type: "actor",
      name: personNames?.[actorMatch.id],
      reasonTemplate: (name) => `Beğendiğin filmlerde sık gördüğün ${name}`,
    });
  }

  const directorMatch = findInferredMatch(
    tasteProfile.inferredDirectorPreferences,
    candidateDirectorIds,
    explicitDirectorSet
  );
  if (directorMatch) {
    matches.push({
      pref: directorMatch,
      type: "director",
      name: personNames?.[directorMatch.id],
      reasonTemplate: (name) => `Sevdiğin yapımlarda sık karşılaştığın ${name}`,
    });
  }

  const companyMatch = findInferredMatch(
    tasteProfile.inferredCompanyPreferences,
    candidateCompanyIds,
    explicitCompanySet
  );
  if (companyMatch) {
    matches.push({
      pref: companyMatch,
      type: "company",
      name: companyNames?.[companyMatch.id],
      reasonTemplate: (name) => `Sık tercih ettiğin ${name}`,
    });
  }

  if (matches.length === 0) {
    return { contribution: 0, reasons: [], signals: [] };
  }

  const perMatchCap = RECOMMENDATION_WEIGHTS.inferredMax / INFERRED_CATEGORY_COUNT;
  let total = 0;
  const reasons: RecommendationReason[] = [];
  const signals: PersonalSignal[] = [];

  for (const match of matches) {
    const evidenceMultiplier = getInferredEvidenceMultiplier(match.pref.evidenceCount);
    const contribution = perMatchCap * evidenceMultiplier * confidenceMultiplier;

    total += contribution;

    // Match yüzdesi hesaplaması (kanıt sayımı) isim olup olmadığından
    // bağımsız — yalnızca UI'daki reason metni isim gerektirir.
    signals.push({ type: match.type, contribution: round(contribution) });

    // İsim yoksa ID kullanıcıya gösterilmez — reason atlanır, skor yine
    // uygulanır (bkz. görev talimatı).
    if (match.name) {
      reasons.push({
        type: match.type,
        label: match.reasonTemplate(match.name),
        contribution: round(contribution),
      });
    }
  }

  return {
    contribution: Math.min(total, RECOMMENDATION_WEIGHTS.inferredMax),
    reasons,
    signals,
  };
}

// ─── Era / dil / süre ────────────────────────────────────────────────────
function getEraContribution(
  releaseDate: string,
  eraPreferences: TasteProfile["eraPreferences"],
  confidenceMultiplier: number
): {
  contribution: number;
  reasons: RecommendationReason[];
  signals: PersonalSignal[];
} {
  const year = releaseDate ? Number(releaseDate.slice(0, 4)) : NaN;

  if (!Number.isInteger(year) || year <= 0) {
    return { contribution: 0, reasons: [], signals: [] };
  }

  const decadeLabel = `${Math.floor(year / 10) * 10}s`;
  const match = eraPreferences.find((era) => era.id === decadeLabel);

  if (!match || match.score === 0) {
    return { contribution: 0, reasons: [], signals: [] };
  }

  const maxAbsScore = Math.max(
    ...eraPreferences.map((era) => Math.abs(era.score)),
    1
  );
  const contribution =
    (match.score / maxAbsScore) * RECOMMENDATION_WEIGHTS.eraMax * confidenceMultiplier;

  const reasons: RecommendationReason[] =
    contribution > 0
      ? [
          {
            type: "era",
            label: `${decadeLabel} filmlerini seviyorsun`,
            contribution: round(contribution),
          },
        ]
      : [];

  const signals: PersonalSignal[] =
    contribution !== 0 ? [{ type: "era", contribution: round(contribution) }] : [];

  return { contribution, reasons, signals };
}

function getLanguageContribution(
  originalLanguage: string,
  languagePreferences: TasteProfile["languagePreferences"],
  confidenceMultiplier: number
): {
  contribution: number;
  reasons: RecommendationReason[];
  signals: PersonalSignal[];
} {
  if (!originalLanguage) {
    return { contribution: 0, reasons: [], signals: [] };
  }

  const match = languagePreferences.find((lang) => lang.id === originalLanguage);

  if (!match || match.score === 0) {
    return { contribution: 0, reasons: [], signals: [] };
  }

  const maxAbsScore = Math.max(
    ...languagePreferences.map((lang) => Math.abs(lang.score)),
    1
  );
  const contribution =
    (match.score / maxAbsScore) *
    RECOMMENDATION_WEIGHTS.languageMax *
    confidenceMultiplier;

  const reasons: RecommendationReason[] =
    contribution > 0
      ? [
          {
            type: "language",
            label: `${match.label} yapımları tercihine uyuyor`,
            contribution: round(contribution),
          },
        ]
      : [];

  const signals: PersonalSignal[] =
    contribution !== 0
      ? [{ type: "language", contribution: round(contribution) }]
      : [];

  return { contribution, reasons, signals };
}

function getRuntimeContribution(
  runtime: number | null,
  runtimePreference: TasteProfile["runtimePreference"],
  confidenceMultiplier: number
): {
  contribution: number;
  reasons: RecommendationReason[];
  signals: PersonalSignal[];
} {
  const { preferredMin, preferredMax } = runtimePreference;

  if (runtime === null || preferredMin === null) {
    return { contribution: 0, reasons: [], signals: [] };
  }

  const inRange =
    runtime >= preferredMin && (preferredMax === null || runtime <= preferredMax);

  if (inRange) {
    const contribution = RECOMMENDATION_WEIGHTS.runtimeMax * confidenceMultiplier;

    return {
      contribution,
      reasons: [
        {
          type: "runtime",
          label: "Tercih ettiğin süreye uygun",
          contribution: round(contribution),
        },
      ],
      signals: [{ type: "runtime", contribution: round(contribution) }],
    };
  }

  const distance =
    preferredMax !== null
      ? Math.max(0, runtime - preferredMax, preferredMin - runtime)
      : Math.max(0, preferredMin - runtime);

  if (distance > FAR_RUNTIME_DISTANCE_MINUTES) {
    const contribution = -FAR_RUNTIME_PENALTY * confidenceMultiplier;

    return {
      contribution,
      reasons: [],
      signals: [{ type: "runtime", contribution: round(contribution) }],
    };
  }

  return { contribution: 0, reasons: [], signals: [] };
}

// ─── Kalite/discovery dengesi ────────────────────────────────────────────
//
// TMDB puanı burada KİŞİSEL zevk olarak değil, yalnızca aday
// kalitesi/sıralama güvenliği için kullanılır (bkz. görev kısıtı). Az
// oylanmış filmler cezalandırılmaz, yalnızca bonus almaz.
//
// v2: kalite bonusu artık lib/qualityConfidence.ts'teki PAYLAŞILAN
// Bayesian primitive'inden gelir — Top Rated ile AYNI formül, ayrı bir
// kopya yazılmadı (bkz. görev talimatı Aşama 5). Eski (v1) sabit +5
// eşik-bonusu yerine, oy sayısına göre KADEMELİ (graduated) bir bonus
// üretir: 15 oyla 9.5 puan artık neredeyse hiç bonus almazken, 50.000+
// oyla 8.7 puan tam/yakın tavana ulaşır. Düşük-kalite CEZASI ise v1 ile
// birebir AYNI bırakıldı (bilerek Bayesian hesaptan ayrı) — davranış
// dramatik değişmesin diye (bkz. final rapor "Quality confidence" örnek
// önce/sonra karşılaştırması).
function getQualityContribution(
  voteAverage: number,
  voteCount: number,
  popularity: number
): {
  contribution: number;
  reasons: RecommendationReason[];
  qualityConfidence: number;
} {
  const bayesianScore = calculateBayesianQualityScore(
    voteAverage,
    voteCount,
    RECOMMENDATION_QUALITY_CONFIG.priorMean,
    {
      confidenceVoteCount: RECOMMENDATION_QUALITY_CONFIG.confidenceVoteCount,
      minimumVoteCount: RECOMMENDATION_QUALITY_CONFIG.minimumVoteCount,
    }
  );

  const qualityConfidence = normalizeQualityConfidence(bayesianScore, {
    lowerAnchor: RECOMMENDATION_QUALITY_CONFIG.lowerAnchor,
    upperAnchor: RECOMMENDATION_QUALITY_CONFIG.upperAnchor,
  });

  // [0,1] -> [0, qualityMax] — yalnızca pozitif bir bonus (v1'in "az
  // oylanmış filme ceza yok" prensibiyle tutarlı).
  let contribution = qualityConfidence * RECOMMENDATION_WEIGHTS.qualityMax;

  // v1 ile AYNI, DEĞİŞTİRİLMEMİŞ düşük-kalite cezası.
  if (
    voteCount >= RECOMMENDATION_QUALITY_CONFIG.lowVoteCountThreshold &&
    voteAverage > 0 &&
    voteAverage < RECOMMENDATION_QUALITY_CONFIG.lowVoteAverageThreshold
  ) {
    contribution -= RECOMMENDATION_QUALITY_CONFIG.lowQualityPenalty;
  }

  // NaN/eksik popularity (Math.max/Math.min NaN'i sessizce sızdırır) burada
  // güvenli biçimde 0'a düşürülür — aksi halde tüm contribution NaN'e
  // dönüşürdü (bkz. test matrisi senaryo 17/22 — bu, v2 öncesinde de var
  // olan gizli bir hataydı, burada düzeltildi).
  const safePopularity = Number.isFinite(popularity) ? popularity : 0;
  const popularityBonus = Math.min(
    RECOMMENDATION_QUALITY_CONFIG.maxPopularityBonus,
    Math.log10(Math.max(1, safePopularity))
  );

  contribution += popularityBonus;
  contribution = clamp(
    contribution,
    -RECOMMENDATION_WEIGHTS.qualityMax,
    RECOMMENDATION_WEIGHTS.qualityMax
  );

  const reasons: RecommendationReason[] =
    contribution > 3
      ? [
          {
            type: "discovery",
            label: "Genel olarak beğenilen bir yapım",
            contribution: round(contribution),
          },
        ]
      : [];

  return { contribution, reasons, qualityConfidence };
}

// ─── Tek film skorlama ───────────────────────────────────────────────────
function scoreCandidate(
  movie: RecommendationMovie,
  tasteProfile: TasteProfile,
  personNames: Record<number, string> | undefined,
  companyNames: Record<number, string> | undefined
): RecommendationCandidate {
  const confidenceMultiplier = CONFIDENCE_MULTIPLIERS[tasteProfile.confidence];

  const genre = getGenreContribution(
    movie.genreIds,
    tasteProfile.genrePreferences,
    confidenceMultiplier
  );
  const dna = getDnaContribution(
    movie.dnaProfile.signalScores,
    tasteProfile.dnaPreferences,
    confidenceMultiplier
  );
  const explicit = getExplicitContribution(
    movie.castIds,
    movie.directorIds,
    movie.companyIds,
    tasteProfile,
    personNames,
    companyNames,
    confidenceMultiplier
  );
  const inferred = getInferredContribution(
    movie.castIds,
    movie.directorIds,
    movie.companyIds,
    tasteProfile,
    personNames,
    companyNames,
    confidenceMultiplier
  );
  const era = getEraContribution(
    movie.releaseDate,
    tasteProfile.eraPreferences,
    confidenceMultiplier
  );
  const language = getLanguageContribution(
    movie.originalLanguage,
    tasteProfile.languagePreferences,
    confidenceMultiplier
  );
  const runtime = getRuntimeContribution(
    movie.runtime,
    tasteProfile.runtimePreference,
    confidenceMultiplier
  );
  const quality = getQualityContribution(
    movie.voteAverage,
    movie.voteCount,
    movie.popularity
  );

  // Skor/sıralama, önceki davranışla birebir aynı kalsın diye ham
  // (yuvarlanmamış) katkıların toplamından hesaplanır — breakdown alanları
  // (aşağıda) her biri ayrı yuvarlanır, bu yüzden ondalık düzeyde küçük bir
  // fark olabilir ama sıralamayı etkilemez (bkz. görev talimatı: "Score
  // sıralaması değişmemeli").
  const score = round(
    genre.contribution +
      dna.contribution +
      explicit.contribution +
      inferred.contribution +
      era.contribution +
      language.contribution +
      runtime.contribution +
      quality.contribution
  );

  const reasons = [
    ...explicit.reasons,
    ...genre.reasons,
    ...dna.reasons,
    ...inferred.reasons,
    ...era.reasons,
    ...language.reasons,
    ...runtime.reasons,
    ...quality.reasons,
  ]
    .filter((reason) => reason.contribution > 0)
    .sort((a, b) => b.contribution - a.contribution);

  const breakdown: RecommendationScoreBreakdown = {
    genre: round(genre.contribution),
    dna: round(dna.contribution),
    explicit: round(explicit.contribution),
    inferred: round(inferred.contribution),
    context: round(era.contribution + language.contribution + runtime.contribution),
    quality: round(quality.contribution),
  };

  // CiNeA Match'in kanıt sayımı UI'daki (en fazla 2) reason listesine değil,
  // her kategorinin TÜM ham sinyallerine bakar (bkz. görev talimatı bölüm 5).
  const personalSignals: PersonalSignal[] = [
    ...genre.signals,
    ...dna.signals,
    ...explicit.signals,
    ...inferred.signals,
    ...era.signals,
    ...language.signals,
    ...runtime.signals,
  ];

  const positivePersonalSignalCount = personalSignals.filter(
    (signal) => signal.contribution > 0
  ).length;
  const negativePersonalSignalCount = personalSignals.filter(
    (signal) => signal.contribution < 0
  ).length;
  const uniquePersonalReasonTypes = new Set(
    personalSignals
      .filter((signal) => signal.contribution > 0)
      .map((signal) => signal.type)
  ).size;
  const hasExplicitMatch = explicit.contribution > 0;

  const match = calculateCineaMatch({
    breakdown,
    profileConfidence: tasteProfile.confidence,
    positivePersonalSignalCount,
    negativePersonalSignalCount,
    uniquePersonalReasonTypes,
    hasExplicitMatch,
  });

  return {
    movie,
    score,
    qualityConfidence: quality.qualityConfidence,
    reasons,
    breakdown,
    match,
  };
}

// ─── Sıralama + tie-break ────────────────────────────────────────────────
//
// Deterministik tie-break zinciri (bkz. görev talimatı Aşama 8): finalScore
// -> qualityConfidence -> vote_count -> vote_average -> release_date ->
// movie ID. Release date için "daha eski önce" kuralı seçildi — bu proje
// içinde lib/topRatedRanking.ts'in eşit-skor tie-break'iyle AYNI kural
// (tutarlılık için); rastgele/Date.now kullanılmaz.
function getReleaseTimeForTieBreak(releaseDate: string | undefined): number | null {
  if (!releaseDate) {
    return null;
  }

  const time = new Date(releaseDate).getTime();

  return Number.isFinite(time) ? time : null;
}

function compareRecommendationCandidate(
  a: RecommendationCandidate,
  b: RecommendationCandidate
): number {
  if (b.score !== a.score) {
    return b.score - a.score;
  }

  if (b.qualityConfidence !== a.qualityConfidence) {
    return b.qualityConfidence - a.qualityConfidence;
  }

  if (b.movie.voteCount !== a.movie.voteCount) {
    return b.movie.voteCount - a.movie.voteCount;
  }

  if (b.movie.voteAverage !== a.movie.voteAverage) {
    return b.movie.voteAverage - a.movie.voteAverage;
  }

  const aTime = getReleaseTimeForTieBreak(a.movie.releaseDate);
  const bTime = getReleaseTimeForTieBreak(b.movie.releaseDate);

  if (aTime !== null && bTime !== null && aTime !== bTime) {
    return aTime - bTime;
  }

  if (aTime === null && bTime !== null) {
    return 1;
  }

  if (aTime !== null && bTime === null) {
    return -1;
  }

  return a.movie.id - b.movie.id;
}

// ─── Çeşitlilik (ilk N sonuç) ────────────────────────────────────────────
//
// Basit greedy reranking: skor sırasıyla ilerlerken aynı yönetmenden/
// stüdyoden pencere içinde belirlenen sayının üzerine çıkan adaylar
// ertelenir. Ancak skor farkı DIVERSITY_SCORE_GUARD'ı aşıyorsa (güçlü bir
// eşleşme), kısıtı ihlal etse de pencereye alınır — aşırı çeşitlilik
// uğruna çok daha düşük skorlu bir filmi öne çıkarmamak için. Franchise
// tahmini (başlıktan sequel tespiti vb.) KASITLI OLARAK yapılmaz — güvenilir
// veri yok.
// Accessor'lar sayesinde bu fonksiyon RecommendationCandidate'a kilitli
// kalmaz — What to Watch kişiselleştirmesi gibi farklı bir aday tipi de
// (bkz. lib/whatToWatchPersonalization.ts) aynı, test edilmiş algoritmayı
// kırılgan bir alan-adı varsayımına dayanmadan yeniden kullanabilir.
export type DiversitySelectionAccessors<T> = {
  getId: (item: T) => number;
  getScore: (item: T) => number;
  getDirectorIds: (item: T) => number[];
  getCompanyIds: (item: T) => number[];
};

export function applyDiversitySelection<T>(
  sorted: T[],
  windowSize: number,
  accessors: DiversitySelectionAccessors<T>
): T[] {
  const { getId, getScore, getDirectorIds, getCompanyIds } = accessors;

  const selected: T[] = [];
  const selectedIds = new Set<number>();
  const directorCounts = new Map<number, number>();
  const companyCounts = new Map<number, number>();

  function violatesDiversity(candidate: T): boolean {
    const directorOverLimit = getDirectorIds(candidate).some(
      (id) => (directorCounts.get(id) ?? 0) >= MAX_PER_DIRECTOR_IN_WINDOW
    );
    const companyOverLimit = getCompanyIds(candidate).some(
      (id) => (companyCounts.get(id) ?? 0) >= MAX_PER_COMPANY_IN_WINDOW
    );

    return directorOverLimit || companyOverLimit;
  }

  function commit(candidate: T) {
    selected.push(candidate);
    selectedIds.add(getId(candidate));

    for (const id of getDirectorIds(candidate)) {
      directorCounts.set(id, (directorCounts.get(id) ?? 0) + 1);
    }

    for (const id of getCompanyIds(candidate)) {
      companyCounts.set(id, (companyCounts.get(id) ?? 0) + 1);
    }
  }

  function minSelectedScore(): number {
    return selected.length > 0
      ? Math.min(...selected.map((c) => getScore(c)))
      : Number.NEGATIVE_INFINITY;
  }

  // 1. geçiş: yalnızca çeşitlilik kısıtını hiç ihlal etmeyen adaylar.
  for (const candidate of sorted) {
    if (selected.length >= windowSize) {
      break;
    }

    if (!violatesDiversity(candidate)) {
      commit(candidate);
    }
  }

  // 2. geçiş: pencere hâlâ dolmadıysa, kısıtı ihlal etse de skor farkı
  // DIVERSITY_SCORE_GUARD'ı aşan (yani gerçekten güçlü) adaylar korunur.
  if (selected.length < windowSize) {
    for (const candidate of sorted) {
      if (selected.length >= windowSize) {
        break;
      }

      if (selectedIds.has(getId(candidate))) {
        continue;
      }

      if (getScore(candidate) - minSelectedScore() > DIVERSITY_SCORE_GUARD) {
        commit(candidate);
      }
    }
  }

  // 3. geçiş: pencere hâlâ dolmadıysa (yeterli çeşitli/güçlü aday yoksa),
  // son çare olarak kısıt gözetmeksizin kalan en iyi adaylarla doldurulur
  // — pencerenin gereksiz yere eksik kalmasındansa.
  if (selected.length < windowSize) {
    for (const candidate of sorted) {
      if (selected.length >= windowSize) {
        break;
      }

      if (!selectedIds.has(getId(candidate))) {
        commit(candidate);
      }
    }
  }

  const remaining = sorted.filter((c) => !selectedIds.has(getId(c)));

  return [...selected, ...remaining];
}

const recommendationDiversityAccessors: DiversitySelectionAccessors<RecommendationCandidate> = {
  getId: (candidate) => candidate.movie.id,
  getScore: (candidate) => candidate.score,
  getDirectorIds: (candidate) => candidate.movie.directorIds,
  getCompanyIds: (candidate) => candidate.movie.companyIds,
};

// ─── Ana giriş noktası ───────────────────────────────────────────────────
/**
 * Aday filmleri TasteProfile'a göre puanlar, sıralar ve ilk
 * DIVERSITY_WINDOW sonuca kontrollü çeşitlilik uygular. Saf bir
 * fonksiyondur: fetch yapmaz, localStorage okumaz, React'a bağımlı
 * değildir. Aynı girdi her zaman aynı (deterministik) sıralamayı üretir.
 */
export function rankRecommendationCandidates(
  input: RankRecommendationInput
): RecommendationCandidate[] {
  const excludedSet = new Set(input.excludedMovieIds);
  const uniqueCandidatesById = new Map<number, RecommendationMovie>();

  for (const candidate of input.candidates) {
    if (excludedSet.has(candidate.id)) {
      continue;
    }

    if (!uniqueCandidatesById.has(candidate.id)) {
      uniqueCandidatesById.set(candidate.id, candidate);
    }
  }

  const scored = Array.from(uniqueCandidatesById.values()).map((movie) =>
    scoreCandidate(movie, input.tasteProfile, input.personNames, input.companyNames)
  );

  scored.sort(compareRecommendationCandidate);

  return applyDiversitySelection(
    scored,
    DIVERSITY_WINDOW,
    recommendationDiversityAccessors
  );
}
