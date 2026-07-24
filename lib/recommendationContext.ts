// ─── Recommendation Engine v2 — kullanıcı veri sınırı ───────────────────
//
// Bu dosya, localStorage'a bağlı React hook'ları (useTasteProfile,
// useRecommendations) İLE saf scoring pipeline'ı (recommendationEngine.ts,
// cineaMatch.ts, whatToWatchPersonalization.ts) arasında AÇIK bir sınır
// tanımlar (bkz. görev talimatı Aşama 2 "Auth readiness").
//
// Bugün:   localStorage/store  -> RecommendationUserSnapshot -> RecommendationContext -> pipeline
// Yarın:   database/user API   -> AYNI RecommendationUserSnapshot şekli   -> AYNI RecommendationContext -> AYNI pipeline
//
// Bu görevde auth/database YAZILMADI — yalnızca bu sınır netleştirildi.
// buildTasteProfile (lib/tasteProfile.ts) zaten saftı ve localStorage
// okumuyordu; asıl localStorage bağımlılığı yalnızca React hook'larındaydı.
// Bu dosya o boşluğu isimlendirir, veri akışını YENİDEN YAZMAZ.
import type { FavoriteCompany, FavoritePerson } from "@/components/PreferenceProvider";
import type { WatchStatus } from "@/components/SavedMoviesProvider";
import { PROFILE_CONFIDENCE_CONFIG } from "@/lib/recommendationConfig";
import type { TasteProfile } from "@/lib/tasteProfile";

// ─── Snapshot ─────────────────────────────────────────────────────────────
//
// Kullanıcı hakkında bilinen HAM sinyaller — bugün localStorage'dan
// (SavedMoviesProvider/PreferenceProvider), yarın bir database/user API'den
// aynı şekilde doldurulabilir. Film/TMDB verisi BURADA yaşamaz (bkz.
// RecommendationMovie/TasteProfileMovie) — yalnızca "kullanıcı ne yaptı"
// bilgisi.
export type RecommendationUserSnapshot = {
  ratings: Record<string, number>;
  watchStatuses: Record<string, WatchStatus>;
  favoriteMovieIds: number[];
  watchlistMovieIds: number[];
  favoritePeople: FavoritePerson[];
  favoriteCompanies: FavoriteCompany[];
};

export const EMPTY_RECOMMENDATION_SNAPSHOT: RecommendationUserSnapshot = {
  ratings: {},
  watchStatuses: {},
  favoriteMovieIds: [],
  watchlistMovieIds: [],
  favoritePeople: [],
  favoriteCompanies: [],
};

export type ColdStartTier = "empty" | "light" | "established";

// ─── Context ──────────────────────────────────────────────────────────────
//
// Scoring pipeline'ının GERÇEKTEN tükettiği, normalize edilmiş girdi.
// recommendationEngine.ts/whatToWatchPersonalization.ts hâlâ TasteProfile
// alıyor (mevcut, test edilmiş imzalar korunuyor) — RecommendationContext
// bunun ÜSTÜNE, snapshot + türetilmiş confidence/cold-start bilgisini tek
// bir yerde toplayan bir zarf (envelope) sağlar. UI component tipleriyle
// karışmaz; yalnızca domain katmanında kullanılır.
export type RecommendationContext = {
  snapshot: RecommendationUserSnapshot;
  tasteProfile: TasteProfile;
  // [0,1], sürekli — mevcut tasteProfile.confidence (low/medium/high)
  // DEĞİŞTİRİLMEDİ; bu yalnızca EK, daha granüler bir gösterge (bkz.
  // lib/recommendationConfig.ts PROFILE_CONFIDENCE_CONFIG ve final rapor
  // "Profile confidence" bölümü).
  profileConfidence: number;
  coldStartTier: ColdStartTier;
  // Zaten etkileşilmiş (puanlanan, herhangi bir watch status'u olan,
  // favori, watchlist) tüm film id'leri — aday havuzundan erkenden elenir.
  excludedMovieIds: number[];
};

// ─── Dışlanan filmler ─────────────────────────────────────────────────────
//
// Önceden components/hooks/useRecommendations.ts içinde yaşıyordu; auth
// hazırlığı için domain katmanına taşındı (React hook'u artık buradan
// import eder) — davranış birebir aynı.
function parseValidMovieId(key: string): number | null {
  if (!/^\d+$/.test(key)) {
    return null;
  }

  const id = Number(key);

  return Number.isInteger(id) && id > 0 ? id : null;
}

