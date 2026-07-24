// ─── Recommendation Engine v2 — merkezi config ──────────────────────────
//
// Bu dosya, daha önce lib/recommendationEngine.ts, lib/cineaMatch.ts,
// lib/whatToWatchPersonalization.ts, lib/tasteProfile.ts,
// components/hooks/useRecommendations.ts, components/hooks/useTasteProfile.ts
// ve app/api/recommendations/route.ts içine DAĞILMIŞ olan tüm sayısal
// ayarları TEK bir yerde toplar (bkz. görev talimatı "CiNeA Recommendation
// Engine v2" Aşama 1). Hiçbir değer bu taşıma sırasında DEĞİŞTİRİLMEDİ —
// yalnızca konumları değişti; davranış birebir korunur (bkz. teknik
// doküman "Kalibrasyon" bölümü ve final rapor "Gerçek kullanılan
// ağırlıklar" tablosu).
//
// Bu dosyanın kendisi hiçbir recommendation modülünü import ETMEZ (leaf
// dosya) — tüketen dosyalar (recommendationEngine, cineaMatch,
// whatToWatchPersonalization, tasteProfile, useRecommendations,
// useTasteProfile, api/recommendations/route) buradan import eder. Bu
// yön (config -> algoritma, asla tersi değil) döngüsel import'u imkansız
// kılar.
//
// Henüz KODDA olmayan sinyaller (ör. mood/company/discovery ağırlıkları
// What to Watch'ın form-context'i dışında bir "kalıcı tercih" gibi
// kullanılması) burada AKTİF bir alan olarak tanımlanmaz — yalnızca
// docs/recommendation-engine-v2.md'de "future extension" olarak anlatılır.

// ─────────────────────────────────────────────────────────────────────────
// SOURCES — /api/recommendations adayları hangi TMDB discover havuzlarından
// geliyor (bkz. görev talimatı Aşama 3 "Candidate Source Registry").
// Her kaynağın id'si, useRecommendations.ts/route.ts'nin ürettiği
// `sourceIds` provenance alanlarıyla birebir eşleşir.
// ─────────────────────────────────────────────────────────────────────────
export type RecommendationSourceId =
  | "preferredGenreDiscovery"
  | "dnaKeywordDiscovery"
  | "favoriteActorDiscovery"
  | "favoriteDirectorDiscovery"
  | "favoriteCompanyDiscovery"
  | "popularFallback";

export type RecommendationSourceDefinition = {
  id: RecommendationSourceId;
  enabled: boolean;
  // Havuzlar birleştirildikten sonra sıralama/açıklama amaçlı öncelik —
  // düşük sayı = daha güvenilir/öncelikli sinyal. Şu anda havuzları
  // FİLTRELEMEK için kullanılmaz (tüm etkin kaynaklar birleştirilir),
  // yalnızca explain/debug ve gelecekteki ağırlıklandırma için mevcuttur.
  priority: number;
  // TMDB discover/movie parametreleri — mevcut app/api/recommendations
  // route.ts'teki değerlerle birebir aynı (taşıma, değişiklik değil).
  voteCountMin: number;
  voteAverageMin: number;
  // Bu kaynak yalnızca kullanıcının o sinyali gerçekten üretmişse
  // (ör. explicitFavoriteActorIds boş değilse) çalışır — route.ts zaten bu
  // kuralı uyguluyordu, burada yalnızca dokümante ediliyor.
  requiresSignal: boolean;
};

export const RECOMMENDATION_SOURCES: Record<
  RecommendationSourceId,
  RecommendationSourceDefinition
> = {
  preferredGenreDiscovery: {
    id: "preferredGenreDiscovery",
    enabled: true,
    priority: 1,
    voteCountMin: 100,
    voteAverageMin: 5.5,
    requiresSignal: true,
  },
  dnaKeywordDiscovery: {
    id: "dnaKeywordDiscovery",
    enabled: true,
    priority: 2,
    voteCountMin: 50,
    voteAverageMin: 5,
    requiresSignal: true,
  },
  favoriteActorDiscovery: {
    id: "favoriteActorDiscovery",
    enabled: true,
    priority: 3,
    voteCountMin: 30,
    voteAverageMin: 0,
    requiresSignal: true,
  },
  favoriteDirectorDiscovery: {
    id: "favoriteDirectorDiscovery",
    enabled: true,
    priority: 3,
    voteCountMin: 30,
    voteAverageMin: 0,
    requiresSignal: true,
  },
  favoriteCompanyDiscovery: {
    id: "favoriteCompanyDiscovery",
    enabled: true,
    priority: 4,
    voteCountMin: 30,
    voteAverageMin: 0,
    requiresSignal: true,
  },
  // Cold-start/low-confidence taban havuzu — her zaman etkin, hiçbir
  // kullanıcı sinyali gerektirmez.
  popularFallback: {
    id: "popularFallback",
    enabled: true,
    priority: 5,
    voteCountMin: 200,
    voteAverageMin: 6,
    requiresSignal: false,
  },
};

