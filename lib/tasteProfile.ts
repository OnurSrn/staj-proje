import type { WatchStatus } from "@/components/SavedMoviesProvider";
import type {
  FavoriteCompany,
  FavoritePerson,
} from "@/components/PreferenceProvider";
import { MOVIE_DNA_SIGNALS, type MovieDnaProfile } from "@/lib/movieDna";

export type WeightedPreference = {
  id: string;
  label: string;
  score: number;
  evidenceCount: number;
  category?: string;
};

export type PersonPreference = {
  id: number;
  label: string;
  score: number;
  evidenceCount: number;
};

export type TasteProfile = {
  totalRatedMovies: number;
  totalStatusMovies: number;
  confidence: "low" | "medium" | "high";

  genrePreferences: WeightedPreference[];
  dnaPreferences: WeightedPreference[];

  // Kullanıcının Preferences sayfasında AÇIKÇA seçtiği kişiler/stüdyolar.
  explicitFavoriteActorIds: number[];
  explicitFavoriteDirectorIds: number[];
  explicitFavoriteCompanyIds: number[];

  // Puanlama geçmişinden ÇIKARILAN (sistem tahmini) tercihler. Bunlar
  // explicit favoriler ile asla karışmaz — ayrı alanlarda tutulur.
  inferredActorPreferences: PersonPreference[];
  inferredDirectorPreferences: PersonPreference[];
  inferredCompanyPreferences: PersonPreference[];

  runtimePreference: {
    preferredMin: number | null;
    preferredMax: number | null;
    averageRuntime: number | null;
  };

  eraPreferences: WeightedPreference[];
  languagePreferences: WeightedPreference[];
  countryPreferences: WeightedPreference[];

  positiveMovieIds: number[];
  negativeMovieIds: number[];

  generatedAt: string;
};

export type TasteProfileMovie = {
  id: number;
  genreIds: number[];
  runtime: number | null;
  releaseDate: string | null;
  originalLanguage: string | null;
  originCountryCodes: string[];
  castIds: number[];
  directorIds: number[];
  companyIds: number[];
  dnaProfile: MovieDnaProfile;
};

export type TasteProfileInput = {
  ratings: Record<string, number>;
  watchStatuses: Record<string, WatchStatus>;
  movies: TasteProfileMovie[];
  favoritePeople: FavoritePerson[];
  favoriteCompanies: FavoriteCompany[];
  // Movie-seviyesindeki alanlar bilinçli olarak yalnızca sayısal id tutar
  // (TasteProfileMovie saf/minimal kalsın diye). Kullanıcıya gösterilebilir
  // etiketler için bu opsiyonel, düz (flat) sözlükler kullanılır — hook
  // bunları zaten fetch ettiği film verisinden (movie.genres,
  // credits.cast/crew, production_companies) ücretsiz üretir; yeni bir
  // fetch veya rastgele bir mapping gerektirmez.
  genreLabels?: Record<number, string>;
  personNames?: Record<number, string>;
  companyNames?: Record<number, string>;
};

export type BuildTasteProfileOptions = {
  now?: Date;
};

// ─── Puan/durum ağırlık config'i ────────────────────────────────────────
//
// Yalnızca kullanıcının KENDİ puanı ana sinyal kaynağıdır — TMDB puanı bu
// hesaba hiç karışmaz (SavedMoviesProvider zaten yalnızca kullanıcı puanını
// tutuyor). Aralıklar, en yüksekten en düşüğe doğru sırayla kontrol edilir;
// bir puan kendinden büyük en yakın eşiğin ağırlığını alır.
const RATING_WEIGHTS: { min: number; weight: number }[] = [
  { min: 9, weight: 3 }, // 9.0–10.0: çok güçlü pozitif
  { min: 8, weight: 2 }, // 8.0–8.9: güçlü pozitif
  { min: 7, weight: 1 }, // 7.0–7.9: hafif pozitif
  { min: 6, weight: 0 }, // 6.0–6.9: nötr
  { min: 4, weight: -1 }, // 4.0–5.9: hafif negatif
  { min: 1, weight: -2 }, // 1.0–3.9: güçlü negatif
];

