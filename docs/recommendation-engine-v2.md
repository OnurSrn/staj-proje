# CiNeA Recommendation Engine v2

Bu doküman, `/for-you`, `/what-to-watch` ve (dolaylı olarak) CiNeA Match hesabının **gerçekte nasıl çalıştığını** anlatır. Henüz yapılmamış özellikler "future extension" olarak ayrıca işaretlenir; geri kalan her şey bugün çalışan koda karşılık gelir.

Bu v2 çalışması **mevcut sistemi yeniden yazmadı** — zaten olgun olan scoring/diversity/match mantığını merkezi bir config, isimlendirilmiş bir kullanıcı-veri sınırı, paylaşılan bir kalite-güven primitive'i ve provenance korunan bir candidate registry etrafında topladı. Auth/database **eklenmedi**.

---

## 1. Amaç

- Aday kaynaklarını merkezi bir registry altında toplamak.
- Gerçek kullanıcı sinyallerini `RecommendationUserSnapshot` → `RecommendationContext` sınırından geçirmek.
- Ağırlıkları/eşikleri `lib/recommendationConfig.ts`'te tek noktada toplamak.
- Her film için açıklanabilir bir score breakdown üretmek (zaten mevcuttu, korunuyor).
- Cold-start/profile confidence davranışını standardize etmek.
- Kalite-güven hesabını Top Rated ile ortaklaştırmak (ayrı bir Bayesian kopyası yazmamak).
- Diversity/tie-break'i deterministik ve merkezi tutmak.
- Auth/database geldiğinde localStorage'ın yerini alabilecek net bir veri sınırı bırakmak.

## 2. Yüksek seviye veri akışı

```
localStorage (SavedMoviesProvider / PreferenceProvider)
   │  useMovieRatings / useWatchStatuses / useSavedMovies /
   │  useFavoritePeople / useFavoriteCompanies
   ▼
RecommendationUserSnapshot   (lib/recommendationContext.ts)
   │  + TasteProfileMovie[] (TMDB'den çekilmiş, useTasteProfile.ts)
   ▼
TasteProfile                 (lib/tasteProfile.ts — buildTasteProfile, SAF)
   │
   ▼
RecommendationContext        (lib/recommendationContext.ts — buildRecommendationContext)
   │  profileConfidence (0-1), coldStartTier, excludedMovieIds
   ▼
Candidate pool                /api/recommendations (RECOMMENDATION_SOURCES) → sourceIds korunur
   │
   ▼
RecommendationMovie[]          (useRecommendations.ts — toRecommendationMovie, DNA dahil)
   │
   ▼
rankRecommendationCandidates   (lib/recommendationEngine.ts — SAF)
   │  scoreCandidate (genre/dna/explicit/inferred/era/dil/süre/kalite)
   │  + calculateCineaMatch (lib/cineaMatch.ts)
   │  + applyDiversitySelection (deterministik rerank)
   ▼
RecommendationCandidate[]      → ForYouDashboard.tsx (MovieCard + cineaMatch prop)
```

`What to Watch` PARALEL ama ayrı bir dal kullanır: form kriterleri (mood/runtime/…) zaten TMDB discover'a gönderilip bir `RecommendationMovie[]` adayı üretir; `rankWhatToWatchCandidates` (lib/whatToWatchPersonalization.ts) bu adayları **yeniden sıralar** (yeni aday eklemez/çıkarmaz), aynı `applyDiversitySelection` ve `CONFIDENCE_MULTIPLIERS`'ı `lib/recommendationConfig.ts`'ten paylaşarak.

## 3. Candidate kaynakları

`lib/recommendationConfig.ts` → `RECOMMENDATION_SOURCES`, tüketen: `app/api/recommendations/route.ts`.

