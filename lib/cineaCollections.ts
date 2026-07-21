import type { MovieSort } from "@/lib/tmdb";
import { TMDB_KEYWORD_IDS } from "@/lib/tmdbKeywords";

export type CollectionAccent =
  | "purple"
  | "red"
  | "blue"
  | "green"
  | "amber"
  | "cyan";

export type ScoringWeights = {
  requiredGenre: number;
  optionalGenre: number;
  requiredKeyword: number;
  optionalKeyword: number;
  // Katmanlı keyword modeli: core > supporting > broad. Bir keyword'ün
  // filmde bulunması ile filmin ANA temasını oluşturması farklı şeyler —
  // core ağır basar, supporting/broad yalnızca destek puanı verir.
  coreKeyword: number;
  supportingKeyword: number;
  broadKeyword: number;
  quality: number;
  popularity: number;
  penalty: number;
};

// Her grup içinde OR, gruplar arasında AND uygulanır: bir film, kabul
// edilmek için requiredGenreGroups dizisindeki HER gruptan en az bir
// türe (veya requiredKeywordGroups için en az bir keyword'e) sahip olmalı.
export type CineaCollection = {
  slug: string;
  title: string;
  shortDescription: string;
  longDescription: string;
  // Koleksiyon sayfasında "hangi zorunlu tema sinyalleri kullanıldı" bloğu
  // için genel dilde, doğru iddialarla sınırlı bir özet.
  themeSignalSummary: string;

  // Geniş aday havuzu için TMDB discover'a OR ile geçilen tür id'leri.
  // Tematik doğruluğu garanti etmez, yalnızca aday sayısını makul tutar.
  candidateGenreIds: number[];

  requiredGenreGroups?: number[][];
  optionalGenreIds?: number[];
  excludedGenreIds?: number[];

  requiredKeywordGroups?: number[][];
  optionalKeywordIds?: number[];
  excludedKeywordIds?: number[];

  // Katmanlı keyword modeli (requiredKeywordGroups'a alternatif, daha
  // ince ayarlı bir gate). Tanımlıysa: film kabul edilmek için ya en az
  // minimumCoreKeywordMatches kadar core keyword'e YA DA en az
  // minimumSupportingSignalMatches kadar supporting keyword'e sahip
  // olmalı. broadKeywordIds yalnızca skora küçük bir katkı sağlar, gate'e
  // dahil değildir. Bir koleksiyon bu alanları hiç tanımlamazsa bu gate
  // tamamen atlanır (requiredKeywordGroups tek başına yeterli kalır).
  coreKeywordIds?: number[];
  supportingKeywordIds?: number[];
  broadKeywordIds?: number[];
  minimumCoreKeywordMatches?: number;
  minimumSupportingSignalMatches?: number;

  // Sert dışlama (excludedGenreIds) yerine yumuşak bir ton cezası: film
  // reddedilmez ama scoringWeights.penalty kadar puan kaybeder. Yeterince
  // güçlü core sinyali olan bir film bu cezayı aşıp yine de kabul
  // edilebilir (ör. "Horror etiketli ama serial killer/murder
  // investigation sinyali güçlü" bir film).
  penalizedGenreIds?: number[];

  // Zorunlu grupların üzerine, toplam eşleşen sinyal sayısı için ek bir alt sınır.
  minimumThemeSignals?: number;
  minimumCollectionScore: number;
  scoringWeights: ScoringWeights;

  sortBy: MovieSort;
  voteCountMin: number;
  voteAverageMin: number;
  runtimeMin?: number;
  runtimeMax?: number;

  accent: CollectionAccent;
};

// TMDB'nin sabit film türü id'leri: https://developer.themoviedb.org/reference/genre-movie-list
const GENRE_IDS = {
  action: 28,
  adventure: 12,
  animation: 16,
  comedy: 35,
  crime: 80,
  drama: 18,
  family: 10751,
  history: 36,
  horror: 27,
  mystery: 9648,
  sciFi: 878,
  thriller: 53,
  war: 10752,
} as const;