export function getRatingWeight(rating: number): number {
  for (const tier of RATING_WEIGHTS) {
    if (rating >= tier.min) {
      return tier.weight;
    }
  }

  return RATING_WEIGHTS[RATING_WEIGHTS.length - 1].weight;
}

// Yalnızca kişisel puan YOKKEN kullanılır — status'un etkisi rating'den
// her zaman daha zayıftır. "plan-to-watch" kasıtlı olarak küçük pozitif:
// bu sadece bir "izlemek istiyorum" ilgi sinyalidir, güçlü bir beğeni
// sinyali değildir; negatif de üretmez.
const WATCH_STATUS_ONLY_WEIGHTS: Record<WatchStatus, number> = {
  watched: 0.5,
  watching: 0.2,
  dropped: -1,
  "plan-to-watch": 0.15,
};

// "dropped" + kişisel puan birlikte varsa: puan ana sinyal kalır, status
// yalnızca küçük bir ek ceza olarak destek verir — iki kez tam ceza
// uygulanmaz (çift sayım önlenir).
const DROPPED_WITH_RATING_SUPPORT_WEIGHT = -0.25;

// Formülün üst/alt sınırı — v1.1 kalibrasyonu: mevcut ağırlık aralığı
// (rating -2..3, dropped desteği -0.25) bu sınırları normalde hiç aşmaz;
// clamp yalnızca gelecekte config değerleri değiştiğinde güvenlik ağı
// olarak duruyor.
const MOVIE_PREFERENCE_WEIGHT_MIN = -2.5;
const MOVIE_PREFERENCE_WEIGHT_MAX = 3;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/**
 * Bir filmin genel "beğeni ağırlığını" hesaplayan TEK yardımcı fonksiyon —
 * rating ve watch status'un etkisi başka hiçbir yerde tekrar hesaplanmaz.
 *
 * Formül:
 * - rating varsa: ratingWeight (RATING_WEIGHTS) + (status === "dropped" ? -0.25 : 0)
 *   → watched/watching/plan-to-watch rating varken HİÇBİR ek puan üretmez;
 *     yalnızca dropped küçük bir ek ceza ekler (iki kez tam ceza uygulanmaz).
 * - rating yoksa: WATCH_STATUS_ONLY_WEIGHTS[status] (watched +0.5, watching
 *   +0.2, dropped -1, plan-to-watch +0.15) — status yoksa 0.
 * - Sonuç [-2.5, 3] aralığına clamp'lenir.
 *
 * Ne rating ne status varsa 0 (nötr, kanıt yok).
 */
export function getMoviePreferenceWeight(
  rating: number | null,
  status: WatchStatus | null
): number {
  if (rating !== null) {
    const ratingWeight = getRatingWeight(rating);
    const droppedSupport =
      status === "dropped" ? DROPPED_WITH_RATING_SUPPORT_WEIGHT : 0;

    return clamp(
      ratingWeight + droppedSupport,
      MOVIE_PREFERENCE_WEIGHT_MIN,
      MOVIE_PREFERENCE_WEIGHT_MAX
    );
  }

  if (status === null) {
    return 0;
  }

  return clamp(
    WATCH_STATUS_ONLY_WEIGHTS[status],
    MOVIE_PREFERENCE_WEIGHT_MIN,
    MOVIE_PREFERENCE_WEIGHT_MAX
  );
}

function hasEvidence(rating: number | null, status: WatchStatus | null): boolean {
  return rating !== null || status !== null;
}

// Cast'in TMDB billing sırasına göre (0-indeksli) ağırlık çarpanı — baş
// rol oyuncuları inferred sinyale tam katkı sağlar, alt sıradaki
// oyuncular daha az. Bu bilgi zaten castIds dizisinin sırasında ücretsiz
// mevcut (yeni bir TMDB isteği gerektirmez).
const CAST_POSITION_WEIGHTS = [
  1, 1, 1, // 1-3: baş roller
  0.75, 0.75, 0.75, // 4-6
  0.5, 0.5, 0.5, 0.5, // 7-10
];
const DEFAULT_CAST_POSITION_WEIGHT = 0.5;