| id | tetiklenme koşulu | voteCountMin | voteAverageMin |
|---|---|---|---|
| `preferredGenreDiscovery` | en güçlü ≤3 tür tercihi varsa | 100 | 5.5 |
| `dnaKeywordDiscovery` | en güçlü ≤3 DNA sinyali varsa | 50 | 5 |
| `favoriteActorDiscovery` | explicit favori oyuncu varsa | 30 | 0 |
| `favoriteDirectorDiscovery` | explicit favori yönetmen varsa | 30 | 0 |
| `favoriteCompanyDiscovery` | explicit favori stüdyo varsa | 30 | 0 |
| `popularFallback` | HER ZAMAN | 200 | 6 |

Her havuz `getCollectionCandidates` (mevcut, `lib/tmdb.ts`) ile tek sayfa (20 sonuç) çeker; `Promise.allSettled` ile biri başarısız olsa da diğerleri devam eder. Sonuçlar `id` bazında dedupe edilir; **provenance korunur** — aynı film 3 havuzdan geldiyse `sourceIds: ["preferredGenreDiscovery","dnaKeywordDiscovery","popularFallback"]` gibi TÜM kaynaklar `RecommendationMovie.sourceIds` alanında saklanır (`useRecommendations.ts`'teki `toRecommendationMovie`). Bu alan şu an yalnızca **explainability/debug** amaçlı — scoring'i etkilemez (bkz. bölüm 8).

En fazla `RECOMMENDATION_POOL_LIMITS.maxCandidateIds` (50) aday havuza girer; bunlardan en fazla `RECOMMENDATION_LIMITS.maxDetailFetchCandidates` (40) için detay çekilir.

## 4. RecommendationUserSnapshot

`lib/recommendationContext.ts`:

```ts
type RecommendationUserSnapshot = {
  ratings: Record<string, number>;
  watchStatuses: Record<string, WatchStatus>;
  favoriteMovieIds: number[];
  watchlistMovieIds: number[];
  favoritePeople: FavoritePerson[];
  favoriteCompanies: FavoriteCompany[];
};
```

Bugün `useRecommendations.ts` içinde `useSavedMovies`/`useMovieRatings`/`useWatchStatuses`/`useFavoritePeople`/`useFavoriteCompanies` hook'larından (hepsi localStorage'a bağlı) doldurulur. Film/TMDB verisi (RecommendationMovie/TasteProfileMovie) BU tipin içinde yaşamaz — snapshot yalnızca "kullanıcı ne yaptı" bilgisidir.

## 5. RecommendationContext

```ts
type RecommendationContext = {
  snapshot: RecommendationUserSnapshot;
  tasteProfile: TasteProfile;
  profileConfidence: number;   // [0,1], sürekli
  coldStartTier: "empty" | "light" | "established";
  excludedMovieIds: number[];
};
```

`buildRecommendationContext(snapshot, tasteProfile)` saf bir fonksiyondur — fetch yapmaz. `tasteProfile` ayrı hesaplanıp (TMDB film verisi gerektirdiği için) parametre olarak verilir.

## 6. Profile confidence

**İki ayrı, bilerek AYRI tutulan sinyal var:**

1. **Mevcut, DEĞİŞTİRİLMEMİŞ discrete confidence** (`TasteProfile.confidence: "low"|"medium"|"high"`, `lib/tasteProfile.ts`) — YALNIZCA puanlanmış film sayısına dayanır (≤4 low, ≤14 medium, üstü high). `CONFIDENCE_MULTIPLIERS` (kişiselleştirme çarpanı: 0.45/0.75/1.0) ve `MATCH_CONFIDENCE_RANGES` (CiNeA Match yüzde aralığı) buna bağlıdır. **Bu görevde bilerek değiştirilmedi** — mevcut kullanıcıların match yüzdelerini dramatik/anlamsız biçimde kaydırmamak için (bkz. görev kısıtı).
2. **Yeni, EK, sürekli `profileConfidence` (0-1)** (`calculateProfileConfidence`, `lib/recommendationContext.ts`) — rating sayısı + favori sayısı (movie+actor+director+company) + watch-status sayısını üstel doygunlukla (`1 - e^(-count/saturation)`) birleştirir, ağırlıklı ortalamasını alır. Hiçbir tek sinyal domine edemez; sonuç her zaman `[0,1]` sınırlıdır ve NaN üretmez. **Şu an scoring'i DEĞİŞTİRMEZ** — yalnızca `coldStartTier`'ı belirler ve explain/debug helper'ında görünür.

