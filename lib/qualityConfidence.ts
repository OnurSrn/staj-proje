// Paylaşılan Bayesian/weighted-rating kalite-güven primitive'i.
//
// Bu formül önce lib/topRatedRanking.ts içinde (Top Rated rail'i için)
// yazıldı. Recommendation Engine v2 kendi kopyasını yazmak yerine AYNI
// primitive'i tüketir (bkz. görev talimatı "CiNeA Recommendation Engine v2"
// Aşama 5) — böylece "yüksek puan ama düşük oy sayısı" filmlerin şişmesini
// engelleyen mantık TEK yerde yaşar. Top Rated'in kendi davranışı
// (isValidMovie/tie-break/dönem çeşitliliği) burada tekrar edilmez; yalnızca
// ham sayısal formül taşınır.
//
// R = vote_average, v = vote_count, C = priorMean (aday havuzunun/alanının
// güvenilir ortalama puanı), m = confidenceVoteCount ("güven" oy eşiği).
export type QualityConfidenceConfig = {
  // Bayesian formülündeki "m" — v bu değere yaklaştıkça skor R'den uzaklaşıp
  // C'ye yaklaşır; v arttıkça skor R'ye yaklaşır.
  confidenceVoteCount: number;
  // Bu eşiğin altındaki vote_count'a sahip filmlere ek bir güven cezası
  // uygulanır (Bayesian shrinkage'a EK olarak). 0 verilirse bu ek ceza
  // tamamen devre dışı kalır (yalnızca shrinkage uygulanır).
  minimumVoteCount: number;
};

export function isValidVoteData(
  voteAverage: unknown,
  voteCount: unknown
): voteAverage is number {
  return (
    typeof voteAverage === "number" &&
    Number.isFinite(voteAverage) &&
    voteAverage >= 0 &&
    typeof voteCount === "number" &&
    Number.isFinite(voteCount) &&
    voteCount >= 0
  );
}

/**
 * Ham Bayesian ağırlıklı puan (vote_average ile aynı ölçekte, ör. 0-10).
 * Geçersiz girdide (NaN/negatif/eksik) Number.NEGATIVE_INFINITY döner —
 * hiçbir zaman NaN üretmez, çağıran taraf bunu güvenle "en düşük olası
 * skor" olarak sıralayabilir/reddedebilir.
 */
export function calculateBayesianQualityScore(
  voteAverage: number,
  voteCount: number,
  priorMean: number,
  config: QualityConfidenceConfig
): number {
  if (!isValidVoteData(voteAverage, voteCount) || !Number.isFinite(priorMean)) {
    return Number.NEGATIVE_INFINITY;
  }

  const v = voteCount;
  const r = voteAverage;
  const m = config.confidenceVoteCount;

  const bayesianScore = (v / (v + m)) * r + (m / (v + m)) * priorMean;

  if (config.minimumVoteCount > 0 && v < config.minimumVoteCount) {
    const confidenceRatio = v / config.minimumVoteCount;

    // v = 0 olsa bile skor tamamen sıfırlanmaz, yalnızca yarıya kadar
    // bastırılır ("sert biçimde tamamen silme" yerine kademeli güven
    // cezası).
    return bayesianScore * (0.5 + 0.5 * confidenceRatio);
  }

  return bayesianScore;
}

/**
 * Aday listesinin güvenilir ortalama puanı (C) — yalnızca geçerli
 * vote_average/vote_count taşıyan adaylar ortalamaya katılır. Boş/geçersiz
 * listede fallbackPriorMean döner (varsayılan 0), asla NaN üretmez.
 */
export function calculatePriorMean<T>(
  items: T[],
  getVoteAverage: (item: T) => unknown,
  getVoteCount: (item: T) => unknown,
  fallbackPriorMean = 0
): number {
  let sum = 0;
  let count = 0;

  for (const item of items) {
    const voteAverage = getVoteAverage(item);
    const voteCount = getVoteCount(item);

    if (isValidVoteData(voteAverage, voteCount)) {
      sum += voteAverage;
      count += 1;
    }
  }

  return count > 0 ? sum / count : fallbackPriorMean;
}

export type NormalizeQualityConfidenceOptions = {
  // Bayesian skorun 0 kabul edileceği alt sınır (bu değerin altı 0'a
  // clamp'lenir — negatif "güven" üretilmez).
  lowerAnchor: number;
  // Bayesian skorun 1 kabul edileceği üst sınır.
  upperAnchor: number;
};

/**
 * Ham Bayesian skoru (ör. 0-10 ölçeğinde), sabit ve config'ten gelen
 * lower/upperAnchor'lara göre [0,1] aralığına normalize eder. -Infinity
 * (geçersiz girdi) veya NaN güvenle 0'a düşer — asla NaN/Infinity sızdırmaz.
 */
export function normalizeQualityConfidence(
  bayesianScore: number,
  options: NormalizeQualityConfidenceOptions
): number {
  if (!Number.isFinite(bayesianScore)) {
    return 0;
  }

  const { lowerAnchor, upperAnchor } = options;

  if (upperAnchor <= lowerAnchor) {
    return 0;
  }

  const ratio = (bayesianScore - lowerAnchor) / (upperAnchor - lowerAnchor);

  return Math.min(1, Math.max(0, ratio));
}
