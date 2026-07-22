const TMDB_BASE_URL = "https://api.themoviedb.org/3";

export class TmdbNotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TmdbNotFoundError";
  }
}

export type TmdbMovie = {
  id: number;
  title: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date: string;
  vote_average: number;
  vote_count: number;
  popularity: number;
};

// original_title, TMDB'nin temel film nesnesinde her zaman bulunur ama
// yalnızca öneri motorunun (RecommendationMovie) ihtiyaç duyduğu bir alan
// olduğu için TmdbMovie'ye değil, doğrudan MovieDetails'e ekleniyor.

export type MovieGenre = {
  id: number;
  name: string;
};

export type MovieCastMember = {
  id: number;
  name: string;
  character: string;
  profile_path: string | null;
  order: number;
};

export type MovieCrewMember = {
  id: number;
  name: string;
  job: string;
  department: string;
  profile_path: string | null;
};

export type MovieVideo = {
  id: string;
  key: string;
  name: string;
  site: string;
  type: string;
  official: boolean;
};

export type ProductionCompany = {
  id: number;
  name: string;
  logo_path: string | null;
  origin_country: string;
};

// TMDB movie details yanıtındaki belongs_to_collection alanının kısaltılmış
// referansı — collection'ın kendi film listesini (parts) İÇERMEZ, yalnızca
// hangi collection'a ait olduğunu gösterir. Diğer filmleri almak için ayrıca
// getCollectionDetails çağrılmalı.
export type TmdbCollectionReference = {
  id: number;
  name: string;
  poster_path: string | null;
  backdrop_path: string | null;
};

export type MovieDetails = TmdbMovie & {
  runtime: number | null;
  tagline: string;
  original_title: string;
  original_language: string;
  origin_country: string[];
  genres: MovieGenre[];
  production_companies: ProductionCompany[];
  belongs_to_collection: TmdbCollectionReference | null;
  credits: {
    cast: MovieCastMember[];
    crew: MovieCrewMember[];
  };
  videos: {
    results: MovieVideo[];
  };
  recommendations: {
    results: TmdbMovie[];
  };
  // TMDB film uç noktasında keywords alt-kaynağı "results" değil "keywords"
  // altında döner (TV uç noktasından farklı).
  keywords: {
    keywords: MovieKeyword[];
  };
};

// TMDB /collection/{id} yanıtı — yalnızca kullandığımız alanlar tip
// güvenliğine alınır, geri kalan ham alanlar client'a hiç taşınmaz.
export type TmdbCollectionDetails = {
  id: number;
  name: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  parts: TmdbMovie[];
};

export type MovieCategory =
  | "popular"
  | "top-rated"
  | "now-playing"
  | "upcoming";

export type MovieSort =
  | "popularity.desc"
  | "vote_average.desc"
  | "primary_release_date.desc";

export type MovieListResponse = {
  page: number;
  results: TmdbMovie[];
  total_pages: number;
  total_results: number;
};

export type Mood =
  | "fun"
  | "exciting"
  | "emotional"
  | "dark"
  | "cozy"
  | "thoughtful";

export type RuntimePreference = "short" | "medium" | "long" | "any";

export type Intensity = "light" | "balanced" | "intense";

export type Company = "alone" | "friends" | "family" | "partner";

export type Discovery = "safe" | "balanced" | "different";

export type WhatToWatchOptions = {
  mood: Mood;
  runtime: RuntimePreference;
  intensity: Intensity;
  company: Company;
  discovery: Discovery;
  genreId: number;
  page?: number;
};

// Koleksiyon "geniş aday havuzu" sorgusu: yalnızca OR mantığıyla kaba bir
// ön eleme yapar. Tematik doğruluk (AND grupları, keyword şartları) bu
// sonuçlar üzerinde lib/collectionEngine.ts tarafından ayrıca uygulanır.
export type CollectionCandidateOptions = {
  candidateGenreIds: number[];
  candidateKeywordIds?: number[];
  excludedGenreIds?: number[];
  sortBy: MovieSort;
  voteCountMin: number;
  voteAverageMin: number;
  runtimeMin?: number;
  runtimeMax?: number;
  // Öneri motorunun "explicit tercih" havuzu (favori oyuncu/yönetmen/
  // stüdyo) için — koleksiyon motoru bu alanları hiç kullanmaz, geriye
  // dönük uyumluluğu bozmaz.
  castId?: number;
  crewId?: number;
  companyId?: number;
};

// discover/movie yanıtı, MovieDetails'in aksine tam "genres" nesnesi
// değil, sayısal "genre_ids" dizisi döndürür — koleksiyon motoru
// puanlama için bu alana ihtiyaç duyar.
export type CollectionCandidateMovie = TmdbMovie & {
  genre_ids: number[];
};

export type CollectionCandidateListResponse = {
  page: number;
  results: CollectionCandidateMovie[];
  total_pages: number;
  total_results: number;
};

export type MovieKeyword = {
  id: number;
  name: string;
};

type MovieKeywordsResponse = {
  keywords: MovieKeyword[];
};