## 7. Cold-start seviyeleri

`resolveColdStartTier(profileConfidence, tasteProfile)`:

- **empty**: hiç sinyal yok (rating/status/explicit favori sıfır) VEYA `profileConfidence <= 0.05`.
- **light**: `profileConfidence <= 0.45`.
- **established**: üstü.

Eşikler `RECOMMENDATION_CONFIG.confidence.continuous` (`PROFILE_CONFIDENCE_CONFIG`) altında ayarlanabilir.

## 8. Scoring sinyalleri

`lib/recommendationEngine.ts` → `scoreCandidate`, aşağıdaki saf helper'ların toplamı (her biri `[-cap, +cap]` clamp'li):

| sinyal | cap | kaynak |
|---|---|---|
| genre | 30 | `getGenreContribution` |
| dna | 30 | `getDnaContribution` |
| explicit (actor/director/company) | 20 | `getExplicitContribution` |
| inferred (actor/director/company) | 10 | `getInferredContribution` |
| era | 4 | `getEraContribution` |
| language | 3 | `getLanguageContribution` |
| runtime | 3 | `getRuntimeContribution` |
| quality | 10 | `getQualityContribution` (bkz. bölüm 10) |

Her helper `confidenceMultiplier` (discrete confidence'tan) ile çarpılır (quality hariç — kalite kişisel zevk değildir). `RecommendationCandidate.breakdown` bu 6 kategoriyi (era+dil+süre "context" altında birleşik) taşır — production UI'a **taşınmaz**, yalnızca CiNeA Match hesabına ve (istenirse) debug helper'ına girdi olur.

**sourceIds**, scoring'e girmez — yalnızca provenance/explainability içindir (bkz. bölüm 3).

## 9. Penalties

- **Disliked genre**: `genrePreferences` içinde negatif skorlu bir tür eşleşirse `getGenreContribution` NEGATİF katkı üretir (test matrisi senaryo 4 ile doğrulandı — yüksek kalite tek başına bunu kolayca aşamıyor).
- **Uzak runtime**: tercih aralığının >60dk dışına çıkan filmlere küçük (-1) ceza.
- **Düşük kalite**: `voteCount>=50 && 0<voteAverage<5` → -3 (v1 ile birebir aynı, değiştirilmedi).
- **Watched/Dropped/Watchlist/Favorite**: mevcut davranış korunur — hepsi `excludedMovieIds`'e girer, aday havuzundan TAMAMEN çıkarılır (v1'den beri böyle; bu görevde davranış değiştirilmedi, bkz. bölüm 21 "Bilinen sınırlamalar").
- **Negative CiNeA Match sinyali**: `MATCH_CALIBRATION.negativeSignalPenaltyPerSignal` (3, en fazla -15) — match yüzdesinde ayrıca görünür bir ceza.

## 10. Quality confidence

**Artık `lib/qualityConfidence.ts`'teki PAYLAŞILAN Bayesian primitive'i kullanılıyor** — Top Rated (`lib/topRatedRanking.ts`) ile AYNI formül:

```
bayesianScore = (v/(v+m))·R + (m/(v+m))·C
```

