// Search sayfasının merkezi, URL ile senkronize filtre modeli. Bu dosya
// yalnızca SAF durum/URL mantığını taşır — TMDB'ye özgü query üretimi
// lib/searchQuery.ts'te, gerçek fetch çağrıları lib/tmdb.ts'te yaşar (bkz.
// görev talimatı "Hedef mimari"). UI (app/search/page.tsx ve
// components/search/*) yalnızca buradaki fonksiyonları tüketir.

export type SearchSort =
  | "relevance"
  | "popularity"
  | "rating"
  | "newest"
  | "oldest";

export type SearchFilters = {
  query: string;
  genreId?: number;
  yearFrom?: number;
  yearTo?: number;
  minimumRating?: number;
  sort: SearchSort;
  page: number;
};

// URLSearchParams/searchParams gibi "değer ya string ya string[] ya da
// yok" şeklindeki gevşek girdi tipini tek noktadan modelliyoruz.
export type SearchParamsInput = Record<
  string,
  string | string[] | undefined
>;

export const SEARCH_SORT_OPTIONS: SearchSort[] = [
  "relevance",
  "popularity",
  "rating",
  "newest",
  "oldest",
];

// Magic number'lar component'lere dağılmasın diye tek merkezde toplanır
// (bkz. görev talimatı bölüm 1).
export const SEARCH_FILTER_LIMITS = {
  minYear: 1900,
  // Sabit, deterministik bir üst sınır — "bugünün yılı"na bağlı bir hesap
  // yerine geniş ve sabit bir aralık kullanılır ki saf fonksiyonlar zamana
  // göre değişmesin (bkz. görev talimatı "immutable/default config").
  maxYear: 2100,
  minimumRatingFloor: 0,
  minimumRatingCeiling: 10,
  maxPage: 500,
  // "rating" sıralamasında çok düşük oy sayılı filmlerin üst sıraları
  // işgal etmesini engelleyen güvenli eşik (mevcut discoverMovies'teki
  // vote_average.desc dalıyla aynı değer — bkz. lib/tmdb.ts).
  ratingSortMinimumVoteCount: 200,
  // Minimum puan alanı için native select'te sunulan hazır eşikler.
  ratingQuickOptions: [5, 6, 7, 7.5, 8, 8.5, 9] as const,
} as const;

export const SEARCH_FILTER_DEFAULTS: SearchFilters = {
  query: "",
  genreId: undefined,
  yearFrom: undefined,
  yearTo: undefined,
  minimumRating: undefined,
  sort: "relevance",
  page: 1,
};

export function isSearchSort(value: unknown): value is SearchSort {
  return (
    typeof value === "string" &&
    (SEARCH_SORT_OPTIONS as string[]).includes(value)
  );
}

