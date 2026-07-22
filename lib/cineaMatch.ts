import type { TasteProfile } from "@/lib/tasteProfile";

// ─── Model ───────────────────────────────────────────────────────────────
//
// CiNeA Match; TMDB puanı ya da genel kalite puanı DEĞİLDİR — yalnızca
// Recommendation Engine v1 skorunun, kullanıcının yerel zevk profiliyle
// tahmini uyumunu ifade eden, kalibre edilmiş bir yüzdedir.

export type MatchConfidence = TasteProfile["confidence"];

export type CineaMatch = {
  percentage: number;
  confidence: MatchConfidence;
  label: string;
  explanation: string;
};

export type RecommendationScoreBreakdown = {
  genre: number;
  dna: number;
  explicit: number;
  inferred: number;
  // era + dil + süre tercihlerinin birleşik katkısı.
  context: number;
  quality: number;
};

export type CalculateCineaMatchInput = {
  breakdown: RecommendationScoreBreakdown;
  profileConfidence: MatchConfidence;
  positivePersonalSignalCount: number;
  negativePersonalSignalCount: number;
  uniquePersonalReasonTypes: number;
  hasExplicitMatch: boolean;
};

// ─── Kalibrasyon config'i ────────────────────────────────────────────────
//
// Tüm magic number'lar burada toplanır. Hiçbiri random/Date.now
// kullanmaz — calculateCineaMatch tamamen deterministiktir.
export const MATCH_CALIBRATION = {
  // personalContribution -> sigmoid ile [0,1]'e sıkıştırılır, sonra
  // neutralPercentage etrafında +/- amplitude kadar yayılır. steepness
  // küçük tutulur ki tek bir güçlü negatif/pozitif sinyal sonucu
  // tamamen çökertmesin/domine etmesin.
  sigmoidSteepness: 0.035,
  neutralPercentage: 55,
  amplitude: 35,

  // Quality katkısı (RECOMMENDATION_WEIGHTS.qualityMax ile aynı ölçekte,
  // yaklaşık -10..10) küçük, sınırlı bir bonus/penaltıya çevrilir —
  // tek başına yüksek match üretemez.
  qualityContributionScale: 10,
  qualityBonusMax: 6,

  // Kanıt çeşitliliği: yalnızca pozitif kişisel sinyal TÜRÜ sayısı 1'den
  // fazla olduğunda uygulanır (3 aynı türde genre eşleşmesi ile
  // genre+dna+director arasındaki fark burada ortaya çıkar).
  diversityBonusPerExtraType: 1.5,
  diversityBonusMaxExtraTypes: 4,
  diversityBonusMax: 6,

  // Explicit (kullanıcının açıkça seçtiği) favori eşleşmesi zaten
  // breakdown.explicit içinde büyük bir katkı üretir; burada küçük bir
  // ek "güven" nüansı eklenir.
  explicitMatchBonus: 3,

  // Negatif kişisel sinyaller görünür şekilde cezalandırılır — breakdown
  // içindeki negatif katkı zaten sigmoid'e yansımıştır, bu ek bir
  // "fark edilebilirlik" cezasıdır.
  negativeSignalPenaltyPerSignal: 3,
  negativeSignalPenaltyMax: 15,

  // Low confidence'ta "Umut Veren Eşleşme" etiketi için eşik.
  lowConfidencePromisingThreshold: 75,
} as const;

// Confidence seviyesine göre nihai yüzde aralığı — low %90+ asla, medium
// ~%92 tavan, high ~%96 tavan üretir.
export const MATCH_CONFIDENCE_RANGES: Record<
  MatchConfidence,
  { min: number; max: number }
> = {
  low: { min: 28, max: 82 },
  medium: { min: 22, max: 92 },
  high: { min: 12, max: 96 },
};

export const MATCH_LIMITS = {
  minPercentage: 0,
  maxPercentage: 100,
  // Yalnızca quality/discovery sinyaliyle (hiç kişisel kanıt yokken) low
  // confidence'ta bu tavanın üstüne çıkılamaz.
  qualityOnlyLowConfidenceMax: 70,
} as const;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function sigmoid(x: number): number {
  return 1 / (1 + Math.exp(-x));
}

// ─── Yüzde hesaplama ─────────────────────────────────────────────────────
/**
 * Saf fonksiyon: recommendationEngine'in ürettiği breakdown + kanıt
 * sayaçlarından açıklanabilir bir CiNeA Match yüzdesi üretir. Fetch
 * yapmaz, React'a bağımlı değildir, random/Date.now kullanmaz — aynı
 * girdi her zaman aynı çıktıyı üretir.
 */