- Top Rated: `C` = aday havuzunun anlık ortalaması, `m=3000`, `minimumVoteCount=50` ek cezası.
- Recommendation: `C` = **sabit** `priorMean=6.8` (havuza bağımlı değil — recommendation adayları Top Rated'ınki gibi kürate edilmiş bir havuz değil, tüm katalogdan geliyor), aynı `m=3000`, aynı `minimumVoteCount=50`. Sonuç `normalizeQualityConfidence` ile `[lowerAnchor=5.5, upperAnchor=8.5]` referans aralığına göre `[0,1]`'e normalize edilip `[0, qualityMax=10]` bonusa çevrilir.

**Top Rated davranışı DEĞİŞMEDİ** — extraction sonrası aynı 4 test senaryosu (`9.5/15`, `8.7/50000`, `8.4/1000000`, `8.9/3000`) birebir aynı sayıları (`4.5581`, `8.6038`, `8.3958`, `7.9500`) üretiyor (doğrulandı).

**Önce/sonra (recommendation quality contribution):**

| senaryo | v1 (eski, eşik-bazlı) | v2 (Bayesian) | not |
|---|---|---|---|
| 9.5★ / 15 oy | ~0 (eşiğin altında, ceza da bonus da yok) | ~0 (minimumVoteCount cezası shrinkage'ı priorMean'in altına iter, normalize 0'a clamp'lenir) | şişme yok, davranış benzer |
| 8.7★ / 50.000 oy | +5 (flat eşik bonusu) | ~+9-10 (yüksek güvenli Bayesian skor üst anchor'a yakın) | v2 KADEMELİ ödüllendirir — v1'in "500 oy da 50.000 oy da aynı +5" kısıtını kaldırır |
| 8.4★ / 1.000.000 oy | +5 | ~+9 | aynı yönde, v2 biraz daha yüksek |
| 6.8★ / 100 oy (vasat) | 0 | ~0 (priorMean'e çok yakın) | değişmedi |

Bu, **kasıtlı ve açıklanmış bir kalibrasyon iyileştirmesi** — v1'in "flat +5 eşiği" yerine oy sayısına GERÇEKTEN duyarlı bir bonus. Düşük-kalite cezası (bölüm 9) v1 ile birebir aynı bırakıldı; toplam `score`'un genre/dna/explicit bileşenleri (çok daha büyük cap'lere sahip) genelde domine ettiği için nihai sıralamada dramatik bir kayma beklenmez — test matrisi (senaryo 3/19) aynı girdide deterministik/tutarlı sonuç üretildiğini doğruladı.

## 11. CiNeA Match kalibrasyonu

`lib/cineaMatch.ts` (`MATCH_CALIBRATION`/`MATCH_CONFIDENCE_RANGES`/`MATCH_LIMITS`, artık `lib/recommendationConfig.ts`'ten) — **mantık değiştirilmedi**, yalnızca konumu merkezileşti:

1. `personalContribution` (genre+dna+explicit+inferred+context) sigmoid ile `[0,1]`'e sıkıştırılıp `%55 ± %35` aralığına yayılır.
2. Quality'den küçük bonus/penaltı (±6).
3. Kanıt çeşitliliği bonusu (farklı sinyal TÜRÜ sayısı > 1 ise, en fazla +6).
4. Explicit favori nüansı (+3).
5. Negatif sinyal cezası (en fazla -15).
6. Confidence'a göre min/max aralık (`low: 28-82`, `medium: 22-92`, `high: 12-96`).
7. Hiç kişisel kanıt yokken + low confidence → en fazla %70.
8. `Math.round(clamp(...,0,100))`.

**0-100 güvenliği**: her adımda clamp var; `qualityConfidence` normalize edilmiş `[0,1]`'den geldiği için `Number.isFinite` garantili — test matrisi senaryo 22 (`NaN`/`Infinity`/aşırı büyük değerler) ile doğrulandı, tüm sonuçlar `[0,100]` ve `Number.isFinite`.

**Cold-start etkisi**: kullanıcı verisi yokken (`positivePersonalSignalCount===0 && confidence==="low"`) yüzde en fazla %70'te kalır — "kesin %90+ sever" iddiası hiçbir zaman üretilmez.

## 12. Diversity

`applyDiversitySelection` (`lib/recommendationEngine.ts`, hem For You hem What to Watch tarafından paylaşılır):

1. **Strict pass**: ilk `window` (12) sonuç, `maxPerDirectorInWindow=2` / `maxPerCompanyInWindow=3` kısıtına uyan adaylardan doldurulur.
2. **Relaxation pass**: pencere hâlâ dolmadıysa, kısıtı ihlal etse de `scoreGuard=10`'dan fazla skor farkı olan (yani gerçekten güçlü) adaylar eklenir.
3. **Fill pass**: hâlâ dolmadıysa, kalan en iyi adaylarla (kısıt gözetmeksizin) doldurulur.

Franchise/collection ID kullanılmaz — mevcut candidate metadata'sında `belongs_to_collection` yok, yeni bir istek eklenmedi (bilinen sınırlama, bkz. bölüm 21).

## 13. Deterministic tie-break

`compareRecommendationCandidate`:

```
finalScore desc → qualityConfidence desc → vote_count desc → vote_average desc → release_date (ESKİ önce) → movie ID asc
```

Release date için "eski önce" kuralı, `lib/topRatedRanking.ts`'in eşit-skor tie-break'iyle **tutarlılık için** seçildi (proje genelinde tek bir kural). Random/`Date.now` hiçbir yerde kullanılmaz — test matrisi senaryo 19 (aynı girdi → aynı sıra/skor) ile doğrulandı.

## 14. Cache fingerprint / invalidation

**Bu proje şu an bir client-side recommendation SONUÇ önbelleği taşımıyor:**

- `/api/movies/[id]` ve `/api/recommendations`: `cache: "no-store"` (her zaman taze).
- `TasteProfile`/`RecommendationContext`: React `useMemo` ile, ilgili input (ratings/statuses/favoriler) değiştiğinde otomatik yeniden hesaplanır — provider'lar localStorage değişiminde yeni referans üretir, `useMemo` bunu doğru yakalar.
- Next.js'in KENDİ fetch cache'i (`getCollectionCandidates`/`getMovieDetails` içinde `revalidate: 3600`) URL'ye göre anahtarlanır — genre/keyword/actor/director/company id'leri zaten URL'de olduğundan doğal olarak doğru invalidation sağlar.

Bu nedenle **"eski cache yanlış sonuç gösterir mi" riski bugün yok** — gösterilecek bir sonuç cache'i yok. `buildRecommendationFingerprint(snapshot, configVersion)` (`lib/recommendationContext.ts`), gelecekte bir sonuç önbelleği eklenirse kullanılmak üzere HAZIR, saf, kanonik (id sırası önemsiz, config version dahil) bir primitive'dir — bugün hiçbir yerde zorunlu tüketilmez. Test matrisi senaryo 20 (array order) ve 21 (config version) ile doğrulandı.

`RECOMMENDATION_CACHE_CONFIG.version` (şu an `1`) — bu önbellek eklendiğinde fingerprint'e otomatik dahil olur.

## 15. Network bütçesi

Ölçüldü (gerçek tarayıcı, established profile — 8 rating + birkaç status-only film): `/for-you` ilk yükleme = **1** `/api/recommendations` (5 TMDB discover havuzu + fallback, sunucu tarafında) + **9** `/api/movies/[id]` (taste profile kaynak filmleri) + **40** `/api/movies/[id]?mode=dna` (aday detayları) = **50 istek toplam**. Bu, v2 öncesiyle BİREBİR aynı (aynı `MAX_DETAIL_FETCH_CANDIDATES=40`, aynı `MAX_ANALYZED_MOVIES=50` limiti) — refactor request sayısını artırmadı.

Movie detail sayfası: **0** recommendation-ilişkili istek (CiNeA Match orada zaten render edilmiyor, bkz. bölüm 21).

Concurrency: `useMoviesByIds` hâlâ `MOVIE_FETCH_CONCURRENCY=6` (artık merkezi config'ten) ile sınırlı worker-pool kullanıyor — değişmedi.

## 16. Debug/explain helper kullanımı

`lib/recommendationExplain.ts` — **yalnızca development/test için**, production UI'a bağlanmaz, console.log yapmaz, route oluşturmaz:

```ts
import { explainRecommendation, getRecommendationDebugSummary, summarizeRecommendationScore } from "@/lib/recommendationExplain";

const summary = explainRecommendation(candidate, { profileConfidence: context.profileConfidence, coldStartTier: context.coldStartTier });
console.log(summarizeRecommendationScore(summary));
// #157336 "Interstellar" score=42.7 quality=0.87 match=80% tier=established sources=[preferredGenreDiscovery,popularFallback] top signal=genre(+18.2)
```

`getRecommendationDebugSummary(candidates, context, rankedOrder?)` — tüm liste için, `finalRank` doldurulabilir.

## 17. Config ayarlama rehberi

Tüm ayarlanabilir değerler `lib/recommendationConfig.ts`'te, kategoriye göre gruplu (`RECOMMENDATION_SOURCES`, `RECOMMENDATION_WEIGHT_CAPS`, `RECOMMENDATION_QUALITY_CONFIG`, `MATCH_CALIBRATION`, `PROFILE_CONFIDENCE_CONFIG`, `RECOMMENDATION_DIVERSITY_CONFIG`, `RECOMMENDATION_LIMITS`, `RECOMMENDATION_POOL_LIMITS`, `RECOMMENDATION_CACHE_CONFIG`). Bir ağırlığı/eşiği değiştirmek için **algoritma koduna girmek gerekmez** — yalnızca bu dosyadaki sayıyı değiştirin. `RECOMMENDATION_CONFIG` (tek birleşik obje) tüm bölümlerin bir "görünümünü" sağlar.

Değer değiştirdikten sonra: `lib/recommendationEngine.ts`'teki test senaryolarını (bkz. final rapor "Test matrisi") tekrar çalıştırarak sınırların (`[0,100]` match, `[-cap,+cap]` breakdown) hâlâ korunduğunu doğrulayın.

## 18. Yeni sinyal ekleme rehberi

1. `RECOMMENDATION_CONFIG.weights` altına yeni bir cap/ağırlık ekleyin.
2. `lib/recommendationEngine.ts`'te `scoreXxxContribution(candidateData, tasteProfile, confidenceMultiplier)` şeklinde SAF bir helper yazın — `{contribution, reasons, signals}` döndürsün, missing data'da `{0, [], []}` versin, NaN/Infinity üretmesin.
3. `scoreCandidate`'te toplam skora ve `personalSignals`'a ekleyin.
4. `RecommendationScoreBreakdown`'a yeni bir alan eklemeniz gerekiyorsa `cineaMatch.ts`'teki `personalContribution` toplamını da güncelleyin.
5. Test matrisine (bkz. final rapor) yeni sinyal için en az 2 senaryo (pozitif eşleşme, missing data) ekleyin.

## 19. Yeni candidate source ekleme rehberi

1. `RECOMMENDATION_SOURCES`'a yeni bir `RecommendationSourceId` + tanım (voteCountMin/voteAverageMin/priority/requiresSignal) ekleyin.
2. `app/api/recommendations/route.ts`'te ilgili koşulu ve `fetchPool(source.id, {...})` çağrısını ekleyin.
3. Yeni bir TMDB isteği türü gerekiyorsa `lib/tmdb.ts`'teki mevcut `getCollectionCandidates`/discover helper'larını kullanın — yeni bir fetch mekanizması icat etmeyin.
4. `sourceIds` provenance otomatik çalışır (route zaten tüm havuzları birleştirirken kaynak etiketliyor).

## 20. Auth/database entegrasyon notu

**Bu görevde auth/database YAZILMADI.** Sınır şu şekilde hazırlandı:

```
Şimdiki:  localStorage/store  → RecommendationUserSnapshot → RecommendationContext → pipeline
Gelecek:  database/user API   → AYNI RecommendationUserSnapshot → AYNI RecommendationContext → AYNI pipeline
```

`buildTasteProfile`, `buildRecommendationContext`, `rankRecommendationCandidates`, `calculateCineaMatch`, `applyDiversitySelection`, `rankWhatToWatchCandidates` — hepsi **zaten saf fonksiyonlardı** (fetch yapmazlar, React'a/localStorage'a bağımlı değiller) ve bu görevde de öyle kaldılar. localStorage bağımlılığı YALNIZCA React hook katmanında (`useTasteProfile.ts`, `useRecommendations.ts`) yaşıyor — auth geldiğinde yalnızca BU İKİ hook'un `RecommendationUserSnapshot`'ı nereden doldurduğu değişecek (localStorage yerine bir API/React Query/Server Action çağrısı), pipeline'ın geri kalanı (scoring/diversity/match/cache fingerprint) **tek satır bile değişmeden** çalışmaya devam edecek. Ayrıntılar için bkz. final rapor "Auth readiness".

## 21. Bilinen sınırlamalar

- **Movie detail'de CiNeA Match YOK.** Denetim sırasında bulundu: `calculateCineaMatch` şu an yalnızca `/for-you` akışında (`recommendationEngine.ts` içinde) çağrılıyor; film detay sayfasında (`app/movie/[id]/page.tsx`) hiçbir match/skor render edilmiyor — `MovieCard`'ın `cineaMatch` prop'u yalnızca `ForYouDashboard.tsx`'ten geçiriliyor. Görev talimatı "kodda bulunmayan bir sinyali mevcutmuş gibi raporlama" dediği için bu özellik İCAT EDİLMEDİ; mimari (saf, context-tabanlı `calculateCineaMatch`) buna hazır olsa da (tek bir film + context ile, yeni bir candidate fetch olmadan çağrılabilir), gerçek UI entegrasyonu bu görevin kapsamı dışında bırakıldı.
- **Franchise/collection çeşitliliği yok** — `belongs_to_collection` mevcut candidate metadata'sında yok, yeni istek eklenmedi (bilinçli, bkz. bölüm 12).
- **Watchlist, "zaten izlenmiş" gibi tamamen dışlanıyor** (v1'den beri, bu görevde DEĞİŞTİRİLMEDİ) — bir film watchlist'e eklendiği anda bir daha asla önerilmiyor, "izlenmedi ama zaten biliniyor" ile "izlendi" ayrımı yapılmıyor. Davranış korunmuştur (dramatik değişiklik istenmiyordu) ama bu, ürün açısından tartışmaya açık bir nokta olarak not düşülür.
- **Region/dil**: recommendation candidate fetch'leri (discover/movie) TMDB `language` parametresi göndermez (mevcut `getCollectionCandidates` gibi çoğu discover helper'ı gibi) — kullanıcının uygulama dili/bölgesi recommendation adaylarının içeriğini ETKİLEMEZ. Bu, v1'den beri var olan bir durum, bu görevde değiştirilmedi.
- **profileConfidence (sürekli) henüz scoring'e bağlı değil** — yalnızca `coldStartTier` ve debug helper'ında kullanılıyor. Gelecekte `CONFIDENCE_MULTIPLIERS`'ın yerini alması/onu tamamlaması istenirse, mevcut kullanıcıların match yüzdelerinde büyük bir kayma yaratmadan kademeli bir geçiş planı gerekir.

## 22. Gelecek geliştirmeler (future extension — KODDA YOK)

- `profileConfidence` (sürekli) → `CONFIDENCE_MULTIPLIERS`'ın kademeli/sürekli bir versiyonuna geçiş.
- Franchise/collection diversity (yeni `belongs_to_collection` isteği veya candidate response'a append_to_response ile mümkün olursa).
- Movie detail sayfasında CiNeA Match render'ı (mimari hazır, UI çalışması yapılmadı).
- `sourceIds` provenance'ının bir `scoreCandidateSources` ağırlığına dönüşmesi (şu an yalnızca metadata/explainability).
- Region-aware discover sorguları (kullanıcının bölgesine göre yayın/telif filtresi).
- Gerçek bir client-side recommendation sonuç önbelleği (bugün yok; `buildRecommendationFingerprint` bu ihtiyaç doğduğunda hazır).