export type PersonKnownForItem = {
  id: number;
  media_type: string;
  title?: string;
  name?: string;
};

export type PersonSearchResult = {
  id: number;
  name: string;
  profile_path: string | null;
  known_for_department: string | null;
  known_for: PersonKnownForItem[];
};

export type PersonSearchResponse = {
  page: number;
  results: PersonSearchResult[];
  total_pages: number;
  total_results: number;
};

export type CompanySearchResult = {
  id: number;
  name: string;
  logo_path: string | null;
  origin_country: string | null;
};

export type CompanySearchResponse = {
  page: number;
  results: CompanySearchResult[];
  total_pages: number;
  total_results: number;
};

// TMDB /person/{id} external_ids yalnızca gerçekten döndürdüğü alanlar
// desteklenir — tiktok_id/youtube_id bazı kişilerde bulunmayabileceği için
// opsiyonel bırakılır.
export type PersonExternalIds = {
  imdb_id: string | null;
  facebook_id: string | null;
  instagram_id: string | null;
  twitter_id: string | null;
  tiktok_id?: string | null;
  youtube_id?: string | null;
};

export type PersonDetails = {
  id: number;
  name: string;
  biography: string;
  birthday: string | null;
  deathday: string | null;
  place_of_birth: string | null;
  known_for_department: string;
  profile_path: string | null;
  external_ids: PersonExternalIds | null;
};

export type PersonMovieCredit = {
  id: number;
  title: string;
  character: string;
  overview: string;
  poster_path: string | null;
  release_date: string;
  vote_average: number;
  vote_count: number;
  popularity: number;
};

export type PersonMovieCrewCredit = {
  id: number;
  title: string;
  job: string;
  department: string;
  overview: string;
  poster_path: string | null;
  release_date: string;
  vote_average: number;
  vote_count: number;
  popularity: number;
};

export type PersonMovieCredits = {
  cast: PersonMovieCredit[];
  crew: PersonMovieCrewCredit[];
};

type PersonMovieCreditsResponse = {
  cast: PersonMovieCredit[];
  crew: PersonMovieCrewCredit[];
};

type MovieGenresResponse = {
  genres: MovieGenre[];
};

function getApiKey(): string {
  const apiKey = process.env.TMDB_API_KEY;

  if (!apiKey) {
    throw new Error("TMDB_API_KEY bulunamadı.");
  }

  return apiKey;
}

function getCategoryEndpoint(category: MovieCategory): string {
  const endpoints: Record<MovieCategory, string> = {
    popular: "popular",
    "top-rated": "top_rated",
    "now-playing": "now_playing",
    upcoming: "upcoming",
  };

  return endpoints[category];
}

