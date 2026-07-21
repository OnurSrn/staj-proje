import { getMovieDetails, getMovieKeywords } from "@/lib/tmdb";
import { TMDB_KEYWORD_IDS } from "@/lib/tmdbKeywords";

export type MovieDnaCategory =
  | "themes"
  | "settings"
  | "narrative"
  | "tone"
  | "concepts";

export type MovieDnaSignal = {
  id: string;
  label: string;
  category: MovieDnaCategory;
  keywordIds: number[];
  weight: number;
};

export type MovieDnaProfile = {
  movieId: number;
  genreIds: number[];
  keywordIds: number[];
  signals: {
    themes: string[];
    settings: string[];
    narrative: string[];
    tone: string[];
    concepts: string[];
  };
  signalScores: Record<string, number>;
};

export type BuildMovieDnaProfileOptions = {
  movieId: number;
  genreIds: number[];
  keywordIds: number[];
};

// Doğrulanmış Movie DNA sinyal sözlüğü. Yalnızca lib/tmdbKeywords.ts
// içindeki, koleksiyon motorunda anchor filmlerle çapraz doğrulanmış
// keyword id'leri kullanılır — yeni/rastgele bir id burada uydurulmaz.
//
// weight ölçeği (koleksiyon motorundaki core/supporting katmanlamasıyla
// aynı mantık): 3 = sinyalin ana/çekirdek göstergesi, 2 = orta güçte
// destekleyici gösterge, 1 = tek başına zayıf/çok genel gösterge (aynı
// keyword başka bir sinyalin de çekirdeği olabilir; bu durumda burada
// bilinçli olarak düşük ağırlıkla ikincil bir sinyal üretir).
//
// Bazı görev örneklerinde adı geçen sinyaller ("battlefield" gibi)
// kasıtlı olarak dışarıda bırakıldı çünkü koleksiyon motorunda
// doğrulanmış, o sinyali gerçekten temsil eden ayrı bir keyword yok —
// var olmayan bir sinyali zorlamak yerine sözlükten çıkarıldı.
// Dışa açılıyor: lib/tasteProfile.ts, sinyal id'lerini kullanıcıya
// gösterilebilir label/category bilgisine çevirmek için bu sözlüğü
// kullanır (yeni bir kopya/mapping oluşturmaz, tek kaynağı paylaşır).
export const MOVIE_DNA_SIGNALS: MovieDnaSignal[] = [
  // --- themes ---
  {
    id: "survival",
    label: "Hayatta Kalma",
    category: "themes",
    keywordIds: [TMDB_KEYWORD_IDS.survival],
    weight: 3,
  },
  {
    id: "politics",
    label: "Politika",
    category: "themes",
    keywordIds: [TMDB_KEYWORD_IDS.politics, TMDB_KEYWORD_IDS.politicalThriller],
    weight: 3,
  },
  {
    id: "friendship",
    label: "Dostluk",
    category: "themes",
    // Çok genel bir keyword (birçok tür/filmde geçebilir) -> düşük ağırlık.
    keywordIds: [TMDB_KEYWORD_IDS.friendship],
    weight: 1,
  },
  {
    id: "crime",
    label: "Suç",
    category: "themes",
    keywordIds: [TMDB_KEYWORD_IDS.organizedCrime, TMDB_KEYWORD_IDS.gangster],
    weight: 3,
  },
  {
    id: "family",
    label: "Aile",
    category: "themes",
    keywordIds: [TMDB_KEYWORD_IDS.familyRelationships],
    weight: 2,
  },
  {
    id: "war",
    label: "Savaş",
    category: "themes",
    // Doğrulanmış tek genel "savaş" keyword'ü yok; yalnızca savaş+politika
    // bileşik sinyali (historical-politics'te doğrulandı) mevcut, bu yüzden
    // orta ağırlık.
    keywordIds: [TMDB_KEYWORD_IDS.warAndPolitics],
    weight: 2,
  },
  {
    id: "corruption",
    label: "Yolsuzluk",
    category: "themes",
    keywordIds: [
      TMDB_KEYWORD_IDS.corruption,
      TMDB_KEYWORD_IDS.policeCorruption,
      TMDB_KEYWORD_IDS.politicalCorruption,
    ],
    weight: 2,
  },
  {
    id: "investigation",
    label: "Soruşturma",
    category: "themes",
    keywordIds: [TMDB_KEYWORD_IDS.murderInvestigation],
    weight: 3,
  },

  // --- settings ---
  {
    id: "outer-space",
    label: "Uzay",
    category: "settings",
    keywordIds: [
      TMDB_KEYWORD_IDS.space,
      TMDB_KEYWORD_IDS.galaxy,
      TMDB_KEYWORD_IDS.spacecraft,
    ],
    weight: 3,
  },
  {
    id: "wilderness",
    label: "Vahşi Doğa",
    category: "settings",
    keywordIds: [TMDB_KEYWORD_IDS.wilderness],
    weight: 2,
  },
  {
    id: "deserted-island",
    label: "Issız Ada",
    category: "settings",
    keywordIds: [
      TMDB_KEYWORD_IDS.desertedIsland,
      TMDB_KEYWORD_IDS.castaway,
      TMDB_KEYWORD_IDS.shipwreck,
      TMDB_KEYWORD_IDS.lostAtSea,
    ],
    weight: 3,
  },
  {
    id: "criminal-underworld",
    label: "Suç Dünyası",
    category: "settings",
    keywordIds: [TMDB_KEYWORD_IDS.criminalUnderworld],
    weight: 3,
  },
  {
    id: "government",
    label: "Devlet/Hükûmet",
    category: "settings",
    keywordIds: [TMDB_KEYWORD_IDS.government],
    weight: 2,
  },

  // --- narrative ---
  {
    id: "time-loop",
    label: "Zaman Döngüsü",
    category: "narrative",
    keywordIds: [TMDB_KEYWORD_IDS.timeLoop],
    weight: 3,
  },
  {
    id: "time-travel",
    label: "Zaman Yolculuğu",
    category: "narrative",
    // collectionEngine'de supporting katmanda: tek başına "zihin büken"
    // bir anlatı garantilemez (bkz. lib/cineaCollections.ts yorumu).
    keywordIds: [TMDB_KEYWORD_IDS.timeTravel],
    weight: 2,
  },
  {
    id: "parallel-world",
    label: "Paralel Dünya",
    category: "narrative",
    keywordIds: [TMDB_KEYWORD_IDS.parallelWorld],
    weight: 3,
  },
  {
    id: "simulated-reality",
    label: "Simüle Edilmiş Gerçeklik",
    category: "narrative",
    keywordIds: [TMDB_KEYWORD_IDS.simulatedReality],
    weight: 3,
  },
  {
    id: "dream-world",
    label: "Rüya Dünyası",
    category: "narrative",
    keywordIds: [TMDB_KEYWORD_IDS.dreamWorld],
    weight: 3,
  },
  {
    id: "subconscious",
    label: "Bilinçaltı",
    category: "narrative",
    keywordIds: [TMDB_KEYWORD_IDS.subconscious],
    weight: 2,
  },
  {
    id: "memory-focused",
    label: "Hafıza Odaklı",
    category: "narrative",
    keywordIds: [TMDB_KEYWORD_IDS.memory],
    weight: 2,
  },
  {
    id: "detective-investigation",
    label: "Dedektif Soruşturması",
    category: "narrative",
    // Tek başına zayıf sinyal (bkz. Enola Holmes gibi aile-dostu
    // yapımlarda da geçer) -> düşük ağırlık.
    keywordIds: [TMDB_KEYWORD_IDS.detective],
    weight: 1,
  },

  // --- tone ---
  {
    id: "dark",
    label: "Karanlık",
    category: "tone",
    keywordIds: [TMDB_KEYWORD_IDS.neoNoir, TMDB_KEYWORD_IDS.serialKiller],
    weight: 2,
  },
  {
    id: "emotional",
    label: "Duygusal",
    category: "tone",
    // Hayatta kalma/izolasyon anlatıları genelde duygusal ağırlıklıdır;
    // aynı keyword'ler "survival"/"isolation" sinyallerinin de çekirdeği
    // olduğu için burada bilinçli olarak düşük ağırlıklı ikincil bir
    // sinyal olarak tekrar kullanılıyor.
    keywordIds: [
      TMDB_KEYWORD_IDS.survival,
      TMDB_KEYWORD_IDS.isolation,
      TMDB_KEYWORD_IDS.castaway,
      TMDB_KEYWORD_IDS.desertedIsland,
    ],
    weight: 1,
  },
  {
    id: "adventurous",
    label: "Maceracı",
    category: "tone",
    keywordIds: [TMDB_KEYWORD_IDS.familyAdventures, TMDB_KEYWORD_IDS.spaceOpera],
    weight: 1,
  },
  {
    id: "suspenseful",
    label: "Gerilim Dolu",
    category: "tone",
    keywordIds: [TMDB_KEYWORD_IDS.politicalThriller],
    weight: 1,
  },
  {
    id: "family-friendly",
    label: "Aile Dostu",
    category: "tone",
    keywordIds: [
      TMDB_KEYWORD_IDS.familyAdventures,
      TMDB_KEYWORD_IDS.talkingAnimal,
      TMDB_KEYWORD_IDS.basedOnChildrensBook,
    ],
    weight: 2,
  },
  {
    id: "mind-bending",
    label: "Zihin Büken",
    category: "tone",
    keywordIds: [
      TMDB_KEYWORD_IDS.simulatedReality,
      TMDB_KEYWORD_IDS.timeLoop,
      TMDB_KEYWORD_IDS.parallelWorld,
      TMDB_KEYWORD_IDS.dreamWorld,
      TMDB_KEYWORD_IDS.subconscious,
      TMDB_KEYWORD_IDS.mindControl,
    ],
    weight: 3,
  },

  // --- concepts ---
  {
    id: "artificial-intelligence",
    label: "Yapay Zekâ",
    category: "concepts",
    keywordIds: [TMDB_KEYWORD_IDS.artificialIntelligence],
    weight: 3,
  },
  {
    id: "alien-civilization",
    label: "Uzaylı Medeniyeti",
    category: "concepts",
    keywordIds: [TMDB_KEYWORD_IDS.alienCivilization, TMDB_KEYWORD_IDS.alienInvasion],
    weight: 2,
  },
  {
    id: "space-opera",
    label: "Uzay Operası",
    category: "concepts",
    keywordIds: [
      TMDB_KEYWORD_IDS.spaceOpera,
      TMDB_KEYWORD_IDS.spaceBattle,
      TMDB_KEYWORD_IDS.intergalacticWar,
      TMDB_KEYWORD_IDS.spaceWar,
      TMDB_KEYWORD_IDS.galaxy,
      TMDB_KEYWORD_IDS.space,
    ],
    weight: 3,
  },
  {
    id: "political-conspiracy",
    label: "Politik Komplo",
    category: "concepts",
    keywordIds: [
      TMDB_KEYWORD_IDS.politicalCorruption,
      TMDB_KEYWORD_IDS.watergateScandal,
      TMDB_KEYWORD_IDS.coup,
      TMDB_KEYWORD_IDS.militaryCoup,
    ],
    weight: 3,
  },
  {
    id: "organized-crime",
    label: "Organize Suç",
    category: "concepts",
    keywordIds: [
      TMDB_KEYWORD_IDS.organizedCrime,
      TMDB_KEYWORD_IDS.mafia,
      TMDB_KEYWORD_IDS.gangster,
      TMDB_KEYWORD_IDS.drugCartel,
      TMDB_KEYWORD_IDS.criminalUnderworld,
    ],
    weight: 3,
  },
  {
    id: "isolation",
    label: "İzolasyon",
    category: "concepts",
    keywordIds: [
      TMDB_KEYWORD_IDS.isolation,
      TMDB_KEYWORD_IDS.desertedIsland,
      TMDB_KEYWORD_IDS.castaway,
      TMDB_KEYWORD_IDS.lostAtSea,
      TMDB_KEYWORD_IDS.shipwreck,
      TMDB_KEYWORD_IDS.wilderness,
      TMDB_KEYWORD_IDS.stranded,
      TMDB_KEYWORD_IDS.trapped,
      TMDB_KEYWORD_IDS.postApocalyptic,
    ],
    weight: 3,
  },
];

