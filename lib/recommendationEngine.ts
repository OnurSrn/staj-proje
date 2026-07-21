import type { MovieDnaProfile } from "@/lib/movieDna";
import type { PersonPreference, TasteProfile } from "@/lib/tasteProfile";

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
};

export type RecommendationCandidate = {
  movie: RecommendationMovie;
  score: number;
  reasons: RecommendationReason[];
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

export const RECOMMENDATION_WEIGHTS = {
  genreMax: 30,
  dnaMax: 30,
  explicitMax: 20,
  inferredMax: 10,
  eraMax: 4,
  languageMax: 3,
  runtimeMax: 3,
  qualityMax: 10,
};

export const CONFIDENCE_MULTIPLIERS: Record<TasteProfile["confidence"], number> = {
  low: 0.45,
  medium: 0.75,
  high: 1.0,
};

// Explicit favoriler confidence tarafından asla tamamen ezilmesin — low
// confidence'ta bile en az bu çarpanla uygulanır (Math.max ile).
const EXPLICIT_MIN_MULTIPLIER = 0.85;

export const QUALITY_THRESHOLDS = {
  minVoteCountForBonus: 500,
  minVoteAverageForBonus: 7,
  bonusAmount: 5,
  // Bu eşiğin altında oy sayısı olan filmlere ceza uygulanmaz — "yeni/az
  // oylanmış filmleri tamamen yok etme" kuralı.
  lowVoteCountThreshold: 50,
  lowVoteAverageThreshold: 5,
  penaltyAmount: 3,
  maxPopularityBonus: 3,
};

const MAX_GENRE_MATCHES = 3;
const MAX_DNA_MATCHES = 3;

const EXPLICIT_ACTOR_WEIGHT = 1;
const EXPLICIT_DIRECTOR_WEIGHT = 1.3;
const EXPLICIT_COMPANY_WEIGHT = 0.8;
const EXPLICIT_MAX_RAW = EXPLICIT_ACTOR_WEIGHT + EXPLICIT_DIRECTOR_WEIGHT + EXPLICIT_COMPANY_WEIGHT;

const INFERRED_STRONG_EVIDENCE_COUNT = 3;
const INFERRED_LOW_EVIDENCE_MULTIPLIER = 0.6;
const INFERRED_STRONG_EVIDENCE_MULTIPLIER = 1.0;
const INFERRED_CATEGORY_COUNT = 3; // actor + director + company

const FAR_RUNTIME_DISTANCE_MINUTES = 60;
const FAR_RUNTIME_PENALTY = 1;

// Çeşitlilik penceresi (ilk N sonuç) ve kısıtları.
const DIVERSITY_WINDOW = 12;
const MAX_PER_DIRECTOR_IN_WINDOW = 2;
const MAX_PER_COMPANY_IN_WINDOW = 3;
// Bir aday çeşitlilik kısıtını ihlal etse de, penceredeki en düşük skorlu
// seçilmiş adaydan bu kadar (veya daha fazla) yüksek puanlıysa yine de
// korunur — "score farkı büyükse güçlü eşleşme korunmalı" kuralı.
const DIVERSITY_SCORE_GUARD = 10;

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
): { contribution: number; reasons: RecommendationReason[] } {
  if (genrePreferences.length === 0) {
    return { contribution: 0, reasons: [] };
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
    return { contribution: 0, reasons: [] };
  }

  const maxAbsScore = Math.max(
    ...genrePreferences.map((g) => Math.abs(g.score)),
    1
  );
  const perMatchCap = RECOMMENDATION_WEIGHTS.genreMax / MAX_GENRE_MATCHES;

  let total = 0;
  const reasons: RecommendationReason[] = [];

  for (const match of matches) {
    const normalized = match.score / maxAbsScore;
    const contribution = normalized * perMatchCap * confidenceMultiplier;

    total += contribution;

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
): { contribution: number; reasons: RecommendationReason[] } {
  if (dnaPreferences.length === 0) {
    return { contribution: 0, reasons: [] };
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
    return { contribution: 0, reasons: [] };
  }

  const maxAbsScore = Math.max(
    ...dnaPreferences.map((d) => Math.abs(d.score)),
    1
  );
  const perMatchCap = RECOMMENDATION_WEIGHTS.dnaMax / MAX_DNA_MATCHES;

  let total = 0;
  const reasons: RecommendationReason[] = [];

  for (const match of matches) {
    const normalized = match.score / maxAbsScore;
    const contribution = normalized * perMatchCap * confidenceMultiplier;

    total += contribution;

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
): { contribution: number; reasons: RecommendationReason[] } {
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
    return { contribution: 0, reasons: [] };
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

  return { contribution, reasons };
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
): { contribution: number; reasons: RecommendationReason[] } {
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
    return { contribution: 0, reasons: [] };
  }

  const perMatchCap = RECOMMENDATION_WEIGHTS.inferredMax / INFERRED_CATEGORY_COUNT;
  let total = 0;
  const reasons: RecommendationReason[] = [];

  for (const match of matches) {
    const evidenceMultiplier = getInferredEvidenceMultiplier(match.pref.evidenceCount);
    const contribution = perMatchCap * evidenceMultiplier * confidenceMultiplier;

    total += contribution;

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
  };
}

// ─── Era / dil / süre ────────────────────────────────────────────────────
function getEraContribution(
  releaseDate: string,
  eraPreferences: TasteProfile["eraPreferences"],
  confidenceMultiplier: number
): { contribution: number; reasons: RecommendationReason[] } {
  const year = releaseDate ? Number(releaseDate.slice(0, 4)) : NaN;

  if (!Number.isInteger(year) || year <= 0) {
    return { contribution: 0, reasons: [] };
  }

  const decadeLabel = `${Math.floor(year / 10) * 10}s`;
  const match = eraPreferences.find((era) => era.id === decadeLabel);

  if (!match || match.score === 0) {
    return { contribution: 0, reasons: [] };
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

  return { contribution, reasons };
}

function getLanguageContribution(
  originalLanguage: string,
  languagePreferences: TasteProfile["languagePreferences"],
  confidenceMultiplier: number
): { contribution: number; reasons: RecommendationReason[] } {
  if (!originalLanguage) {
    return { contribution: 0, reasons: [] };
  }

  const match = languagePreferences.find((lang) => lang.id === originalLanguage);

  if (!match || match.score === 0) {
    return { contribution: 0, reasons: [] };
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

  return { contribution, reasons };
}

function getRuntimeContribution(
  runtime: number | null,
  runtimePreference: TasteProfile["runtimePreference"],
  confidenceMultiplier: number
): { contribution: number; reasons: RecommendationReason[] } {
  const { preferredMin, preferredMax } = runtimePreference;

  if (runtime === null || preferredMin === null) {
    return { contribution: 0, reasons: [] };
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
    };
  }

  const distance =
    preferredMax !== null
      ? Math.max(0, runtime - preferredMax, preferredMin - runtime)
      : Math.max(0, preferredMin - runtime);

  if (distance > FAR_RUNTIME_DISTANCE_MINUTES) {
    return {
      contribution: -FAR_RUNTIME_PENALTY * confidenceMultiplier,
      reasons: [],
    };
  }

  return { contribution: 0, reasons: [] };
}

// ─── Kalite/discovery dengesi ────────────────────────────────────────────
//
// TMDB puanı burada KİŞİSEL zevk olarak değil, yalnızca aday
// kalitesi/sıralama güvenliği için kullanılır (bkz. görev kısıtı). Az
// oylanmış filmler cezalandırılmaz, yalnızca bonus almaz.
function getQualityContribution(
  voteAverage: number,
  voteCount: number,
  popularity: number
): { contribution: number; reasons: RecommendationReason[] } {
  let contribution = 0;

  if (
    voteCount >= QUALITY_THRESHOLDS.minVoteCountForBonus &&
    voteAverage >= QUALITY_THRESHOLDS.minVoteAverageForBonus
  ) {
    contribution += QUALITY_THRESHOLDS.bonusAmount;
  }

  if (
    voteCount >= QUALITY_THRESHOLDS.lowVoteCountThreshold &&
    voteAverage > 0 &&
    voteAverage < QUALITY_THRESHOLDS.lowVoteAverageThreshold
  ) {
    contribution -= QUALITY_THRESHOLDS.penaltyAmount;
  }

  const popularityBonus = Math.min(
    QUALITY_THRESHOLDS.maxPopularityBonus,
    Math.log10(Math.max(1, popularity))
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

  return { contribution, reasons };
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

  return { movie, score, reasons };
}

// ─── Sıralama + tie-break ────────────────────────────────────────────────
function compareRecommendationCandidate(
  a: RecommendationCandidate,
  b: RecommendationCandidate
): number {
  if (b.score !== a.score) {
    return b.score - a.score;
  }

  if (b.movie.voteCount !== a.movie.voteCount) {
    return b.movie.voteCount - a.movie.voteCount;
  }

  if (b.movie.voteAverage !== a.movie.voteAverage) {
    return b.movie.voteAverage - a.movie.voteAverage;
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
function applyDiversitySelection(
  sorted: RecommendationCandidate[],
  windowSize: number
): RecommendationCandidate[] {
  const selected: RecommendationCandidate[] = [];
  const selectedIds = new Set<number>();
  const directorCounts = new Map<number, number>();
  const companyCounts = new Map<number, number>();

  function violatesDiversity(candidate: RecommendationCandidate): boolean {
    const directorOverLimit = candidate.movie.directorIds.some(
      (id) => (directorCounts.get(id) ?? 0) >= MAX_PER_DIRECTOR_IN_WINDOW
    );
    const companyOverLimit = candidate.movie.companyIds.some(
      (id) => (companyCounts.get(id) ?? 0) >= MAX_PER_COMPANY_IN_WINDOW
    );

    return directorOverLimit || companyOverLimit;
  }

  function commit(candidate: RecommendationCandidate) {
    selected.push(candidate);
    selectedIds.add(candidate.movie.id);

    for (const id of candidate.movie.directorIds) {
      directorCounts.set(id, (directorCounts.get(id) ?? 0) + 1);
    }

    for (const id of candidate.movie.companyIds) {
      companyCounts.set(id, (companyCounts.get(id) ?? 0) + 1);
    }
  }

  function minSelectedScore(): number {
    return selected.length > 0
      ? Math.min(...selected.map((c) => c.score))
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

      if (selectedIds.has(candidate.movie.id)) {
        continue;
      }

      if (candidate.score - minSelectedScore() > DIVERSITY_SCORE_GUARD) {
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

      if (!selectedIds.has(candidate.movie.id)) {
        commit(candidate);
      }
    }
  }

  const remaining = sorted.filter((c) => !selectedIds.has(c.movie.id));

  return [...selected, ...remaining];
}

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

  return applyDiversitySelection(scored, DIVERSITY_WINDOW);
}