export async function getMoviesByCategory(
  category: MovieCategory = "popular",
  page = 1
): Promise<MovieListResponse> {
  const apiKey = getApiKey();
  const safePage = Math.max(1, Math.min(page, 500));

  if (category === "popular") {
    const today = new Date();
    const oneYearAgo = new Date(today);

    oneYearAgo.setFullYear(today.getFullYear() - 1);

    const todayString = today.toISOString().split("T")[0];
    const oneYearAgoString = oneYearAgo.toISOString().split("T")[0];

    const params = new URLSearchParams({
      api_key: apiKey,
      language: "en-US",
      page: safePage.toString(),
      sort_by: "popularity.desc",
      include_adult: "false",
      include_video: "false",
      "primary_release_date.gte": oneYearAgoString,
      "primary_release_date.lte": todayString,
      "vote_count.gte": "100",
    });

    const response = await fetch(
      `${TMDB_BASE_URL}/discover/movie?${params.toString()}`,
      {
        next: {
          revalidate: 3600,
        },
      }
    );

    if (!response.ok) {
      throw new Error(
        `Popüler filmler alınamadı. Hata kodu: ${response.status}`
      );
    }

    return response.json();
  }

  if (category === "upcoming") {
    const today = new Date();
    const tomorrow = new Date(today);
    const sixMonthsLater = new Date(today);

    tomorrow.setDate(today.getDate() + 1);
    sixMonthsLater.setMonth(today.getMonth() + 6);

    const tomorrowString = tomorrow.toISOString().split("T")[0];
    const sixMonthsLaterString = sixMonthsLater
      .toISOString()
      .split("T")[0];

    const params = new URLSearchParams({
      api_key: apiKey,
      language: "en-US",
      page: safePage.toString(),
      sort_by: "primary_release_date.asc",
      include_adult: "false",
      include_video: "false",
      "primary_release_date.gte": tomorrowString,
      "primary_release_date.lte": sixMonthsLaterString,
      "vote_count.gte": "0",
    });

    const response = await fetch(
      `${TMDB_BASE_URL}/discover/movie?${params.toString()}`,
      {
        next: {
          revalidate: 3600,
        },
      }
    );

    if (!response.ok) {
      throw new Error(
        `Yakında gelecek filmler alınamadı. Hata kodu: ${response.status}`
      );
    }

    return response.json();
  }

  if (category === "now-playing") {
    const today = new Date();
    const fortyFiveDaysAgo = new Date(today);

    fortyFiveDaysAgo.setDate(today.getDate() - 45);

    const todayString = today.toISOString().split("T")[0];
    const fortyFiveDaysAgoString = fortyFiveDaysAgo
      .toISOString()
      .split("T")[0];

    const params = new URLSearchParams({
      api_key: apiKey,
      language: "en-US",
      page: safePage.toString(),
      sort_by: "popularity.desc",
      include_adult: "false",
      include_video: "false",
      "primary_release_date.gte": fortyFiveDaysAgoString,
      "primary_release_date.lte": todayString,
      "vote_count.gte": "20",
    });

    const response = await fetch(
      `${TMDB_BASE_URL}/discover/movie?${params.toString()}`,
      {
        next: {
          revalidate: 3600,
        },
      }
    );

    if (!response.ok) {
      throw new Error(
        `Gösterimdeki filmler alınamadı. Hata kodu: ${response.status}`
      );
    }

    return response.json();
  }

  const endpoint = getCategoryEndpoint(category);

  const response = await fetch(
    `${TMDB_BASE_URL}/movie/${endpoint}?api_key=${apiKey}&language=en-US&page=${safePage}`,
    {
      next: {
        revalidate: 3600,
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Filmler alınamadı. Hata kodu: ${response.status}`);
  }

  return response.json();
}

export async function discoverMovies(
  genreId: number,
  sortBy: MovieSort,
  page = 1
): Promise<MovieListResponse> {
  const apiKey = getApiKey();
  const safePage = Math.max(1, Math.min(page, 500));
  const today = new Date().toISOString().split("T")[0];

  const params = new URLSearchParams({
    api_key: apiKey,
    language: "en-US",
    page: safePage.toString(),
    sort_by: sortBy,
    include_adult: "false",
    include_video: "false",
  });

  if (genreId > 0) {
    params.set("with_genres", genreId.toString());
  }

  if (sortBy === "vote_average.desc") {
    params.set("vote_count.gte", "200");
    params.set("primary_release_date.lte", today);
  }

  if (sortBy === "primary_release_date.desc") {
    params.set("primary_release_date.lte", today);
    params.set("vote_count.gte", "20");
  }

  const response = await fetch(
    `${TMDB_BASE_URL}/discover/movie?${params.toString()}`,
    {
      next: {
        revalidate: 3600,
      },
    }
  );

  if (!response.ok) {
    throw new Error(
      `Filmler filtrelenemedi. Hata kodu: ${response.status}`
    );
  }

  return response.json();
}

type MoodConfig = {
  genreIds: number[];
  minVoteAverage: number;
};

// TMDB'nin sabit film türü id'leri: https://developer.themoviedb.org/reference/genre-movie-list
const GENRE_IDS = {
  action: 28,
  adventure: 12,
  animation: 16,
  comedy: 35,
  crime: 80,
  documentary: 99,
  drama: 18,
  family: 10751,
  horror: 27,
  mystery: 9648,
  romance: 10749,
  sciFi: 878,
  thriller: 53,
  war: 10752,
} as const;

// Bu eşleştirmeler kesin kurallar değil, açıklanabilir bir başlangıç noktasıdır.
const MOOD_CONFIG: Record<Mood, MoodConfig> = {
  fun: {
    genreIds: [GENRE_IDS.comedy, GENRE_IDS.adventure],
    minVoteAverage: 6,
  },
  exciting: {
    genreIds: [GENRE_IDS.action, GENRE_IDS.thriller, GENRE_IDS.adventure],
    minVoteAverage: 6,
  },
  emotional: {
    genreIds: [GENRE_IDS.drama, GENRE_IDS.romance],
    minVoteAverage: 6,
  },
  dark: {
    genreIds: [
      GENRE_IDS.thriller,
      GENRE_IDS.crime,
      GENRE_IDS.horror,
      GENRE_IDS.mystery,
    ],
    minVoteAverage: 6,
  },
  cozy: {
    genreIds: [GENRE_IDS.comedy, GENRE_IDS.family, GENRE_IDS.animation],
    minVoteAverage: 5.5,
  },
  thoughtful: {
    genreIds: [
      GENRE_IDS.sciFi,
      GENRE_IDS.drama,
      GENRE_IDS.mystery,
      GENRE_IDS.documentary,
    ],
    minVoteAverage: 6.5,
  },
};

// Yoğunluk "hafif" olduğunda mood'un getirdiği ağır türler zorunlu kılınmasın.
const HEAVY_GENRE_IDS: number[] = [GENRE_IDS.horror, GENRE_IDS.war];

// Yoğunluk "yoğun" olduğunda bu türlere ek ağırlık verilebilir.
const INTENSE_GENRE_IDS: number[] = [
  GENRE_IDS.drama,
  GENRE_IDS.thriller,
  GENRE_IDS.mystery,
  GENRE_IDS.sciFi,
];

type CompanyConfig = {
  excludeGenreIds: number[];
  // company'nin tercih ettiği sıralama. discovery zaten kendi sıralama
  // niyetini belirlediğinde ("different" -> recency) bu ezilmez; yalnızca
  // popularity tabanlı safe/balanced durumlarında devreye girer.
  preferredSortBy: MovieSort | null;
  // company burada eşikleri ikincil bir sinyal olarak kaydırır — mood'un
  // belirlediği aday havuzunu (with_genres) değiştirmez, yalnızca o havuz
  // içindeki hangi filmlerin öne çıkacağını etkiler.
  voteCountMinModifier: number;
  voteAverageModifier: number;
};

// ÖNEMLİ: company burada ARTIK bir genreIds listesi taşımıyor. Eskiden
// company türleri mood türleriyle OR mantığıyla birleşip aday havuzunu
// (with_genres) genişletiyordu — bu da örneğin "exciting" (action/
// thriller/adventure) + "partner" (romance/comedy/drama) kombinasyonunda
// The Shawshank Redemption gibi mood'a uymayan genel dramaların üst
// sıralara sızmasına yol açıyordu. Mood tek başına aday havuzunu belirler
// (bkz. getWhatToWatchRecommendations); company yalnızca o havuz içinde
// sort_by / vote_count.gte / vote_average.gte üzerinden ağırlıklandırma
// yapabilir. family'nin without_genres dışlaması bir güvenlik önlemi
// olduğu için korunuyor (rule 5). partner için sert bir War dışlaması
// eklemiyoruz: War hiçbir MOOD_CONFIG'in ana türü olmasa da "exciting"/
// "dark" gibi havuzlarda action/thriller ile birlikte etiketlenmiş
// filmleri (ör. savaş gerilimleri) haksız yere eleyebilirdi — bunun
// yerine yalnızca vote_average.desc sıralaması ile yumuşak bir etki
// bırakıyoruz.
const COMPANY_CONFIG: Record<Company, CompanyConfig> = {
  alone: {
    excludeGenreIds: [],
    preferredSortBy: null,
    voteCountMinModifier: 0,
    voteAverageModifier: 0,
  },
  friends: {
    excludeGenreIds: [],
    preferredSortBy: "popularity.desc",
    voteCountMinModifier: 150,
    voteAverageModifier: 0,
  },
  family: {
    excludeGenreIds: [GENRE_IDS.horror, GENRE_IDS.crime, GENRE_IDS.war],
    preferredSortBy: null,
    voteCountMinModifier: 0,
    voteAverageModifier: 0,
  },
  partner: {
    excludeGenreIds: [],
    preferredSortBy: "vote_average.desc",
    voteCountMinModifier: -30,
    voteAverageModifier: 0.5,
  },
};

export async function getWhatToWatchRecommendations(
  options: WhatToWatchOptions
): Promise<MovieListResponse> {
  const apiKey = getApiKey();
  const safePage = Math.max(1, Math.min(options.page ?? 1, 500));
  const today = new Date().toISOString().split("T")[0];

  const moodConfig = MOOD_CONFIG[options.mood];

  let moodGenreIds = moodConfig.genreIds;

  if (options.intensity === "light") {
    moodGenreIds = moodGenreIds.filter(
      (genreId) => !HEAVY_GENRE_IDS.includes(genreId)
    );
  }

  if (options.intensity === "intense") {
    moodGenreIds = Array.from(
      new Set([...moodGenreIds, ...INTENSE_GENRE_IDS])
    );
  }

  let minVoteAverage = moodConfig.minVoteAverage;

  if (options.intensity === "light") {
    minVoteAverage = Math.max(0, minVoteAverage - 1);
  }

  if (options.intensity === "intense") {
    minVoteAverage = minVoteAverage + 1;
  }

  const companyConfig = COMPANY_CONFIG[options.company];

  // Aday havuzunu (with_genres) yalnızca mood belirler. Kullanıcı açıkça
  // bir tür seçtiyse (genreId > 0) o tür ana havuz olur; company hiçbir
  // durumda bu havuzu OR ile genişletmez — yalnızca family'nin güvenlik
  // amaçlı without_genres dışlaması genreId seçili değilken uygulanır.
  const excludeGenreIds =
    options.genreId === 0 ? companyConfig.excludeGenreIds : [];

  let sortBy: MovieSort = "popularity.desc";
  let voteCountMin = 150;

  if (options.discovery === "safe") {
    sortBy = "popularity.desc";
    voteCountMin = 500;
  } else if (options.discovery === "balanced") {
    sortBy = "popularity.desc";
    voteCountMin = 150;
  } else {
    sortBy = "primary_release_date.desc";
    voteCountMin = 30;
  }

  // company, discovery'nin "different" (yenilik/recency) niyetini ezmez;
  // yalnızca popularity tabanlı safe/balanced durumlarında sıralamayı
  // friends/partner arasında ayrıştırmak için devreye girer. Bu, genreId
  // seçili olsa bile uygulanan ikincil bir parametredir — tür filtresine
  // dokunmaz.
  if (companyConfig.preferredSortBy && options.discovery !== "different") {
    sortBy = companyConfig.preferredSortBy;
  }

  voteCountMin = Math.max(
    0,
    voteCountMin + companyConfig.voteCountMinModifier
  );

  minVoteAverage = Math.max(
    0,
    Math.min(10, minVoteAverage + companyConfig.voteAverageModifier)
  );

  const params = new URLSearchParams({
    api_key: apiKey,
    language: "en-US",
    page: safePage.toString(),
    sort_by: sortBy,
    include_adult: "false",
    include_video: "false",
    "primary_release_date.lte": today,
    "vote_average.gte": minVoteAverage.toString(),
    "vote_count.gte": voteCountMin.toString(),
  });

  if (options.genreId > 0) {
    params.set("with_genres", options.genreId.toString());
  } else if (moodGenreIds.length > 0) {
    params.set("with_genres", moodGenreIds.join("|"));
  }

  if (excludeGenreIds.length > 0) {
    params.set("without_genres", excludeGenreIds.join(","));
  }

  if (options.runtime === "short") {
    params.set("with_runtime.lte", "90");
  } else if (options.runtime === "medium") {
    params.set("with_runtime.gte", "90");
    params.set("with_runtime.lte", "120");
  } else if (options.runtime === "long") {
    params.set("with_runtime.gte", "120");
  }

  const response = await fetch(
    `${TMDB_BASE_URL}/discover/movie?${params.toString()}`,
    {
      cache: "no-store",
    }
  );

  if (!response.ok) {
    throw new Error(
      `Film önerileri alınamadı. Hata kodu: ${response.status}`
    );
  }

  return response.json();
}

export async function getCollectionCandidates(
  options: CollectionCandidateOptions,
  page = 1
): Promise<CollectionCandidateListResponse> {
  const apiKey = getApiKey();
  const safePage = Math.max(1, Math.min(page, 500));
  const today = new Date().toISOString().split("T")[0];

  const params = new URLSearchParams({
    api_key: apiKey,
    language: "en-US",
    page: safePage.toString(),
    sort_by: options.sortBy,
    include_adult: "false",
    include_video: "false",
    "primary_release_date.lte": today,
    "vote_average.gte": options.voteAverageMin.toString(),
    "vote_count.gte": options.voteCountMin.toString(),
  });

  if (options.candidateGenreIds.length > 0) {
    params.set("with_genres", options.candidateGenreIds.join("|"));
  }

  if (options.candidateKeywordIds && options.candidateKeywordIds.length > 0) {
    params.set("with_keywords", options.candidateKeywordIds.join("|"));
  }

  if (options.excludedGenreIds && options.excludedGenreIds.length > 0) {
    params.set("without_genres", options.excludedGenreIds.join(","));
  }

  if (options.runtimeMin !== undefined) {
    params.set("with_runtime.gte", options.runtimeMin.toString());
  }

  if (options.runtimeMax !== undefined) {
    params.set("with_runtime.lte", options.runtimeMax.toString());
  }

  if (options.castId !== undefined) {
    params.set("with_cast", options.castId.toString());
  }

  if (options.crewId !== undefined) {
    params.set("with_crew", options.crewId.toString());
  }

  if (options.companyId !== undefined) {
    params.set("with_companies", options.companyId.toString());
  }

  const response = await fetch(
    `${TMDB_BASE_URL}/discover/movie?${params.toString()}`,
    {
      next: {
        revalidate: 3600,
      },
    }
  );

  if (!response.ok) {
    throw new Error(
      `Koleksiyon adayları alınamadı. Hata kodu: ${response.status}`
    );
  }

  return response.json();
}

// Anahtar kelimeler filme özgü ve nadiren değişir; uzun revalidate süresi
// hem doğruluk motorunun tekrarlayan sayfa isteklerinde önbellekten
// yararlanmasını sağlar hem de aynı render sürecinde aynı film için
// tekrar istek atılmasını (Next.js fetch dedupe ile) önler.
export async function getMovieKeywords(
  movieId: number
): Promise<MovieKeyword[]> {
  const apiKey = getApiKey();

  const response = await fetch(
    `${TMDB_BASE_URL}/movie/${movieId}/keywords?api_key=${apiKey}`,
    {
      next: {
        revalidate: 604800,
      },
    }
  );

  if (!response.ok) {
    throw new Error(
      `Film anahtar kelimeleri alınamadı. Hata kodu: ${response.status}`
    );
  }

  const data: MovieKeywordsResponse = await response.json();

  return data.keywords;
}

export type MovieKeywordsAndCollection = {
  keywordIds: number[];
  collectionId: number | null;
};

type MovieKeywordsAndCollectionResponse = {
  belongs_to_collection: TmdbCollectionReference | null;
  keywords: MovieKeywordsResponse;
};

// Koleksiyon motoru (lib/collectionEngine.ts) her aday film için zaten
// anahtar kelime isteği atıyordu (getMovieKeywords, /movie/{id}/keywords).
// Franchise dedup'ın ihtiyaç duyduğu belongs_to_collection.id ise yalnızca
// TEMEL /movie/{id} gövdesinde bulunur — discover sonuçlarında yoktur ve
// /keywords uç noktası da döndürmez. İkisi için ayrı istek atmak yerine,
// TMDB'nin append_to_response=keywords özelliğiyle AYNI TEK istekte hem
// temel gövde (belongs_to_collection dahil) hem de keywords alt-kaynağı
// birlikte çekilir — bu da getMovieKeywords ile bire bir aynı /keywords
// şeklini (keywords.keywords) döndürür. Böylece franchise dedup, önceden
// var olan keyword isteğine "biner"; ayrı bir istek fazı eklenmez.
export async function getMovieKeywordsAndCollectionId(
  movieId: number
): Promise<MovieKeywordsAndCollection> {
  const apiKey = getApiKey();

  const response = await fetch(
    `${TMDB_BASE_URL}/movie/${movieId}?api_key=${apiKey}&language=en-US&append_to_response=keywords`,
    {
      next: {
        revalidate: 604800,
      },
    }
  );

  if (!response.ok) {
    throw new Error(
      `Film anahtar kelimeleri/koleksiyon bilgisi alınamadı. Hata kodu: ${response.status}`
    );
  }

  const data: MovieKeywordsAndCollectionResponse = await response.json();

  return {
    keywordIds: data.keywords.keywords.map((keyword) => keyword.id),
    collectionId: data.belongs_to_collection?.id ?? null,
  };
}

type MovieCollectionMembershipResponse = {
  belongs_to_collection: TmdbCollectionReference | null;
};

// Yalnızca koleksiyon motorunun keyword'e ihtiyaç duymadığı (dolayısıyla
// getMovieKeywordsAndCollectionId'e "binecek" bir isteğin hiç olmadığı)
// nadir yol için kullanılır — ve orada da yalnızca başlığa göre olası
// franchise tekrarı tespit edilen küçük bir alt küme için (bkz.
// lib/collectionEngine.ts). getMovieDetails'in ağır
// append_to_response=credits,videos,recommendations,keywords sürümü bu amaç
// için gereksizdir.
export async function getMovieCollectionId(
  movieId: number
): Promise<number | null> {
  const apiKey = getApiKey();

  const response = await fetch(
    `${TMDB_BASE_URL}/movie/${movieId}?api_key=${apiKey}&language=en-US`,
    {
      next: {
        revalidate: 604800,
      },
    }
  );

  if (!response.ok) {
    throw new Error(
      `Film koleksiyon bilgisi alınamadı. Hata kodu: ${response.status}`
    );
  }

  const data: MovieCollectionMembershipResponse = await response.json();

  return data.belongs_to_collection?.id ?? null;
}

export async function getMovieGenres(): Promise<MovieGenre[]> {
  const apiKey = getApiKey();

  const response = await fetch(
    `${TMDB_BASE_URL}/genre/movie/list?api_key=${apiKey}&language=en-US`,
    {
      next: {
        revalidate: 86400,
      },
    }
  );

  if (!response.ok) {
    throw new Error(
      `Film türleri alınamadı. Hata kodu: ${response.status}`
    );
  }

  const data: MovieGenresResponse = await response.json();

  return data.genres;
}

export async function searchMovies(
  query: string,
  page = 1
): Promise<MovieListResponse> {
  const trimmedQuery = query.trim();
  const safePage = Math.max(1, Math.min(page, 500));

  if (!trimmedQuery) {
    return {
      page: 1,
      results: [],
      total_pages: 0,
      total_results: 0,
    };
  }

  const apiKey = getApiKey();

  const params = new URLSearchParams({
    api_key: apiKey,
    query: trimmedQuery,
    language: "en-US",
    page: safePage.toString(),
    include_adult: "false",
  });

  const response = await fetch(
    `${TMDB_BASE_URL}/search/movie?${params.toString()}`,
    {
      cache: "no-store",
    }
  );

  if (!response.ok) {
    throw new Error(
      `Film araması yapılamadı. Hata kodu: ${response.status}`
    );
  }

  return response.json();
}

export async function searchPeople(
  query: string,
  page = 1
): Promise<PersonSearchResponse> {
  const trimmedQuery = query.trim();
  const safePage = Math.max(1, Math.min(page, 500));

  if (!trimmedQuery) {
    return {
      page: 1,
      results: [],
      total_pages: 0,
      total_results: 0,
    };
  }

  const apiKey = getApiKey();

  const params = new URLSearchParams({
    api_key: apiKey,
    query: trimmedQuery,
    language: "en-US",
    page: safePage.toString(),
    include_adult: "false",
  });

  const response = await fetch(
    `${TMDB_BASE_URL}/search/person?${params.toString()}`,
    {
      cache: "no-store",
    }
  );

  if (!response.ok) {
    throw new Error(
      `Kişi araması yapılamadı. Hata kodu: ${response.status}`
    );
  }

  return response.json();
}

// TMDB /search/company, kişi/film aramasının aksine include_adult veya
// language parametresi kabul etmez (şirketler için anlamsız).
export async function searchCompanies(
  query: string,
  page = 1
): Promise<CompanySearchResponse> {
  const trimmedQuery = query.trim();
  const safePage = Math.max(1, Math.min(page, 500));

  if (!trimmedQuery) {
    return {
      page: 1,
      results: [],
      total_pages: 0,
      total_results: 0,
    };
  }

  const apiKey = getApiKey();

  const params = new URLSearchParams({
    api_key: apiKey,
    query: trimmedQuery,
    page: safePage.toString(),
  });

  const response = await fetch(
    `${TMDB_BASE_URL}/search/company?${params.toString()}`,
    {
      cache: "no-store",
    }
  );

  if (!response.ok) {
    throw new Error(
      `Şirket araması yapılamadı. Hata kodu: ${response.status}`
    );
  }

  return response.json();
}

export async function getMovieDetails(
  movieId: string
): Promise<MovieDetails> {
  const apiKey = getApiKey();

  const response = await fetch(
    `${TMDB_BASE_URL}/movie/${movieId}?api_key=${apiKey}&language=en-US&append_to_response=credits,videos,recommendations,keywords`,
    {
      next: {
        revalidate: 3600,
      },
    }
  );

  if (!response.ok) {
    if (response.status === 404) {
      throw new TmdbNotFoundError(`Film bulunamadı: ${movieId}`);
    }

    throw new Error(
      `Film detayları alınamadı. Hata kodu: ${response.status}`
    );
  }

  return response.json();
}

// For You/DNA akışı (bkz. lib/movieDna.ts, components/hooks/useRecommendations.ts)
// getMovieDetails'in tüm alanlarına ihtiyaç duymaz: yalnızca credits (cast/
// crew id+isim eşleştirmesi ve castId/directorId/companyId puanlaması için)
// ve keywords (Movie DNA sinyalleri için) okunur — videos ve recommendations
// bu akışta hiç kullanılmaz. getMovieDetails'in ağır
// append_to_response=credits,videos,recommendations,keywords sürümünü aday
// başına (For You'da 40'a kadar) çekmek gereksiz payload/istek ağırlığı
// yaratır; bu yüzden aynı MovieDetails şeklini (videos/recommendations boş)
// döndüren daha hafif bir varyant burada tanımlanır.
export async function getMovieDnaDetails(
  movieId: string
): Promise<MovieDetails> {
  const apiKey = getApiKey();

  const response = await fetch(
    `${TMDB_BASE_URL}/movie/${movieId}?api_key=${apiKey}&language=en-US&append_to_response=credits,keywords`,
    {
      next: {
        revalidate: 3600,
      },
    }
  );

  if (!response.ok) {
    if (response.status === 404) {
      throw new TmdbNotFoundError(`Film bulunamadı: ${movieId}`);
    }

    throw new Error(
      `Film detayları alınamadı. Hata kodu: ${response.status}`
    );
  }

  const data = await response.json();

  return {
    ...data,
    videos: { results: [] },
    recommendations: { results: [] },
  };
}

// belongs_to_collection yalnızca bir referans (id/isim/poster) döndürür;
// diğer seri filmlerini almak için ayrı bir /collection/{id} isteği
// gerekir. movie details ile aynı revalidate stratejisi kullanılır — film
// detay sayfası zaten bu süreyle önbelleklendiği için tutarlıdır.
export async function getCollectionDetails(
  collectionId: number
): Promise<TmdbCollectionDetails | null> {
  if (!Number.isInteger(collectionId) || collectionId <= 0) {
    return null;
  }

  const apiKey = getApiKey();

  const response = await fetch(
    `${TMDB_BASE_URL}/collection/${collectionId}?api_key=${apiKey}&language=en-US`,
    {
      next: {
        revalidate: 3600,
      },
    }
  );

  if (!response.ok) {
    if (response.status === 404) {
      return null;
    }

    throw new Error(
      `Koleksiyon detayları alınamadı. Hata kodu: ${response.status}`
    );
  }

  const data = await response.json();

  // Ham TMDB yanıtına doğrudan güvenilmez — yalnızca kullanılan alanlar,
  // beklenen tipte olduğu doğrulanarak normalize edilir.
  return {
    id: typeof data?.id === "number" ? data.id : collectionId,
    name: typeof data?.name === "string" ? data.name : "",
    overview: typeof data?.overview === "string" ? data.overview : "",
    poster_path:
      typeof data?.poster_path === "string" ? data.poster_path : null,
    backdrop_path:
      typeof data?.backdrop_path === "string" ? data.backdrop_path : null,
    parts: Array.isArray(data?.parts) ? data.parts : [],
  };
}

function getValidReleaseTime(releaseDate: string | undefined): number | null {
  if (!releaseDate) {
    return null;
  }

  const time = new Date(releaseDate).getTime();

  return Number.isFinite(time) ? time : null;
}

function compareCollectionMovies(a: TmdbMovie, b: TmdbMovie): number {
  const aTime = getValidReleaseTime(a.release_date);
  const bTime = getValidReleaseTime(b.release_date);

  // Tarihi olmayanlar her zaman en sona — hangi tarafta olduklarından
  // bağımsız (bkz. görev talimatı: "Tarihi olmayanları en sona koy").
  if (aTime === null && bTime === null) {
    return a.id - b.id;
  }

  if (aTime === null) {
    return 1;
  }

  if (bTime === null) {
    return -1;
  }

  if (aTime !== bTime) {
    return aTime - bTime;
  }

  return a.id - b.id;
}

/**
 * Bir koleksiyonun ham "parts" listesini, mevcut filmi hariç tutarak,
 * geçersiz/tekrarlayan kayıtlardan arındırılmış ve çıkış tarihine göre
 * (eskiden yeniye, tarihsizler sona) deterministik sıralanmış bir listeye
 * çevirir. Saf bir fonksiyondur — fetch yapmaz, aynı girdi her zaman aynı
 * çıktıyı üretir.
 */
export function normalizeCollectionMovies(
  collection: TmdbCollectionDetails,
  currentMovieId: number
): TmdbMovie[] {
  const seenIds = new Set<number>();
  const movies: TmdbMovie[] = [];

  for (const part of collection.parts) {
    if (!part || typeof part.id !== "number" || !Number.isInteger(part.id) || part.id <= 0) {
      continue;
    }

    if (part.id === currentMovieId) {
      continue;
    }

    if (seenIds.has(part.id)) {
      continue;
    }

    if (typeof part.title !== "string" || part.title.length === 0) {
      continue;
    }

    seenIds.add(part.id);
    movies.push(part);
  }

  return movies.sort(compareCollectionMovies);
}

// Ham external_ids alt-nesnesine doğrudan güvenilmez — TMDB bazı kişilerde
// bu alanı hiç döndürmeyebilir ya da beklenmeyen tiplerle doldurabilir.
function normalizePersonExternalIds(raw: unknown): PersonExternalIds | null {
  if (typeof raw !== "object" || raw === null) {
    return null;
  }

  const candidate = raw as Record<string, unknown>;

  function asNullableString(value: unknown): string | null {
    return typeof value === "string" && value.trim().length > 0
      ? value
      : null;
  }

  return {
    imdb_id: asNullableString(candidate.imdb_id),
    facebook_id: asNullableString(candidate.facebook_id),
    instagram_id: asNullableString(candidate.instagram_id),
    twitter_id: asNullableString(candidate.twitter_id),
    tiktok_id: asNullableString(candidate.tiktok_id),
    youtube_id: asNullableString(candidate.youtube_id),
  };
}

export async function getPersonDetails(
  personId: string
): Promise<PersonDetails> {
  const apiKey = getApiKey();

  const response = await fetch(
    `${TMDB_BASE_URL}/person/${personId}?api_key=${apiKey}&language=en-US&append_to_response=external_ids`,
    {
      next: {
        revalidate: 86400,
      },
    }
  );

  if (!response.ok) {
    if (response.status === 404) {
      throw new TmdbNotFoundError(`Kişi bulunamadı: ${personId}`);
    }

    throw new Error(
      `Kişi bilgileri alınamadı. Hata kodu: ${response.status}`
    );
  }

  const data = await response.json();

  return {
    ...data,
    external_ids: normalizePersonExternalIds(data?.external_ids),
  };
}

export async function getPersonMovieCredits(
  personId: string
): Promise<PersonMovieCredits> {
  const apiKey = getApiKey();

  const response = await fetch(
    `${TMDB_BASE_URL}/person/${personId}/movie_credits?api_key=${apiKey}&language=en-US`,
    {
      next: {
        revalidate: 86400,
      },
    }
  );

  if (!response.ok) {
    if (response.status === 404) {
      throw new TmdbNotFoundError(`Kişi bulunamadı: ${personId}`);
    }

    throw new Error(
      `Kişinin filmleri alınamadı. Hata kodu: ${response.status}`
    );
  }

  const data: PersonMovieCreditsResponse = await response.json();

  return {
    cast: Array.isArray(data.cast) ? data.cast : [],
    crew: Array.isArray(data.crew) ? data.crew : [],
  };
}

export function getPosterUrl(
  posterPath: string | null
): string | null {
  if (!posterPath) {
    return null;
  }

  return `https://image.tmdb.org/t/p/w500${posterPath}`;
}

export function getBackdropUrl(
  backdropPath: string | null
): string | null {
  if (!backdropPath) {
    return null;
  }

  return `https://image.tmdb.org/t/p/w1280${backdropPath}`;
}

export function getCompanyLogoUrl(
  logoPath: string | null
): string | null {
  if (!logoPath) {
    return null;
  }

  return `https://image.tmdb.org/t/p/w300${logoPath}`;
}

export function getProfileUrl(
  profilePath: string | null
): string | null {
  if (!profilePath) {
    return null;
  }

  return `https://image.tmdb.org/t/p/w185${profilePath}`;
}