function clampNumber(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function clampYear(value: unknown): number | undefined {
  if (typeof value !== "number" || !Number.isInteger(value)) {
    return undefined;
  }

  if (value < SEARCH_FILTER_LIMITS.minYear || value > SEARCH_FILTER_LIMITS.maxYear) {
    return undefined;
  }

  return value;
}

// Zaten SearchFilters şeklinde (ama alanları geçersiz/aralık dışı olabilen)
// bir adayı güvenli, aralık içi bir SearchFilters'a çevirir. parseSearchFilters
// VE updateSearchFilters tarafından ORTAK kullanılır — böylece "URL'den
// okunan" ile "kullanıcı düzenlemesiyle üretilen" durum her zaman AYNI
// doğrulama kuralından geçer.
export function normalizeSearchFilters(
  candidate: Partial<SearchFilters>
): SearchFilters {
  const query =
    typeof candidate.query === "string"
      ? candidate.query.trim()
      : SEARCH_FILTER_DEFAULTS.query;

  const genreId =
    typeof candidate.genreId === "number" &&
    Number.isInteger(candidate.genreId) &&
    candidate.genreId > 0
      ? candidate.genreId
      : undefined;

  let yearFrom = clampYear(candidate.yearFrom);
  let yearTo = clampYear(candidate.yearTo);

  // yearFrom > yearTo: sert biçimde reddetmek yerine iki değeri yer
  // değiştirerek güvenli bir aralığa normalize ediyoruz — kullanıcının
  // niyeti (bir aralık istemek) korunur, yalnızca sırası düzeltilir (bkz.
  // görev talimatı bölüm 2 ve rapor).
  if (yearFrom !== undefined && yearTo !== undefined && yearFrom > yearTo) {
    const swappedFrom = yearTo;
    const swappedTo = yearFrom;

    yearFrom = swappedFrom;
    yearTo = swappedTo;
  }

  const minimumRating =
    typeof candidate.minimumRating === "number" &&
    Number.isFinite(candidate.minimumRating)
      ? clampNumber(
          candidate.minimumRating,
          SEARCH_FILTER_LIMITS.minimumRatingFloor,
          SEARCH_FILTER_LIMITS.minimumRatingCeiling
        )
      : undefined;

  const sort = isSearchSort(candidate.sort)
    ? candidate.sort
    : SEARCH_FILTER_DEFAULTS.sort;

  const page =
    typeof candidate.page === "number" &&
    Number.isInteger(candidate.page) &&
    candidate.page >= 1
      ? Math.min(candidate.page, SEARCH_FILTER_LIMITS.maxPage)
      : SEARCH_FILTER_DEFAULTS.page;

  return { query, genreId, yearFrom, yearTo, minimumRating, sort, page };
}

function getRawParam(
  params: SearchParamsInput,
  key: string
): string | undefined {
  const value = params[key];

  if (Array.isArray(value)) {
    return value[0];
  }

  return value;
}

export type ParsedSearchFilters = {
  filters: SearchFilters;
  // Ham URL'de en az bir alan vardı ama geçersizdi/aralık dışıydı/
  // normalize edilirken değiştirildi (ör. yearFrom>yearTo takası). UI bu
  // bayrağı "bazı filtre değerleri otomatik düzeltildi" bildirimi için
  // kullanır (bkz. görev talimatı bölüm 9 "Invalid filtre normalize
  // edildi").
  hadInvalidParams: boolean;
};

// Ham searchParams (string/string[]/undefined) girdisini doğrulanmış bir
// SearchFilters'a çevirir. Her alan bağımsız doğrulanır; biri geçersizse
// yalnızca o alan varsayılana/undefined'a düşer, diğerlerini etkilemez.
export function parseSearchFilters(
  rawParams: SearchParamsInput
): ParsedSearchFilters {
  let hadInvalidParams = false;

  const rawQuery = getRawParam(rawParams, "query");
  const query = (rawQuery ?? "").trim();

  const rawGenre = getRawParam(rawParams, "genre");
  let genreId: number | undefined;

  if (rawGenre !== undefined) {
    const parsedGenre = Number(rawGenre);

    if (Number.isInteger(parsedGenre) && parsedGenre > 0) {
      genreId = parsedGenre;
    } else {
      hadInvalidParams = true;
    }
  }

  function parseYearParam(key: "yearFrom" | "yearTo"): number | undefined {
    const rawYear = getRawParam(rawParams, key);

    if (rawYear === undefined) {
      return undefined;
    }

    const parsedYear = Number(rawYear);
    const clamped = clampYear(
      Number.isInteger(parsedYear) ? parsedYear : undefined
    );

    if (clamped === undefined) {
      hadInvalidParams = true;
    }

    return clamped;
  }

  const yearFrom = parseYearParam("yearFrom");
  const yearTo = parseYearParam("yearTo");

  if (yearFrom !== undefined && yearTo !== undefined && yearFrom > yearTo) {
    hadInvalidParams = true;
  }

  const rawRating = getRawParam(rawParams, "rating");
  let minimumRating: number | undefined;

  if (rawRating !== undefined) {
    const parsedRating = Number(rawRating);

    if (Number.isFinite(parsedRating)) {
      const clamped = clampNumber(
        parsedRating,
        SEARCH_FILTER_LIMITS.minimumRatingFloor,
        SEARCH_FILTER_LIMITS.minimumRatingCeiling
      );

      minimumRating = clamped;

      if (clamped !== parsedRating) {
        hadInvalidParams = true;
      }
    } else {
      hadInvalidParams = true;
    }
  }

  const rawSort = getRawParam(rawParams, "sort");
  let sort: SearchSort = SEARCH_FILTER_DEFAULTS.sort;

  if (rawSort !== undefined) {
    if (isSearchSort(rawSort)) {
      sort = rawSort;
    } else {
      hadInvalidParams = true;
    }
  }

  const rawPage = getRawParam(rawParams, "page");
  let page = SEARCH_FILTER_DEFAULTS.page;

  if (rawPage !== undefined) {
    const parsedPage = Number(rawPage);

    if (Number.isInteger(parsedPage) && parsedPage >= 1) {
      page = Math.min(parsedPage, SEARCH_FILTER_LIMITS.maxPage);
    } else {
      hadInvalidParams = true;
    }
  }

  const filters = normalizeSearchFilters({
    query,
    genreId,
    yearFrom,
    yearTo,
    minimumRating,
    sort,
    page,
  });

  return { filters, hadInvalidParams };
}

// Yalnızca varsayılandan FARKLI alanları URL'ye yazar (bkz. görev
// talimatı "Boş/default değerleri gereksiz yere URL'ye yazma").
export function serializeSearchFilters(
  filters: SearchFilters
): URLSearchParams {
  const normalized = normalizeSearchFilters(filters);
  const params = new URLSearchParams();

  if (normalized.query) {
    params.set("query", normalized.query);
  }

  if (normalized.genreId !== undefined) {
    params.set("genre", String(normalized.genreId));
  }

  if (normalized.yearFrom !== undefined) {
    params.set("yearFrom", String(normalized.yearFrom));
  }

  if (normalized.yearTo !== undefined) {
    params.set("yearTo", String(normalized.yearTo));
  }

  if (normalized.minimumRating !== undefined) {
    params.set("rating", String(normalized.minimumRating));
  }

  if (normalized.sort !== SEARCH_FILTER_DEFAULTS.sort) {
    params.set("sort", normalized.sort);
  }

  if (normalized.page !== SEARCH_FILTER_DEFAULTS.page) {
    params.set("page", String(normalized.page));
  }

  return params;
}

// "/search" + (varsa) "?..." — boş filtrelerde çıplak "/search" döner.
export function buildSearchHref(filters: SearchFilters): string {
  const serialized = serializeSearchFilters(filters).toString();

  return serialized ? `/search?${serialized}` : "/search";
}

// Bir patch uygular. page açıkça patch içinde verilmediyse (ör. sayfalama
// linkleri dışında herhangi bir filtre değişimi) sonuç sayfa 1'e döner —
// bkz. görev talimatı bölüm 8 "Filtre değişince page=1 olmalı".
export function updateSearchFilters(
  current: SearchFilters,
  patch: Partial<SearchFilters>
): SearchFilters {
  const merged: Partial<SearchFilters> = { ...current, ...patch };

  if (!("page" in patch)) {
    merged.page = 1;
  }

  return normalizeSearchFilters(merged);
}

// Genre/yıl aralığı/minimum puan/relevance-dışı sıralama gibi "yapısal"
// bir filtre etkin mi? Search/Discover mod seçimi VE "Clear all" chip'inin
// görünürlüğü bu tek fonksiyona dayanır (bkz. görev talimatı bölüm 3/7).
export function hasActiveStructuralFilters(filters: SearchFilters): boolean {
  return (
    filters.genreId !== undefined ||
    filters.yearFrom !== undefined ||
    filters.yearTo !== undefined ||
    filters.minimumRating !== undefined ||
    filters.sort !== SEARCH_FILTER_DEFAULTS.sort
  );
}

export type SearchMode = "empty" | "search" | "discover";

// TMDB'nin gerçek yeteneklerine dayanan mod seçimi (bkz. görev talimatı
// bölüm 3):
// - Herhangi bir yapısal filtre etkinse (genre/yıl/puan/relevance-dışı
//   sıralama) -> "discover" (TMDB discover/movie serbest metin query'sini
//   desteklemez; bu modda query TMDB'ye hiç gönderilmez, yalnızca arama
//   kutusunda saklanır).
// - Yapısal filtre yoksa ve query doluysa -> "search" (TMDB search/movie).
// - İkisi de yoksa -> "empty" (henüz sorgu/filtre yok).
export function resolveSearchMode(filters: SearchFilters): SearchMode {
  if (hasActiveStructuralFilters(filters)) {
    return "discover";
  }

  if (filters.query.trim().length > 0) {
    return "search";
  }

  return "empty";
}
