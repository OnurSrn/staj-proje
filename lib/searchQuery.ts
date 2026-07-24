// Search filtrelerini TMDB'nin gerçek query şekline çeviren saf builder'lar.
// lib/tmdb.ts'e "büyük koşul yığını" eklemek yerine bu dosyada toplanır
// (bkz. görev talimatı bölüm 4); lib/tmdb.ts yalnızca hazır bir
// URLSearchParams alıp fetch eden ince bir fonksiyon barındırır.
import { SEARCH_FILTER_LIMITS, type SearchFilters, type SearchSort } from "@/lib/searchFilters";
import type { TmdbMovie } from "@/lib/tmdb";

// relevance'ın discover/movie'de doğrudan bir karşılığı yok (TMDB discover
// sort_by relevance kabul etmiyor) — bu durumda popularity.desc'e düşülür
// (bkz. görev talimatı "Sort eşlemeleri").
export function mapSearchSortToTmdbDiscoverSort(sort: SearchSort): string {
  switch (sort) {
    case "popularity":
      return "popularity.desc";
    case "rating":
      return "vote_average.desc";
    case "newest":
      return "primary_release_date.desc";
    case "oldest":
      return "primary_release_date.asc";
    case "relevance":
    default:
      return "popularity.desc";
  }
}

// discover/movie için tam URLSearchParams üretir. api_key BURADA eklenmez —
// yalnızca lib/tmdb.ts'teki fetch fonksiyonu ekler (client'a hiç taşınmaz).
export function buildDiscoverMovieParams(
  filters: SearchFilters,
  tmdbLanguage: string
): URLSearchParams {
  const params = new URLSearchParams({
    language: tmdbLanguage,
    page: filters.page.toString(),
    sort_by: mapSearchSortToTmdbDiscoverSort(filters.sort),
    include_adult: "false",
    include_video: "false",
  });

  if (filters.genreId !== undefined) {
    params.set("with_genres", filters.genreId.toString());
  }

  if (filters.yearFrom !== undefined) {
    params.set("primary_release_date.gte", `${filters.yearFrom}-01-01`);
  }

  if (filters.yearTo !== undefined) {
    params.set("primary_release_date.lte", `${filters.yearTo}-12-31`);
  }

  if (filters.minimumRating !== undefined) {
    params.set("vote_average.gte", filters.minimumRating.toString());
  }

  // Yalnızca "rating" sıralamasında: oy sayısı çok düşük filmlerin salt
  // yüksek ortalamayla üst sıraları işgal etmesini engeller. minimumRating
  // filtresinden bağımsız olarak, yalnızca sıralamanın kendisini
  // dengelemek için uygulanır (bkz. görev talimatı bölüm 4).
  if (filters.sort === "rating") {
    params.set(
      "vote_count.gte",
      String(SEARCH_FILTER_LIMITS.ratingSortMinimumVoteCount)
    );
  }

  return params;
}

// TMDB /search/movie serbest metin sıralaması desteklemez (yalnızca
// kendi relevance sırasını döner). Kullanıcı search modundayken relevance
// dışında bir sıralama seçtiyse, TMDB'ye ek bir istek atmadan MEVCUT
// (zaten çekilmiş) sayfanın sonuçları bu alana göre yeniden sıralanır —
// bu "sahte filtreleme" değildir: sonuç kümesi hiç değişmez/daraltılmaz,
// yalnızca zaten eşleşen sonuçların GÖRÜNÜM sırası değişir. Yalnızca o
// anki sayfa (en fazla 20 sonuç) kapsamındadır — TMDB search sayfalar
// arası sıralama sağlamaz (bkz. görev talimatı bölüm 3 ve rapor).
export function sortSearchResultsForDisplay(
  movies: TmdbMovie[],
  sort: SearchSort
): TmdbMovie[] {
  if (sort === "relevance") {
    return movies;
  }

  const sorted = [...movies];

  function releaseTime(movie: TmdbMovie): number {
    const time = new Date(movie.release_date ?? "").getTime();

    return Number.isFinite(time) ? time : Number.NEGATIVE_INFINITY;
  }

  switch (sort) {
    case "popularity":
      sorted.sort((a, b) => b.popularity - a.popularity);
      break;
    case "rating":
      sorted.sort((a, b) => b.vote_average - a.vote_average);
      break;
    case "newest":
      sorted.sort((a, b) => releaseTime(b) - releaseTime(a));
      break;
    case "oldest":
      sorted.sort((a, b) => releaseTime(a) - releaseTime(b));
      break;
  }

  return sorted;
}