function getCastPositionWeight(index: number): number {
  return CAST_POSITION_WEIGHTS[index] ?? DEFAULT_CAST_POSITION_WEIGHT;
}

// ─── Runtime örnekleme kuralı (v1.1) ────────────────────────────────────
//
// Yalnızca GERÇEK pozitif beğeni sinyali taşıyan filmler örnekleme girer:
// - movieWeight > 0 olmalı (0 veya negatif asla girmez)
// - status "watching" veya "plan-to-watch" ise dışlanır (bunlar zayıf bir
//   ilgi sinyalidir, "bu süreyi sevdim" anlamına gelmez)
// - status "dropped" ise dışlanır (film yarım bırakıldı, süre tercihi için
//   güvenilir kanıt değil)
// - kalan durumlar: rating >= 7 (weight>0 zaten bunu garanti eder) veya
//   rating yokken yalnızca "watched" (weight>0 zaten bunu garanti eder)
// Sonuç: pratikte yalnızca "rating>=7" veya "rating yok + watched" filmleri
// örnekleme girer.
const RUNTIME_MIN_VALID_MINUTES = 30;
const RUNTIME_MAX_VALID_MINUTES = 300;

function isRuntimeEligible(
  status: WatchStatus | null,
  weight: number
): boolean {
  if (weight <= 0) {
    return false;
  }

  if (
    status === "watching" ||
    status === "plan-to-watch" ||
    status === "dropped"
  ) {
    return false;
  }

  return true;
}

function isValidRuntimeValue(runtime: number | null): runtime is number {
  return (
    typeof runtime === "number" &&
    runtime >= RUNTIME_MIN_VALID_MINUTES &&
    runtime <= RUNTIME_MAX_VALID_MINUTES
  );
}

// ─── Sıralama ────────────────────────────────────────────────────────────
//
// score azalan; eşitlikte evidenceCount azalan; onda da eşitlikte label
// alfabetik (tr locale).
function compareWeightedPreference(
  a: WeightedPreference,
  b: WeightedPreference
): number {
  if (b.score !== a.score) {
    return b.score - a.score;
  }

  if (b.evidenceCount !== a.evidenceCount) {
    return b.evidenceCount - a.evidenceCount;
  }

  return a.label.localeCompare(b.label, "tr");
}

function comparePersonPreference(
  a: PersonPreference,
  b: PersonPreference
): number {
  if (b.score !== a.score) {
    return b.score - a.score;
  }

  if (b.evidenceCount !== a.evidenceCount) {
    return b.evidenceCount - a.evidenceCount;
  }

  return a.label.localeCompare(b.label, "tr");
}

// ─── Movie DNA sinyal etiketleri ────────────────────────────────────────
//
// lib/movieDna.ts'teki TEK doğrulanmış sözlükten üretilir; burada yeni bir
// sinyal/etiket icat edilmez.
const DNA_SIGNAL_INFO = new Map(
  MOVIE_DNA_SIGNALS.map((signal) => [
    signal.id,
    { label: signal.label, category: signal.category },
  ])
);

// Bir filmin tek bir DNA sinyaline katkısı bu değerle sınırlanır — çok
// güçlü tek bir eşleşme (ör. 3 çekirdek keyword birden, weight 3 → ham
// skor 9) tüm profili tek başına domine etmesin diye.
const DNA_SIGNAL_SCORE_CAP = 3;