export function calculateCineaMatch(
  input: CalculateCineaMatchInput
): CineaMatch {
  const {
    breakdown,
    profileConfidence,
    positivePersonalSignalCount,
    negativePersonalSignalCount,
    uniquePersonalReasonTypes,
    hasExplicitMatch,
  } = input;

  const personalContribution =
    breakdown.genre +
    breakdown.dna +
    breakdown.explicit +
    breakdown.inferred +
    breakdown.context;

  // 1. Kişisel katkı, nötr bir merkez (neutralPercentage) etrafında
  // sigmoid ile sıkıştırılıp yayılır — ham skor doğrudan yüzde yapılmaz.
  const sigmoidValue = sigmoid(
    personalContribution * MATCH_CALIBRATION.sigmoidSteepness
  );
  let percentage =
    MATCH_CALIBRATION.neutralPercentage +
    (sigmoidValue - 0.5) * 2 * MATCH_CALIBRATION.amplitude;

  // 2. Quality'den küçük, sınırlı bir bonus/penaltı.
  const qualityFactor = clamp(
    breakdown.quality / MATCH_CALIBRATION.qualityContributionScale,
    -1,
    1
  );
  percentage += qualityFactor * MATCH_CALIBRATION.qualityBonusMax;

  // 3. Kanıt çeşitliliği bonusu — yalnızca gerçekten farklı türde pozitif
  // kişisel kanıt varsa (3 genre != genre+dna+director).
  if (personalContribution > 0 && uniquePersonalReasonTypes > 1) {
    const extraTypes = Math.min(
      uniquePersonalReasonTypes - 1,
      MATCH_CALIBRATION.diversityBonusMaxExtraTypes
    );

    percentage += Math.min(
      extraTypes * MATCH_CALIBRATION.diversityBonusPerExtraType,
      MATCH_CALIBRATION.diversityBonusMax
    );
  }

  // 4. Explicit favori nüansı.
  if (hasExplicitMatch) {
    percentage += MATCH_CALIBRATION.explicitMatchBonus;
  }

  // 5. Negatif sinyal cezası — görünür ve sınırlı.
  if (negativePersonalSignalCount > 0) {
    percentage -= Math.min(
      negativePersonalSignalCount *
        MATCH_CALIBRATION.negativeSignalPenaltyPerSignal,
      MATCH_CALIBRATION.negativeSignalPenaltyMax
    );
  }

  // 6. Confidence'a göre min/max aralık.
  const range = MATCH_CONFIDENCE_RANGES[profileConfidence];
  percentage = clamp(percentage, range.min, range.max);

  // 7. Hiç kişisel kanıt yokken (yalnızca quality/discovery) low
  // confidence'ta ek bir tavan.
  if (positivePersonalSignalCount === 0 && profileConfidence === "low") {
    percentage = Math.min(percentage, MATCH_LIMITS.qualityOnlyLowConfidenceMax);
  }

  const finalPercentage = Math.round(
    clamp(percentage, MATCH_LIMITS.minPercentage, MATCH_LIMITS.maxPercentage)
  );

  return {
    percentage: finalPercentage,
    confidence: profileConfidence,
    label: getCineaMatchLabel(finalPercentage, profileConfidence),
    explanation: getCineaMatchExplanation({
      positivePersonalSignalCount,
      negativePersonalSignalCount,
      uniquePersonalReasonTypes,
      hasExplicitMatch,
      profileConfidence,
      personalContribution,
    }),
  };
}

// ─── Label ────────────────────────────────────────────────────────────────
/**
 * Saf label fonksiyonu. Low confidence'ta standart 5 kademeli
 * etiketleme yerine daha temkinli, iki durumlu bir dil kullanılır —
 * "kesin seversin" gibi iddialı ifadeler hiç kullanılmaz.
 */
function getCineaMatchLabel(
  percentage: number,
  confidence: MatchConfidence
): string {
  if (confidence === "low") {
    return percentage >= MATCH_CALIBRATION.lowConfidencePromisingThreshold
      ? "Umut Veren Eşleşme"
      : "Keşif Önerisi";
  }

  if (percentage >= 90) {
    return "Çok Güçlü Eşleşme";
  }

  if (percentage >= 80) {
    return "Güçlü Eşleşme";
  }

  if (percentage >= 70) {
    return "İyi Eşleşme";
  }

  if (percentage >= 60) {
    return "Orta Eşleşme";
  }

  return "Keşif Önerisi";
}

// ─── Explanation ──────────────────────────────────────────────────────────
type ExplanationInput = {
  positivePersonalSignalCount: number;
  negativePersonalSignalCount: number;
  uniquePersonalReasonTypes: number;
  hasExplicitMatch: boolean;
  profileConfidence: MatchConfidence;
  personalContribution: number;
};

/**
 * Template tabanlı, tek kısa açıklama üretir. AI/LLM kullanmaz, teknik
 * score/weight anlatmaz, isimsiz inferred ID göstermez — çünkü hiçbir
 * zaman ham reason/label verisine erişmez.
 */
function getCineaMatchExplanation(input: ExplanationInput): string {
  const {
    positivePersonalSignalCount,
    negativePersonalSignalCount,
    uniquePersonalReasonTypes,
    hasExplicitMatch,
    profileConfidence,
    personalContribution,
  } = input;

  if (positivePersonalSignalCount === 0) {
    return profileConfidence === "low"
      ? "Profil verin henüz sınırlı; sonuç daha çok keşif ve kalite sinyallerine dayanıyor."
      : "Bu film daha çok yeni bir keşif olarak öneriliyor.";
  }

  if (negativePersonalSignalCount > 0 && personalContribution <= 0) {
    return "Bazı tercihlerine uyuyor ancak birkaç olumsuz sinyal de var.";
  }

  if (hasExplicitMatch && uniquePersonalReasonTypes >= 2) {
    return "Favori isimlerinden biri ve genel zevk profilin bu öneriyi güçlendiriyor.";
  }

  if (hasExplicitMatch) {
    return "Favori oyuncu, yönetmen veya stüdyo tercihlerinden biri bu filmde yer alıyor.";
  }

  if (uniquePersonalReasonTypes >= 2) {
    return "Tür ve hikâye tercihlerinle güçlü biçimde örtüşüyor.";
  }

  if (negativePersonalSignalCount > 0) {
    return "Bazı tercihlerine uyuyor ancak birkaç olumsuz sinyal de var.";
  }

  return "Tür tercihlerinden biriyle uyumlu görünüyor.";
}