// Modül yüklenirken bir kez kurulur (her render'da yeniden kurulmaz).
// keywordId -> o keyword'ün katkı sağladığı sinyaller. Bir film için
// yalnızca o filmin (genelde 5-20 arası) keyword'leri üzerinden gezinmeyi
// sağlar; tüm sinyal sözlüğünü taramaya gerek kalmaz.
const KEYWORD_ID_TO_SIGNALS: ReadonlyMap<number, readonly MovieDnaSignal[]> =
  (() => {
    const index = new Map<number, MovieDnaSignal[]>();

    for (const signal of MOVIE_DNA_SIGNALS) {
      for (const keywordId of signal.keywordIds) {
        const existing = index.get(keywordId);

        if (existing) {
          existing.push(signal);
        } else {
          index.set(keywordId, [signal]);
        }
      }
    }

    return index;
  })();

function createEmptySignalGroups(): MovieDnaProfile["signals"] {
  return {
    themes: [],
    settings: [],
    narrative: [],
    tone: [],
    concepts: [],
  };
}

/**
 * Bir filmin genre/keyword id'lerinden Movie DNA profilini üretir. Saf bir
 * fonksiyondur: TMDB fetch içermez, aynı girdi için her zaman aynı çıktıyı
 * üretir. Eşleşme yoksa boş ama geçerli bir profil döner.
 */