// ─────────────────────────────────────────────────────────────────────────
// WEIGHTS — bir adayın ham skoruna kaç puan ekleyebileceğinin üst sınırları.
// ─────────────────────────────────────────────────────────────────────────
export const RECOMMENDATION_WEIGHT_CAPS = {
  genreMax: 30,
  dnaMax: 30,
  explicitMax: 20,
  inferredMax: 10,
  eraMax: 4,
  languageMax: 3,
  runtimeMax: 3,
  qualityMax: 10,
} as const;

// Explicit favori kategorileri arası göreli ağırlık (yönetmen > oyuncu >
// stüdyo) — toplamları explicitMax'a normalize edilir.
export const EXPLICIT_CATEGORY_WEIGHTS = {
  actor: 1,
  director: 1.3,
  company: 0.8,
} as const;

// Explicit favoriler confidence tarafından asla tamamen ezilmesin diye
// uygulanan taban çarpan (Math.max ile).
export const EXPLICIT_MIN_CONFIDENCE_MULTIPLIER = 0.85;

export const MAX_GENRE_MATCHES_PER_CANDIDATE = 3;
export const MAX_DNA_MATCHES_PER_CANDIDATE = 3;

export const INFERRED_PREFERENCE_CONFIG = {
  // Kaç farklı filmde görülürse "güçlü kanıt" sayılır (3+) — altındakiler
  // düşük ağırlık çarpanı alır.
  strongEvidenceCount: 3,
  lowEvidenceMultiplier: 0.6,
  strongEvidenceMultiplier: 1.0,
  // actor + director + company.
  categoryCount: 3,
} as const;

export const RUNTIME_FIT_CONFIG = {
  // Tercih edilen aralığın bu kadar (dakika) dışına çıkan filmler küçük
  // bir ceza alır; daha yakın olanlar nötr kalır (ne bonus ne ceza).
  farDistanceMinutes: 60,
  farPenalty: 1,
} as const;

// ─────────────────────────────────────────────────────────────────────────
// QUALITY CONFIDENCE — recommendation'ın kalite sinyali artık
// lib/qualityConfidence.ts'teki PAYLAŞILAN Bayesian primitive'i kullanır
// (bkz. görev talimatı Aşama 5 — Top Rated ile aynı formül, ayrı bir kopya
// yazılmadı). lowerAnchor/upperAnchor, ham Bayesian skoru (0-10 ölçeğinde)
// [0,1] "qualityConfidence"e çevirmek için kullanılan SABİT (aday havuzuna
// bağımlı olmayan) referans noktalarıdır — bu sayede recommendation, Top
// Rated'ın aksine kendi candidate pool'unun anlık ortalamasına değil,
// genel/kalıcı bir kalite ölçeğine göre kalibre edilir.
export const RECOMMENDATION_QUALITY_CONFIG = {
  // Bayesian formülündeki "m" — Top Rated ile aynı değer (tutarlılık için).
  confidenceVoteCount: 3000,
  // Bu eşiğin altındaki oy sayısına ek bir güven cezası uygulanır (Top
  // Rated ile aynı mekanizma) — YALNIZCA bu sayede "9.5 puan / 15 oy" gibi
  // adaylar priorMean'e yarı yarıya çekilse bile şişmeden kalır (test
  // matrisi senaryo 8 ile doğrulandı). Aşağıdaki lowVoteCountThreshold/
  // lowVoteAverageThreshold cezası bundan TAMAMEN bağımsızdır — bu ikisi
  // "az oy" ile "düşük puan" farklı koşulları kapsar, çakışmaz.
  minimumVoteCount: 50,
  // Bayesian formülündeki "C" — sabit, aday havuzuna bağımlı olmayan bir
  // önsel ortalama (lowerAnchor/upperAnchor'ın orta noktasına yakın).
  priorMean: 6.8,
  // Bayesian skorun "vasat" kabul edildiği sabit referans (ör. TMDB
  // kataloğunun genel ortalamasına yakın bir değer) — qualityConfidence
  // burada 0'a yakın olur.
  lowerAnchor: 5.5,
  // Bayesian skorun "gerçekten güvenilir yüksek kalite" kabul edildiği
  // sabit üst referans — qualityConfidence burada 1'e yakın olur.
  upperAnchor: 8.5,
  // Eski (v1) davranışla uyumlu, DEĞİŞTİRİLMEMİŞ düşük-kalite cezası:
  // yeterince oylanmış (>= lowVoteCountThreshold) ama düşük puanlı
  // filmlere küçük bir ek ceza. Bilerek Bayesian hesaptan AYRI tutulur —
  // Aşama 6 talimatı bu davranışın "dramatik değişmemesini" istiyor.
  lowVoteCountThreshold: 50,
  lowVoteAverageThreshold: 5,
  lowQualityPenalty: 3,
  // Popularity, sınırlı bir yardımcı sinyaldir — log10 ölçekli, küçük bir
  // tavanla sınırlanır (tek başına bir filmi tepeye taşıyamaz).
  maxPopularityBonus: 3,
} as const;