// Doğrulanmış TMDB keyword id'leri artık tek kaynak olan lib/tmdbKeywords.ts
// içinde tutulur (Movie DNA katmanıyla paylaşılır). Buradaki isim, dosya
// genelinde minimum diff için korunuyor.
const KEYWORD_IDS = TMDB_KEYWORD_IDS;

const DEFAULT_SCORING_WEIGHTS: ScoringWeights = {
  requiredGenre: 20,
  optionalGenre: 5,
  requiredKeyword: 25,
  optionalKeyword: 8,
  coreKeyword: 30,
  supportingKeyword: 10,
  broadKeyword: 4,
  quality: 15,
  popularity: 10,
  penalty: 30,
};

export const CINEA_COLLECTIONS: CineaCollection[] = [
  {
    slug: "space-wars",
    title: "Uzay Savaşları",
    shortDescription:
      "Uzay, bilim kurgu, galaktik çatışma ve büyük ölçekli maceralar.",
    longDescription:
      "Bu koleksiyon bilim kurgu, macera ve galaktik çatışma temalarını birleştirir. Star Wars ve Star Trek benzeri, büyük ölçekli uzay maceraları arıyorsan buradasın.",
    themeSignalSummary:
      "Bilim kurgu türü zorunlu; ayrıca macera, aksiyon veya savaş türlerinden biri ve uzay/galaksi/uzay aracı temalı doğrulanmış bir anahtar kelime aranıyor.",
    candidateGenreIds: [
      GENRE_IDS.sciFi,
      GENRE_IDS.adventure,
      GENRE_IDS.action,
      GENRE_IDS.war,
    ],
    requiredGenreGroups: [
      [GENRE_IDS.sciFi],
      [GENRE_IDS.adventure, GENRE_IDS.action, GENRE_IDS.war],
    ],
    // Core: filmin gerçekten uzayda/galakside geçtiğini gösteren güçlü
    // sinyaller. Supporting: "alien invasion"/"spacecraft" gibi Dünya
    // üzerinde geçen bir aksiyon/canavar filminde de görülebilen, tek
    // başına yetersiz sinyaller (bkz. Predator, Pacific Rim incelemesi).
    coreKeywordIds: [
      KEYWORD_IDS.space,
      KEYWORD_IDS.spaceOpera,
      KEYWORD_IDS.spaceWar,
      KEYWORD_IDS.spaceBattle,
      KEYWORD_IDS.galaxy,
      KEYWORD_IDS.intergalacticWar,
    ],
    supportingKeywordIds: [
      KEYWORD_IDS.alienInvasion,
      KEYWORD_IDS.spacecraft,
      KEYWORD_IDS.alienCivilization,
    ],
    minimumCoreKeywordMatches: 1,
    minimumSupportingSignalMatches: 2,
    minimumCollectionScore: 45,
    scoringWeights: DEFAULT_SCORING_WEIGHTS,
    sortBy: "popularity.desc",
    voteCountMin: 50,
    voteAverageMin: 5.5,
    runtimeMin: 90,
    accent: "blue",
  },
  {
    slug: "mind-bending-sci-fi",
    title: "Zihin Büken Bilim Kurgu",
    shortDescription:
      "Gerçeklik algını sorgulatan, katmanlı bilim kurgu hikâyeleri.",
    longDescription:
      "Bu koleksiyon bilim kurgu, gizem, gerilim ve dram temalarını birleştirir. Seni düşündüren, gerçeklik algını sorgulatan filmler arıyorsan buradasın.",
    themeSignalSummary:
      "Bilim kurgu türü zorunlu; ayrıca gizem, gerilim veya dram türlerinden biri ve zaman/gerçeklik/hafıza/yapay zekâ temalı doğrulanmış bir anahtar kelime aranıyor.",
    candidateGenreIds: [
      GENRE_IDS.sciFi,
      GENRE_IDS.mystery,
      GENRE_IDS.thriller,
      GENRE_IDS.drama,
    ],
    requiredGenreGroups: [
      [GENRE_IDS.sciFi],
      [GENRE_IDS.mystery, GENRE_IDS.thriller, GENRE_IDS.drama],
    ],
    // Core: hikâyenin ANA yapısını gerçeklik/zaman/bilinç bükülmesi
    // üzerine kuran sinyaller. Supporting: time travel/AI/mind control
    // sıradan bir aksiyon filminde de geçebilir — tek başına "zihin
    // büken" bir anlatı garantilemez (bkz. Terminator 2 incelemesi).
    coreKeywordIds: [
      KEYWORD_IDS.simulatedReality,
      KEYWORD_IDS.timeLoop,
      KEYWORD_IDS.parallelWorld,
      KEYWORD_IDS.dreamWorld,
      KEYWORD_IDS.subconscious,
      KEYWORD_IDS.memory,
    ],
    supportingKeywordIds: [
      KEYWORD_IDS.timeTravel,
      KEYWORD_IDS.artificialIntelligence,
      KEYWORD_IDS.mindControl,
    ],
    minimumCoreKeywordMatches: 1,
    minimumSupportingSignalMatches: 2,
    minimumCollectionScore: 45,
    scoringWeights: DEFAULT_SCORING_WEIGHTS,
    sortBy: "vote_average.desc",
    voteCountMin: 50,
    voteAverageMin: 5.5,
    accent: "purple",
  },
  {
    slug: "dark-crime",
    title: "Karanlık Suç Hikâyeleri",
    shortDescription:
      "Suç, gerilim ve gizemin iç içe geçtiği karanlık hikâyeler.",
    longDescription:
      "Bu koleksiyon suç, gerilim, gizem ve dram temalarını birleştirir. Karanlık, sarsıcı ve gerçekçi suç hikâyeleri arıyorsan buradasın.",
    themeSignalSummary:
      "Suç türü zorunlu; ayrıca gerilim, gizem veya dram türlerinden biri ve organize suç/cinayet soruşturması/dedektif/neo-noir temalı doğrulanmış bir anahtar kelime aranıyor.",
    candidateGenreIds: [
      GENRE_IDS.crime,
      GENRE_IDS.thriller,
      GENRE_IDS.mystery,
      GENRE_IDS.drama,
    ],
    requiredGenreGroups: [
      [GENRE_IDS.crime],
      [GENRE_IDS.thriller, GENRE_IDS.mystery, GENRE_IDS.drama],
    ],
    // Core: filmin gerçekten bir suç dünyasını/soruşturmasını merkeze
    // aldığını gösteren güçlü sinyaller. Supporting: "detective" gibi
    // aile-dostu/genç dedektif yapımlarında da (Enola Holmes, Detective
    // Conan) görülebilen, tek başına yetersiz sinyaller.
    coreKeywordIds: [
      KEYWORD_IDS.organizedCrime,
      KEYWORD_IDS.mafia,
      KEYWORD_IDS.serialKiller,
      KEYWORD_IDS.policeCorruption,
      KEYWORD_IDS.murderInvestigation,
      KEYWORD_IDS.neoNoir,
      KEYWORD_IDS.criminalUnderworld,
    ],
    supportingKeywordIds: [
      KEYWORD_IDS.detective,
      KEYWORD_IDS.corruption,
      KEYWORD_IDS.heist,
      KEYWORD_IDS.gangster,
      KEYWORD_IDS.drugCartel,
    ],
    minimumCoreKeywordMatches: 1,
    minimumSupportingSignalMatches: 2,
    // Horror türü sert dışlama değil, yumuşak ceza: yeterince güçlü
    // core suç sinyali olan bir Horror/gerilim melezi (ör. gerçek bir
    // seri katil soruşturması içeren bir film) yine de kabul edilebilir;
    // yalnızca zayıf/destekleyici sinyali olan bir korku filmi elenir.
    penalizedGenreIds: [GENRE_IDS.horror],
    minimumCollectionScore: 40,
    scoringWeights: DEFAULT_SCORING_WEIGHTS,
    sortBy: "primary_release_date.desc",
    voteCountMin: 30,
    voteAverageMin: 5.5,
    accent: "red",
  },
  {
    slug: "survival-isolation",
    title: "Hayatta Kalma ve İzolasyon",
    shortDescription:
      "Yalnızlık, hayatta kalma mücadelesi ve sınırları zorlayan hikâyeler.",
    longDescription:
      "Bu koleksiyon gerilim, dram, macera ve bilim kurgu temalarını birleştirir. Karakterlerin hayatta kalmak için sınırlarını zorladığı hikâyeler arıyorsan buradasın.",
    themeSignalSummary:
      "Hayatta kalma/izolasyon/mahsur kalma temalı doğrulanmış bir anahtar kelime zorunlu; ayrıca gerilim, dram, macera veya bilim kurgu türlerinden biri aranıyor.",
    candidateGenreIds: [
      GENRE_IDS.thriller,
      GENRE_IDS.drama,
      GENRE_IDS.adventure,
      GENRE_IDS.sciFi,
    ],
    requiredGenreGroups: [
      [GENRE_IDS.thriller, GENRE_IDS.drama, GENRE_IDS.adventure, GENRE_IDS.sciFi],
    ],
    // Core: filmin ANA teması gerçekten hayatta kalma/izolasyon olduğunu
    // gösteren sinyaller. Supporting: "trapped"/"post-apocalyptic" gibi
    // yalnızca kısa bir alt-olay olarak da geçebilen, tek başına
    // yetersiz sinyaller (bkz. Toy Story 5'in eski "stranded" eşleşmesi).
    coreKeywordIds: [
      KEYWORD_IDS.survival,
      KEYWORD_IDS.isolation,
      KEYWORD_IDS.desertedIsland,
      KEYWORD_IDS.shipwreck,
      KEYWORD_IDS.castaway,
      KEYWORD_IDS.lostAtSea,
    ],
    supportingKeywordIds: [
      KEYWORD_IDS.wilderness,
      KEYWORD_IDS.trapped,
      KEYWORD_IDS.postApocalyptic,
    ],
    minimumCoreKeywordMatches: 1,
    minimumSupportingSignalMatches: 2,
    minimumCollectionScore: 35,
    scoringWeights: DEFAULT_SCORING_WEIGHTS,
    sortBy: "primary_release_date.desc",
    voteCountMin: 20,
    voteAverageMin: 5.5,
    accent: "green",
  },
  {
    slug: "historical-politics",
    title: "Tarihî Politik Gerilim",
    shortDescription:
      "Tarihin akışını değiştiren olaylar, güç mücadeleleri ve politik gerilim.",
    longDescription:
      "Bu koleksiyon tarih/savaş türü ile politika, iktidar mücadelesi, darbe, suikast veya casusluk temalı doğrulanmış anahtar kelimeleri birlikte arar. Yalnızca dram veya günlük hayat hikâyeleri bu koleksiyona girmez.",
    themeSignalSummary:
      "Tarih veya savaş türlerinden biri zorunlu; AYRICA politika, hükûmet, seçim, diktatörlük, devrim, casusluk, soğuk savaş, suikast veya darbe temalı doğrulanmış bir anahtar kelime zorunludur. Gerilim veya dram yalnızca destekleyici puan sağlar, tek başına yeterli değildir.",
    candidateGenreIds: [
      GENRE_IDS.history,
      GENRE_IDS.war,
      GENRE_IDS.drama,
      GENRE_IDS.thriller,
    ],
    requiredGenreGroups: [[GENRE_IDS.history, GENRE_IDS.war]],
    // Core: filmin bizzat politik gerilimi/iktidar mücadelesini konu
    // edindiğini gösteren sinyaller. Supporting: "espionage"/"cold war"/
    // "assassination" tek başlarına bir savaş/tarih filminde de geçebilir
    // (bkz. Courage Under Fire, K-19, Anonymous incelemesi) — politik
    // gerilim odağını garantilemez, en az iki tanesi birlikte gerekir.
    coreKeywordIds: [
      KEYWORD_IDS.politics,
      KEYWORD_IDS.politicalThriller,
      KEYWORD_IDS.politicalCorruption,
      KEYWORD_IDS.election,
      KEYWORD_IDS.dictatorship,
      KEYWORD_IDS.militaryDictatorship,
      KEYWORD_IDS.revolution,
      KEYWORD_IDS.coup,
      KEYWORD_IDS.militaryCoup,
      KEYWORD_IDS.warAndPolitics,
      KEYWORD_IDS.watergateScandal,
      KEYWORD_IDS.politicalAssassination,
      KEYWORD_IDS.britishPolitics,
    ],
    supportingKeywordIds: [
      KEYWORD_IDS.government,
      KEYWORD_IDS.espionage,
      KEYWORD_IDS.coldWar,
      KEYWORD_IDS.assassination,
    ],
    minimumCoreKeywordMatches: 1,
    minimumSupportingSignalMatches: 2,
    // Yalnızca puan katkısı sağlar; History/War + politik keyword şartını
    // sağlamayan bir film (ör. The Intouchables gibi salt dram/komedi)
    // bu türlerle asla kabul edilmez.
    optionalGenreIds: [GENRE_IDS.thriller, GENRE_IDS.drama],
    minimumCollectionScore: 35,
    scoringWeights: DEFAULT_SCORING_WEIGHTS,
    sortBy: "popularity.desc",
    voteCountMin: 20,
    voteAverageMin: 5.5,
    accent: "amber",
  },
  {
    slug: "family-adventure",
    title: "Aileyle İzlemelik Macera",
    shortDescription:
      "Her yaştan izleyiciye uygun, sıcak ve eğlenceli macera filmleri.",
    longDescription:
      "Bu koleksiyon aile veya animasyon türü ile macera ya da komedi türünü birlikte arar. Korku, savaş ve suç temalı filmler bilinçli olarak dışlanmıştır.",
    themeSignalSummary:
      "Aile veya animasyon türlerinden biri zorunlu; ayrıca macera veya komedi türlerinden biri aranıyor. Korku, savaş ve suç türleri kesin olarak dışlanıyor.",
    candidateGenreIds: [
      GENRE_IDS.family,
      GENRE_IDS.animation,
      GENRE_IDS.adventure,
      GENRE_IDS.comedy,
    ],
    requiredGenreGroups: [
      [GENRE_IDS.family, GENRE_IDS.animation],
      [GENRE_IDS.adventure, GENRE_IDS.comedy],
    ],
    optionalKeywordIds: [
      KEYWORD_IDS.familyAdventures,
      KEYWORD_IDS.talkingAnimal,
      KEYWORD_IDS.magicalCreature,
      KEYWORD_IDS.basedOnChildrensBook,
      KEYWORD_IDS.familyRelationships,
      KEYWORD_IDS.friendship,
    ],
    excludedGenreIds: [GENRE_IDS.horror, GENRE_IDS.war, GENRE_IDS.crime],
    minimumCollectionScore: 15,
    scoringWeights: DEFAULT_SCORING_WEIGHTS,
    sortBy: "popularity.desc",
    voteCountMin: 30,
    voteAverageMin: 5,
    runtimeMax: 110,
    accent: "cyan",
  },
];

export function getCollectionBySlug(
  slug: string
): CineaCollection | undefined {
  return CINEA_COLLECTIONS.find((collection) => collection.slug === slug);
}