export function buildMovieDnaProfile(
  options: BuildMovieDnaProfileOptions
): MovieDnaProfile {
  const { movieId, genreIds, keywordIds } = options;

  const matchCounts = new Map<string, number>();

  for (const keywordId of keywordIds) {
    const matchedSignals = KEYWORD_ID_TO_SIGNALS.get(keywordId);

    if (!matchedSignals) {
      continue;
    }

    for (const signal of matchedSignals) {
      matchCounts.set(signal.id, (matchCounts.get(signal.id) ?? 0) + 1);
    }
  }

  const signals = createEmptySignalGroups();
  const signalScores: Record<string, number> = {};

  for (const signal of MOVIE_DNA_SIGNALS) {
    const matchCount = matchCounts.get(signal.id);

    if (!matchCount) {
      continue;
    }

    signals[signal.category].push(signal.id);
    signalScores[signal.id] = matchCount * signal.weight;
  }

  return {
    movieId,
    genreIds: [...genreIds],
    keywordIds: [...keywordIds],
    signals,
    signalScores,
  };
}

/**
 * buildMovieDnaProfile için TMDB'den veri çeken ince bir yardımcı.
 * Film detayları (genre'lar için) ve keyword'ler paralel çekilir; ikisi de
 * lib/tmdb.ts'in mevcut Next.js fetch cache stratejisini (revalidate)
 * kullanır — burada ek bir cache katmanı kurulmaz. Zaten film detaylarını
 * elinde bulunduran çağıranlar (ör. film detay sayfası) bu fonksiyon yerine
 * doğrudan buildMovieDnaProfile'ı kullanarak gereksiz ikinci bir
 * getMovieDetails çağrısından kaçınmalıdır.
 */
export async function getMovieDnaProfile(
  movieId: number
): Promise<MovieDnaProfile> {
  const [movie, keywords] = await Promise.all([
    getMovieDetails(String(movieId)),
    getMovieKeywords(movieId),
  ]);

  return buildMovieDnaProfile({
    movieId,
    genreIds: movie.genres.map((genre) => genre.id),
    keywordIds: keywords.map((keyword) => keyword.id),
  });
}