// ─── Dil etiketleri ──────────────────────────────────────────────────────
//
// Küçük, güvenli bir görüntüleme haritası — bilinmeyen kod ham haliyle
// (büyük harfle) kalır, asla crash üretmez.
const LANGUAGE_LABELS: Record<string, string> = {
  en: "İngilizce",
  tr: "Türkçe",
  fr: "Fransızca",
  es: "İspanyolca",
  de: "Almanca",
  it: "İtalyanca",
  ja: "Japonca",
  ko: "Korece",
  zh: "Çince",
  ru: "Rusça",
  pt: "Portekizce",
  hi: "Hintçe",
};

function getLanguageLabel(code: string): string {
  return LANGUAGE_LABELS[code] ?? code.toUpperCase();
}

// ─── Runtime bantları ────────────────────────────────────────────────────
const RUNTIME_BANDS = {
  short: { min: 0, max: 95 },
  medium: { min: 96, max: 125 },
  long: { min: 126, max: Number.POSITIVE_INFINITY },
} as const;

type RuntimeBandName = keyof typeof RUNTIME_BANDS;

function getRuntimeBand(runtime: number): RuntimeBandName {
  if (runtime <= RUNTIME_BANDS.short.max) {
    return "short";
  }

  if (runtime <= RUNTIME_BANDS.medium.max) {
    return "medium";
  }

  return "long";
}

// Bir "tercih" iddiası üretmek için en az bu kadar uygun film gerekir;
// altındaysa preferredMin/Max null döner (az veri varsa kesin ifade yok).
const MIN_MOVIES_FOR_RUNTIME_PREFERENCE = 3;

// ─── Inferred kişi/stüdyo eşikleri ──────────────────────────────────────
//
// Yalnızca yüksek puanlı (rating weight > 0) filmlerden çıkarılır. Tek
// filmde görülen bir oyuncu/yönetmen/stüdyo güçlü bir inferred tercih
// SAYILMAZ — en az 2 farklı film şartı aranır, altındakiler listeye hiç
// girmez (v1 UI'da gürültü göstermemek için).
const MIN_EVIDENCE_FOR_INFERRED_PREFERENCE = 2;

// ─── Confidence eşikleri ────────────────────────────────────────────────
//
// v1.1: confidence YALNIZCA puanlanmış film sayısıyla belirlenir. Tür
// çeşitliliği (veya başka bir "zenginlik" göstergesi) kasıtlı olarak bu
// hesaba karışmaz — v1'de "8 puan + 20 farklı tür" gibi durumlarda
// confidence'ı yanlışlıkla "high"a yükseltiyordu, bu fazla iyimserdi.
// İzleme durumu olan ama puanı olmayan filmler de confidence'ı
// yükseltmez — bunlar yardımcı ilgi sinyalidir, güvenilir beğeni kanıtı
// değildir (bkz. totalRatedMovies parametresi, totalStatusMovies değil).
const CONFIDENCE_MAX_RATED_FOR_LOW = 4;
const CONFIDENCE_MAX_RATED_FOR_MEDIUM = 14;

function computeConfidence(
  totalRatedMovies: number
): TasteProfile["confidence"] {
  if (totalRatedMovies <= CONFIDENCE_MAX_RATED_FOR_LOW) {
    return "low";
  }

  if (totalRatedMovies <= CONFIDENCE_MAX_RATED_FOR_MEDIUM) {
    return "medium";
  }

  return "high";
}

function toWeightedPreferenceList(
  scores: Map<string, number>,
  evidence: Map<string, number>,
  getLabel: (id: string) => string,
  getCategory?: (id: string) => string | undefined
): WeightedPreference[] {
  return Array.from(scores.entries())
    .map(([id, score]) => ({
      id,
      label: getLabel(id),
      score,
      evidenceCount: evidence.get(id) ?? 0,
      category: getCategory?.(id),
    }))
    .sort(compareWeightedPreference);
}

/**
 * Kullanıcının yerel verilerinden (puanlar, izleme durumları, film
 * detayları, Movie DNA profilleri, favori kişi/stüdyolar) tip güvenli ve
 * açıklanabilir bir zevk profili üretir. Saf bir fonksiyondur: hiçbir
 * fetch içermez, aynı girdi için her zaman aynı çıktıyı üretir (generatedAt
 * hariç — bu da options.now ile test edilebilir şekilde enjekte edilebilir).
 */