/**
 * Kullanıcının zaten etkileşime girdiği (puanlanan, watched/watching/
 * dropped/plan-to-watch, favori, watchlist) tüm film id'lerini tek,
 * tekrarsız bir listede toplar. Saf bir fonksiyondur.
 */
export function buildExcludedMovieIds(
  snapshot: RecommendationUserSnapshot
): number[] {
  const excluded = new Set<number>();

  for (const key of Object.keys(snapshot.ratings)) {
    const id = parseValidMovieId(key);

    if (id !== null) {
      excluded.add(id);
    }
  }

  for (const key of Object.keys(snapshot.watchStatuses)) {
    const id = parseValidMovieId(key);

    if (id !== null) {
      excluded.add(id);
    }
  }

  for (const id of snapshot.favoriteMovieIds) {
    if (Number.isInteger(id) && id > 0) {
      excluded.add(id);
    }
  }

  for (const id of snapshot.watchlistMovieIds) {
    if (Number.isInteger(id) && id > 0) {
      excluded.add(id);
    }
  }

  return Array.from(excluded);
}

// ─── Profile confidence (sürekli, [0,1]) ─────────────────────────────────
//
// tasteProfile.ts'teki MEVCUT discrete confidence (low/medium/high, yalnızca
// puanlanmış film sayısına dayanır) DEĞİŞTİRİLMEDİ — CiNeA Match ve
// kişiselleştirme çarpanları hâlâ ona bağlı (bkz. rapor "dramatik
// değiştirmeme" kısıtı). Bu fonksiyon EK bir sinyaldir: favori/rating/
// watch-status SAYISINI birlikte, diminishing-returns (üstel doygunluk)
// ile birleştirip explain/debug ve gelecekteki ince ayar için 0-1 bir
// "genel veri zenginliği" skoru üretir. Hiçbir tek sinyal (ör. yalnızca
// çok sayıda favori) skoru tek başına domine edemez — üç sinyal de ayrı
// ayrı doygunlaşır ve ağırlıklı ortalaması alınır.
function saturatingSignal(count: number, saturationPoint: number): number {
  if (!Number.isFinite(count) || count <= 0) {
    return 0;
  }

  if (!Number.isFinite(saturationPoint) || saturationPoint <= 0) {
    return 1;
  }

  return 1 - Math.exp(-count / saturationPoint);
}

export function calculateProfileConfidence(
  snapshot: RecommendationUserSnapshot
): number {
  const ratedCount = Object.keys(snapshot.ratings).length;
  const watchStatusCount = Object.keys(snapshot.watchStatuses).length;
  const favoriteCount =
    snapshot.favoriteMovieIds.length +
    snapshot.favoritePeople.length +
    snapshot.favoriteCompanies.length;

  const cfg = PROFILE_CONFIDENCE_CONFIG;

  const ratedComponent =
    saturatingSignal(ratedCount, cfg.ratedMovieSaturation) * cfg.ratedMovieWeight;
  const favoriteComponent =
    saturatingSignal(favoriteCount, cfg.favoriteSaturation) * cfg.favoriteWeight;
  const statusComponent =
    saturatingSignal(watchStatusCount, cfg.watchStatusSaturation) *
    cfg.watchStatusWeight;

  const totalWeight = cfg.ratedMovieWeight + cfg.favoriteWeight + cfg.watchStatusWeight;

  if (totalWeight <= 0) {
    return 0;
  }

  const normalized =
    (ratedComponent + favoriteComponent + statusComponent) / totalWeight;

  return Number.isFinite(normalized) ? Math.min(1, Math.max(0, normalized)) : 0;
}