// ─────────────────────────────────────────────────────────────────────────
// PENALTIES — diğer ceza sinyalleri (CiNeA Match kalibrasyonu dahil).
// ─────────────────────────────────────────────────────────────────────────
export const MATCH_CALIBRATION = {
  // personalContribution -> sigmoid ile [0,1]'e sıkıştırılır, sonra
  // neutralPercentage etrafında +/- amplitude kadar yayılır.
  sigmoidSteepness: 0.035,
  neutralPercentage: 55,
  amplitude: 35,
  qualityContributionScale: 10,
  qualityBonusMax: 6,
  diversityBonusPerExtraType: 1.5,
  diversityBonusMaxExtraTypes: 4,
  diversityBonusMax: 6,
  explicitMatchBonus: 3,
  negativeSignalPenaltyPerSignal: 3,
  negativeSignalPenaltyMax: 15,
  lowConfidencePromisingThreshold: 75,
} as const;

export const MATCH_LIMITS = {
  minPercentage: 0,
  maxPercentage: 100,
  qualityOnlyLowConfidenceMax: 70,
} as const;

// ─────────────────────────────────────────────────────────────────────────
// CONFIDENCE — profil güveni ve cold-start davranışı.
// ─────────────────────────────────────────────────────────────────────────
export type DiscreteProfileConfidence = "low" | "medium" | "high";

// Kişiselleştirme sinyallerinin (genre/dna/inferred/era/dil/süre) genel
// çarpanı — mevcut/DEĞİŞTİRİLMEMİŞ v1.1 kalibrasyonu.
export const CONFIDENCE_MULTIPLIERS: Record<DiscreteProfileConfidence, number> = {
  low: 0.45,
  medium: 0.75,
  high: 1.0,
};

// tasteProfile.ts'teki computeConfidence — YALNIZCA puanlanmış film
// sayısına dayanır (bkz. lib/tasteProfile.ts yorumu: tür çeşitliliği
// kasıtlı olarak dahil edilmez, aksi halde confidence fazla iyimser olur).
export const DISCRETE_CONFIDENCE_THRESHOLDS = {
  maxRatedForLow: 4,
  maxRatedForMedium: 14,
} as const;

// CiNeA Match'in confidence'a göre nihai yüzde aralığı.
export const MATCH_CONFIDENCE_RANGES: Record<
  DiscreteProfileConfidence,
  { min: number; max: number }
> = {
  low: { min: 28, max: 82 },
  medium: { min: 22, max: 92 },
  high: { min: 12, max: 96 },
};

export const WHAT_TO_WATCH_PERSONAL_SCORE_CAPS: Record<
  DiscreteProfileConfidence,
  number
> = {
  low: 8,
  medium: 14,
  high: 20,
};

// ─── Yeni: sürekli (0-1) profil güveni — Aşama 4 ─────────────────────────
//
// Mevcut discrete confidence (low/medium/high) İLE ilişkili weight/range
// tablolarını DEĞİŞTİRMEZ (davranış dramatik değişmesin diye) — yalnızca
// explain/debug ve gelecekteki ince ayar için EK, daha granüler bir sinyal
// sağlar (bkz. lib/recommendationContext.ts calculateProfileConfidence).
export const PROFILE_CONFIDENCE_CONFIG = {
  // Her sinyal türü için "doygunluk" noktası — bu sayıya ulaşınca o
  // sinyalin katkısı ~%86'sına ulaşır (1 - e^-2), sonrası diminishing
  // returns (bkz. calculateProfileConfidence: 1 - e^(-count/saturation)).
  ratedMovieSaturation: 15,
  favoriteSaturation: 6,
  watchStatusSaturation: 10,
  // Sinyal türleri arası göreli ağırlık — toplamı normalize etmek için
  // kullanılır, tek bir sinyal (ör. yalnızca favori sayısı) tüm skoru
  // domine edemez.
  ratedMovieWeight: 0.5,
  favoriteWeight: 0.3,
  watchStatusWeight: 0.2,
  // coldStartTier eşikleri (0-1 profileConfidence üzerinden).
  emptyTierMax: 0.05,
  lightTierMax: 0.45,
} as const;