export function buildTasteProfile(
  input: TasteProfileInput,
  options: BuildTasteProfileOptions = {}
): TasteProfile {
  const now = options.now ?? new Date();

  const genreScores = new Map<string, number>();
  const genreEvidence = new Map<string, number>();

  const dnaScores = new Map<string, number>();
  const dnaEvidence = new Map<string, number>();

  const eraScores = new Map<string, number>();
  const eraEvidence = new Map<string, number>();

  const languageScores = new Map<string, number>();
  const languageEvidence = new Map<string, number>();

  const countryScores = new Map<string, number>();
  const countryEvidence = new Map<string, number>();

  const actorScores = new Map<number, number>();
  const actorEvidence = new Map<number, number>();

  const directorScores = new Map<number, number>();
  const directorEvidence = new Map<number, number>();

  const companyScores = new Map<number, number>();
  const companyEvidence = new Map<number, number>();

  const positiveMovieIds: number[] = [];
  const negativeMovieIds: number[] = [];

  let totalRatedMovies = 0;
  let totalStatusMovies = 0;

  const runtimeEligibleValues: number[] = [];
  const runtimeEligibleBands = new Map<RuntimeBandName, number>();

  for (const movie of input.movies) {
    const rating = input.ratings[String(movie.id)] ?? null;
    const status = input.watchStatuses[String(movie.id)] ?? null;

    if (rating !== null) {
      totalRatedMovies += 1;
    }

    if (status !== null) {
      totalStatusMovies += 1;
    }

    if (!hasEvidence(rating, status)) {
      continue;
    }

    const weight = getMoviePreferenceWeight(rating, status);

    if (weight > 0) {
      positiveMovieIds.push(movie.id);
    } else if (weight < 0) {
      negativeMovieIds.push(movie.id);
    }

    // Tür profili — aynı filmin aynı türe yalnızca bir kez katkısı olsun
    // diye genreIds zaten TMDB'de tekil, ama Set ile garanti altına alınır.
    for (const genreId of new Set(movie.genreIds)) {
      const key = String(genreId);

      genreScores.set(key, (genreScores.get(key) ?? 0) + weight);
      genreEvidence.set(key, (genreEvidence.get(key) ?? 0) + 1);
    }

    // Movie DNA profili — formül: min(ham_sinyal_skoru, CAP) * film_ağırlığı.
    // Ham skor (movieDna.ts'ten) zaten pozitif (keyword eşleşme sayısı ×
    // sinyal ağırlığı); burada CAP ile üst sınırlanıp filmin kullanıcı
    // ağırlığıyla (rating/status kaynaklı, +/- işaretli) çarpılır. Böylece
    // hem "bu film bu sinyali ne kadar güçlü taşıyor" hem "kullanıcı bu
    // filmi ne kadar sevdi/sevmedi" tek bir sayıda birleşir.
    for (const [signalId, rawScore] of Object.entries(
      movie.dnaProfile.signalScores
    )) {
      const cappedScore = Math.min(rawScore, DNA_SIGNAL_SCORE_CAP);

      dnaScores.set(
        signalId,
        (dnaScores.get(signalId) ?? 0) + cappedScore * weight
      );
      dnaEvidence.set(signalId, (dnaEvidence.get(signalId) ?? 0) + 1);
    }

    // Dönem/dil/ülke — v1.1: weight === 0 (nötr puan) ne katkı ne evidence
    // üretir. Sıfır ağırlık "kanıt yok" kabul edilir (genre/DNA'dan farklı
    // olarak burada nötr bir puanın "gördüm ama etkilemedi" izini bile
    // bırakmaması tercih edildi — bkz. görev talimatı).
    if (weight !== 0) {
      // Dönem (era) — geçersiz/eksik release date sessizce atlanır.
      const year = movie.releaseDate
        ? Number(movie.releaseDate.slice(0, 4))
        : NaN;

      if (Number.isInteger(year) && year > 0) {
        const decadeLabel = `${Math.floor(year / 10) * 10}s`;

        eraScores.set(decadeLabel, (eraScores.get(decadeLabel) ?? 0) + weight);
        eraEvidence.set(decadeLabel, (eraEvidence.get(decadeLabel) ?? 0) + 1);
      }

      // Dil.
      if (movie.originalLanguage) {
        const languageKey = movie.originalLanguage;

        languageScores.set(
          languageKey,
          (languageScores.get(languageKey) ?? 0) + weight
        );
        languageEvidence.set(
          languageKey,
          (languageEvidence.get(languageKey) ?? 0) + 1
        );
      }

      // Ülke — birden fazla ülke varsa ağırlık bölünür (aynı film her
      // ülkeye tam güç vermez, toplam şişmez); evidence yine de film
      // başına 1'dir.
      if (movie.originCountryCodes.length > 0) {
        const perCountryWeight = weight / movie.originCountryCodes.length;

        for (const countryCode of new Set(movie.originCountryCodes)) {
          countryScores.set(
            countryCode,
            (countryScores.get(countryCode) ?? 0) + perCountryWeight
          );
          countryEvidence.set(
            countryCode,
            (countryEvidence.get(countryCode) ?? 0) + 1
          );
        }
      }
    }

    // Runtime — bkz. isRuntimeEligible/isValidRuntimeValue yorumları:
    // yalnızca gerçek pozitif beğeni (weight>0), watching/plan-to-watch/
    // dropped hariç, ve 30-300 dk aralığında geçerli bir süre.
    if (
      isRuntimeEligible(status, weight) &&
      isValidRuntimeValue(movie.runtime)
    ) {
      runtimeEligibleValues.push(movie.runtime);

      const band = getRuntimeBand(movie.runtime);

      runtimeEligibleBands.set(band, (runtimeEligibleBands.get(band) ?? 0) + 1);
    }

    // Inferred oyuncu/yönetmen/stüdyo — yalnızca movieWeight > 0 olan
    // filmlerden (aynı, tek kaynaktan hesaplanan `weight` — dropped
    // desteği dahil, ayrı bir hesap tekrarlanmaz). Favori (explicit)
    // listesiyle burada hiçbir etkileşim yok; tamamen bağımsız iki sinyal
    // kaynağı.
    if (weight > 0) {
      // Cast: TMDB billing sırasına göre kontrollü ağırlık (bkz.
      // getCastPositionWeight) — aynı oyuncu filmde bir kez sayılır.
      const seenActorIds = new Set<number>();

      movie.castIds.forEach((actorId, index) => {
        if (seenActorIds.has(actorId)) {
          return;
        }

        seenActorIds.add(actorId);

        const contribution = weight * getCastPositionWeight(index);

        actorScores.set(actorId, (actorScores.get(actorId) ?? 0) + contribution);
        actorEvidence.set(actorId, (actorEvidence.get(actorId) ?? 0) + 1);
      });

      for (const directorId of new Set(movie.directorIds)) {
        directorScores.set(
          directorId,
          (directorScores.get(directorId) ?? 0) + weight
        );
        directorEvidence.set(
          directorId,
          (directorEvidence.get(directorId) ?? 0) + 1
        );
      }

      for (const companyId of new Set(movie.companyIds)) {
        companyScores.set(
          companyId,
          (companyScores.get(companyId) ?? 0) + weight
        );
        companyEvidence.set(
          companyId,
          (companyEvidence.get(companyId) ?? 0) + 1
        );
      }
    }
  }

  const genreLabels = input.genreLabels ?? {};
  const personNames = input.personNames ?? {};
  const companyNames = input.companyNames ?? {};

  const genrePreferences = toWeightedPreferenceList(
    genreScores,
    genreEvidence,
    (id) => genreLabels[Number(id)] ?? id
  );

  const dnaPreferences = toWeightedPreferenceList(
    dnaScores,
    dnaEvidence,
    (id) => DNA_SIGNAL_INFO.get(id)?.label ?? id,
    (id) => DNA_SIGNAL_INFO.get(id)?.category
  );

  const eraPreferences = toWeightedPreferenceList(
    eraScores,
    eraEvidence,
    (id) => id
  );

  const languagePreferences = toWeightedPreferenceList(
    languageScores,
    languageEvidence,
    (id) => getLanguageLabel(id)
  );

  const countryPreferences = toWeightedPreferenceList(
    countryScores,
    countryEvidence,
    (id) => id
  );

  function toPersonPreferenceList(
    scores: Map<number, number>,
    evidence: Map<number, number>,
    getLabel: (id: number) => string
  ): PersonPreference[] {
    return Array.from(scores.entries())
      .map(([id, score]) => ({
        id,
        label: getLabel(id),
        score,
        evidenceCount: evidence.get(id) ?? 0,
      }))
      .filter(
        (preference) =>
          preference.evidenceCount >= MIN_EVIDENCE_FOR_INFERRED_PREFERENCE
      )
      .sort(comparePersonPreference);
  }

  const inferredActorPreferences = toPersonPreferenceList(
    actorScores,
    actorEvidence,
    (id) => personNames[id] ?? `Kişi #${id}`
  );

  const inferredDirectorPreferences = toPersonPreferenceList(
    directorScores,
    directorEvidence,
    (id) => personNames[id] ?? `Kişi #${id}`
  );

  const inferredCompanyPreferences = toPersonPreferenceList(
    companyScores,
    companyEvidence,
    (id) => companyNames[id] ?? `Stüdyo #${id}`
  );

  const explicitFavoriteActorIds = input.favoritePeople
    .filter((person) => person.role === "actor")
    .map((person) => person.id);

  const explicitFavoriteDirectorIds = input.favoritePeople
    .filter((person) => person.role === "director")
    .map((person) => person.id);

  const explicitFavoriteCompanyIds = input.favoriteCompanies.map(
    (company) => company.id
  );

  // v1.1: averageRuntime da preferredMin/Max ile aynı minimum kanıt
  // eşiğini (3 film) bekler — az veriyle kesin bir ortalama iddia
  // edilmez.
  const averageRuntime =
    runtimeEligibleValues.length >= MIN_MOVIES_FOR_RUNTIME_PREFERENCE
      ? Math.round(
          runtimeEligibleValues.reduce((sum, value) => sum + value, 0) /
            runtimeEligibleValues.length
        )
      : null;

  let preferredMin: number | null = null;
  let preferredMax: number | null = null;

  if (runtimeEligibleValues.length >= MIN_MOVIES_FOR_RUNTIME_PREFERENCE) {
    let dominantBand: RuntimeBandName | null = null;
    let dominantCount = 0;

    for (const [band, count] of runtimeEligibleBands.entries()) {
      if (count > dominantCount) {
        dominantBand = band;
        dominantCount = count;
      }
    }

    if (dominantBand) {
      preferredMin = RUNTIME_BANDS[dominantBand].min;
      preferredMax = Number.isFinite(RUNTIME_BANDS[dominantBand].max)
        ? RUNTIME_BANDS[dominantBand].max
        : null;
    }
  }

  const confidence = computeConfidence(totalRatedMovies);

  return {
    totalRatedMovies,
    totalStatusMovies,
    confidence,

    genrePreferences,
    dnaPreferences,

    explicitFavoriteActorIds,
    explicitFavoriteDirectorIds,
    explicitFavoriteCompanyIds,

    inferredActorPreferences,
    inferredDirectorPreferences,
    inferredCompanyPreferences,

    runtimePreference: {
      preferredMin,
      preferredMax,
      averageRuntime,
    },

    eraPreferences,
    languagePreferences,
    countryPreferences,

    positiveMovieIds,
    negativeMovieIds,

    generatedAt: now.toISOString(),
  };
}
