// ─── Recommendation Engine v2 — explainability helper ───────────────────
//
// Saf, YALNIZCA development/test amaçlı yardımcılar (bkz. görev talimatı
// Aşama 11). Production UI'a BAĞLANMAZ, otomatik console.log YAPMAZ, route
// OLUŞTURMAZ, kullanıcı state'ini/secret'ları dump ETMEZ — yalnızca zaten
// hesaplanmış bir RecommendationCandidate'ı okunabilir bir özete çevirir.
// Tree-shake güvenlidir: hiçbir yan etkisi yoktur, hiçbir modül seviyesinde
// çalışan kod içermez.
import type { ColdStartTier } from "@/lib/recommendationContext";
import type { RecommendationCandidate } from "@/lib/recommendationEngine";

export type RecommendationDebugSignal = {
  type: string;
  label: string;
  contribution: number;
};

export type RecommendationDebugSummary = {
  movieId: number;
  title: string;
  // Bu adayın geldiği candidate source'lar (bkz.
  // lib/recommendationConfig.ts RECOMMENDATION_SOURCES) — provenance.
  sources: string[];
  profileConfidence: number;
  coldStartTier: ColdStartTier;
  topPositiveSignals: RecommendationDebugSignal[];
  // breakdown'daki negatif katkılar (varsa) — "penalty" olarak ayrı listelenir.
  topPenalties: RecommendationDebugSignal[];
  qualityConfidence: number;
  scoreBeforeDiversity: number;
  matchPercentage: number;
  finalRank: number | null;
};

const MAX_DEBUG_SIGNALS = 5;

/**
 * Tek bir RecommendationCandidate'ı, skorun NEREDEN geldiğini açıklayan
 * okunabilir bir özete çevirir. `finalRank`, adayın diversity pass
 * SONRASI listedeki 1-index pozisyonunu ifade eder — çağıran taraf
 * bilmiyorsa/vermek istemiyorsa null bırakabilir.
 */
export function explainRecommendation(
  candidate: RecommendationCandidate,
  context: { profileConfidence: number; coldStartTier: ColdStartTier },
  finalRank: number | null = null
): RecommendationDebugSummary {
  const positiveReasons = candidate.reasons
    .filter((reason) => reason.contribution > 0)
    .sort((a, b) => b.contribution - a.contribution)
    .slice(0, MAX_DEBUG_SIGNALS)
    .map((reason) => ({
      type: reason.type,
      label: reason.label,
      contribution: reason.contribution,
    }));

  const penalties: RecommendationDebugSignal[] = [];

  for (const [key, value] of Object.entries(candidate.breakdown)) {
    if (typeof value === "number" && value < 0) {
      penalties.push({ type: key, label: key, contribution: value });
    }
  }

  penalties.sort((a, b) => a.contribution - b.contribution);

  return {
    movieId: candidate.movie.id,
    title: candidate.movie.title,
    sources: candidate.movie.sourceIds ?? [],
    profileConfidence: context.profileConfidence,
    coldStartTier: context.coldStartTier,
    topPositiveSignals: positiveReasons,
    topPenalties: penalties.slice(0, MAX_DEBUG_SIGNALS),
    qualityConfidence: candidate.qualityConfidence,
    scoreBeforeDiversity: candidate.score,
    matchPercentage: candidate.match.percentage,
    finalRank,
  };
}

/**
 * Bir aday listesinin TAMAMI için debug özetini üretir. `rankedOrder`
 * verilirse (ör. diversity pass sonrası nihai sıra), finalRank alanı
 * doldurulur; verilmezse null kalır.
 */
export function getRecommendationDebugSummary(
  candidates: RecommendationCandidate[],
  context: { profileConfidence: number; coldStartTier: ColdStartTier },
  rankedOrder?: RecommendationCandidate[]
): RecommendationDebugSummary[] {
  const rankById = new Map<number, number>();

  if (rankedOrder) {
    rankedOrder.forEach((candidate, index) => {
      rankById.set(candidate.movie.id, index + 1);
    });
  }

  return candidates.map((candidate) =>
    explainRecommendation(
      candidate,
      context,
      rankById.get(candidate.movie.id) ?? null
    )
  );
}

/**
 * Tek satırlık, insan-okur özet — hızlı scratch/manual test için.
 * "İngilizce" formatlama yapmaz, TR/EN i18n sistemine bağlanmaz (yalnızca
 * geliştirici/test amaçlı, kullanıcıya asla gösterilmez).
 */
export function summarizeRecommendationScore(
  summary: RecommendationDebugSummary
): string {
  const topSignal = summary.topPositiveSignals[0];
  const signalPart = topSignal
    ? `top signal=${topSignal.type}(+${topSignal.contribution})`
    : "no positive signal";
  const penaltyPart =
    summary.topPenalties.length > 0
      ? `, penalty=${summary.topPenalties[0].type}(${summary.topPenalties[0].contribution})`
      : "";

  return (
    `#${summary.movieId} "${summary.title}" ` +
    `score=${summary.scoreBeforeDiversity} quality=${summary.qualityConfidence.toFixed(2)} ` +
    `match=${summary.matchPercentage}% tier=${summary.coldStartTier} ` +
    `sources=[${summary.sources.join(",")}] ${signalPart}${penaltyPart}`
  );
}