// ─────────────────────────────────────────────────────────────────────────
// DIVERSITY — final sıralamadan sonraki deterministik rerank.
// ─────────────────────────────────────────────────────────────────────────
export const RECOMMENDATION_DIVERSITY_CONFIG = {
  // İlk kaç sonuca çeşitlilik kısıtı uygulanır.
  window: 12,
  maxPerDirectorInWindow: 2,
  maxPerCompanyInWindow: 3,
  // Kısıtı ihlal eden bir aday, penceredeki en düşük seçilmiş skordan bu
  // kadar (veya fazla) yüksekse yine de korunur ("güçlü eşleşme kuralı").
  scoreGuard: 10,
} as const;

export const WHAT_TO_WATCH_DIVERSITY_CONFIG = {
  window: 12,
  maxConsecutiveSameGenreSignature: 3,
} as const;

// ─────────────────────────────────────────────────────────────────────────
// LIMITS — aday havuzu / fetch / concurrency sınırları.
// ─────────────────────────────────────────────────────────────────────────
export const RECOMMENDATION_LIMITS = {
  // /for-you sonuç sayısı.
  maxResults: 12,
  // TasteProfile -> discover filtrelerine çevrilen en güçlü sinyal sayısı.
  maxGenreFilterIds: 3,
  maxKeywordFilterIds: 3,
  // Aday havuzundan detay çekilecek en fazla film sayısı.
  maxDetailFetchCandidates: 40,
  // useTasteProfile: profil için analiz edilecek en fazla film.
  maxAnalyzedMovies: 50,
  // useMoviesByIds: aynı anda uçan en fazla /api/movies isteği.
  movieFetchConcurrency: 6,
} as const;

// app/api/recommendations/route.ts — TMDB discover havuzu limitleri.
export const RECOMMENDATION_POOL_LIMITS = {
  maxGenreIds: 3,
  maxKeywordIds: 3,
  poolPage: 1,
  maxCandidateIds: 50,
} as const;

// ─────────────────────────────────────────────────────────────────────────
// CACHE — bkz. lib/recommendationContext.ts buildRecommendationFingerprint.
// Bu proje şu an /api/movies ve /api/recommendations için "no-store"
// (her zaman taze) veya URL-anahtarlı Next.js fetch cache'i kullanıyor;
// ayrı bir client-side sonuç önbelleği YOK (bkz. teknik doküman "Cache"
// bölümü). `version` yalnızca gelecekte bir önbellek eklenirse config
// değişikliklerinin eski sonuçları geçersiz kılmasını garanti eder.
// ─────────────────────────────────────────────────────────────────────────
export const RECOMMENDATION_CACHE_CONFIG = {
  version: 1,
} as const;

// ─────────────────────────────────────────────────────────────────────────
// Tek nesne halinde toplu erişim (görev talimatındaki
// RECOMMENDATION_CONFIG = { sources, weights, penalties, confidence,
// diversity, limits, cache } şekline birebir karşılık gelir). Yukarıdaki
// isimlendirilmiş export'lar zaten kullanılan gerçek referanslardır; bu
// nesne yalnızca "tek bakışta tüm config" ihtiyacı için bir görünümdür.
// ─────────────────────────────────────────────────────────────────────────
export const RECOMMENDATION_CONFIG = {
  sources: RECOMMENDATION_SOURCES,
  weights: {
    caps: RECOMMENDATION_WEIGHT_CAPS,
    explicitCategoryWeights: EXPLICIT_CATEGORY_WEIGHTS,
    explicitMinConfidenceMultiplier: EXPLICIT_MIN_CONFIDENCE_MULTIPLIER,
    maxGenreMatches: MAX_GENRE_MATCHES_PER_CANDIDATE,
    maxDnaMatches: MAX_DNA_MATCHES_PER_CANDIDATE,
    inferred: INFERRED_PREFERENCE_CONFIG,
    runtimeFit: RUNTIME_FIT_CONFIG,
    quality: RECOMMENDATION_QUALITY_CONFIG,
  },
  penalties: {
    match: MATCH_CALIBRATION,
    matchLimits: MATCH_LIMITS,
  },
  confidence: {
    multipliers: CONFIDENCE_MULTIPLIERS,
    discreteThresholds: DISCRETE_CONFIDENCE_THRESHOLDS,
    matchRanges: MATCH_CONFIDENCE_RANGES,
    whatToWatchPersonalScoreCaps: WHAT_TO_WATCH_PERSONAL_SCORE_CAPS,
    continuous: PROFILE_CONFIDENCE_CONFIG,
  },
  diversity: {
    recommendation: RECOMMENDATION_DIVERSITY_CONFIG,
    whatToWatch: WHAT_TO_WATCH_DIVERSITY_CONFIG,
  },
  limits: {
    recommendation: RECOMMENDATION_LIMITS,
    pool: RECOMMENDATION_POOL_LIMITS,
  },
  cache: RECOMMENDATION_CACHE_CONFIG,
} as const;