// ─── Cold-start tier ──────────────────────────────────────────────────────
//
// EMPTY: kullanıcı verisi yok/neredeyse yok -> kalite+popülerlik+genel
// çeşitlilik baskın olmalı (mevcut confidence="low" + confidenceMultiplier
// 0.45 zaten bunu sağlıyor).
// LIGHT: birkaç sinyal var -> kişiselleştirme orta seviyede.
// ESTABLISHED: yeterli sinyal var -> kullanıcı zevki daha güçlü belirleyici.
export function resolveColdStartTier(
  profileConfidence: number,
  tasteProfile: Pick<
    TasteProfile,
    | "totalRatedMovies"
    | "totalStatusMovies"
    | "explicitFavoriteActorIds"
    | "explicitFavoriteDirectorIds"
    | "explicitFavoriteCompanyIds"
  >
): ColdStartTier {
  const hasAnySignal =
    tasteProfile.totalRatedMovies > 0 ||
    tasteProfile.totalStatusMovies > 0 ||
    tasteProfile.explicitFavoriteActorIds.length > 0 ||
    tasteProfile.explicitFavoriteDirectorIds.length > 0 ||
    tasteProfile.explicitFavoriteCompanyIds.length > 0;

  if (!hasAnySignal || profileConfidence <= PROFILE_CONFIDENCE_CONFIG.emptyTierMax) {
    return "empty";
  }

  if (profileConfidence <= PROFILE_CONFIDENCE_CONFIG.lightTierMax) {
    return "light";
  }

  return "established";
}

// ─── Context oluşturma ────────────────────────────────────────────────────
//
// Saf fonksiyon: fetch yapmaz, React'a bağımlı değildir. tasteProfile
// ayrıca (buildTasteProfile ile, TMDB'den çekilmiş film verisi gerektiği
// için) hesaplanıp buraya PARAMETRE olarak verilir — bu dosya TMDB'ye hiç
// dokunmaz.
export function buildRecommendationContext(
  snapshot: RecommendationUserSnapshot,
  tasteProfile: TasteProfile
): RecommendationContext {
  const profileConfidence = calculateProfileConfidence(snapshot);
  const coldStartTier = resolveColdStartTier(profileConfidence, tasteProfile);
  const excludedMovieIds = buildExcludedMovieIds(snapshot);

  return {
    snapshot,
    tasteProfile,
    profileConfidence,
    coldStartTier,
    excludedMovieIds,
  };
}

// ─── Cache fingerprint (Aşama 9) ──────────────────────────────────────────
//
// Bu proje şu an client-side bir recommendation SONUÇ önbelleği
// TAŞIMIYOR — /api/movies ve /api/recommendations "no-store" (her zaman
// taze) fetch kullanıyor, TasteProfile/RecommendationContext her ilgili
// input değiştiğinde React useMemo ile yeniden hesaplanıyor (bkz. final
// rapor "Cache" bölümü). Bu fonksiyon, gelecekte bir sonuç önbelleği
// eklenirse KANONİK, sıra-bağımsız ve config-version'lı bir anahtar
// üretmek için hazır, saf bir primitive'dir — bugün hiçbir yerde
// zorunlu olarak TÜKETİLMEZ.
//
// Kanonikleştirme kuralları: id'ler sayısal sıraya göre sıralanır, kayıt
// sırası (object key order) SONUCU etkilemez, volatile timestamp'ler
// (generatedAt vb.) dahil edilmez, config version dahil edilir.
export function buildRecommendationFingerprint(
  snapshot: RecommendationUserSnapshot,
  configVersion: number
): string {
  function serializeIdEntries(record: Record<string, string | number>): string {
    return Object.entries(record)
      .filter(([key]) => /^\d+$/.test(key))
      .sort((a, b) => Number(a[0]) - Number(b[0]))
      .map(([id, value]) => `${id}:${value}`)
      .join(",");
  }

  function serializeIdList(ids: number[]): string {
    return [...ids]
      .filter((id) => Number.isInteger(id))
      .sort((a, b) => a - b)
      .join(",");
  }

  const ratingsPart = serializeIdEntries(snapshot.ratings);
  const statusesPart = serializeIdEntries(snapshot.watchStatuses);
  const favoritesPart = serializeIdList(snapshot.favoriteMovieIds);
  const watchlistPart = serializeIdList(snapshot.watchlistMovieIds);

  const favoritePeoplePart = snapshot.favoritePeople
    .map((person) => `${person.role}:${person.id}`)
    .sort()
    .join(",");

  const favoriteCompaniesPart = serializeIdList(
    snapshot.favoriteCompanies.map((company) => company.id)
  );

  return [
    `v${configVersion}`,
    `r:${ratingsPart}`,
    `s:${statusesPart}`,
    `f:${favoritesPart}`,
    `w:${watchlistPart}`,
    `fp:${favoritePeoplePart}`,
    `fc:${favoriteCompaniesPart}`,
  ].join("|");
}
