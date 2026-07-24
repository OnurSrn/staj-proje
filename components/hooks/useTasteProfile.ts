"use client";

import { useMemo } from "react";
import { useMoviesByIds } from "@/components/hooks/useMoviesByIds";
import {
  useFavoriteCompanies,
  useFavoritePeople,
} from "@/components/PreferenceProvider";
import {
  useMovieRatings,
  useWatchStatuses,
  type WatchStatus,
} from "@/components/SavedMoviesProvider";
import { buildMovieDnaProfile } from "@/lib/movieDna";
import { RECOMMENDATION_LIMITS } from "@/lib/recommendationConfig";
import {
  buildTasteProfile,
  getRatingWeight,
  type TasteProfile,
  type TasteProfileMovie,
} from "@/lib/tasteProfile";
import type { MovieDetails } from "@/lib/tmdb";

// v1 güvenli sınır: profil için en fazla bu kadar film analiz edilir —
// artık lib/recommendationConfig.ts RECOMMENDATION_LIMITS'ten (merkezi
// config), değer DEĞİŞMEDİ. useMoviesByIds zaten aynı anda en fazla 6
// istek uçurur (bkz. MOVIE_FETCH_CONCURRENCY); bu sabit ayrıca toplam
// istek SAYISINI (ve dolayısıyla TMDB'ye giden toplam yükü) sınırlar.
// Puanlanmış filmler en güçlü sinyal olduğu için önceliklidir; kalan
// kapasite yalnızca durumu olan (rating'siz) filmlerle doldurulur.
const MAX_ANALYZED_MOVIES = RECOMMENDATION_LIMITS.maxAnalyzedMovies;

export type UseTasteProfileResult = {
  profile: TasteProfile | null;
  isLoading: boolean;
  hasError: boolean;
};

// Yalnızca "pozitif tam sayı" biçimindeki anahtarlar geçerli bir film id'si
// sayılır — "movie:123", "tv:123", "-5", "12.5", "not-a-number" gibi her
// şey güvenle yok sayılır. Not: ratings/watchStatuses zaten
// SavedMoviesProvider'ın toMovieRecord dönüşümünden geçtiği için normalde
// yalnızca düz sayısal-string movie id'leri içerir (tv: kayıtları orada
// zaten filtrelenir); bu kontrol yalnızca bu saf fonksiyonu tek başına da
// güvenli/test edilebilir kılmak için ek bir savunma katmanıdır.
function parseValidMovieId(key: string): number | null {
  if (!/^\d+$/.test(key)) {
    return null;
  }

  const id = Number(key);

  return Number.isInteger(id) && id > 0 ? id : null;
}

// watched > dropped > watching > plan-to-watch — status-only filmler
// arasında en "güçlü" sinyalden başlanır.
const STATUS_SELECTION_PRIORITY: Record<WatchStatus, number> = {
  watched: 0,
  dropped: 1,
  watching: 2,
  "plan-to-watch": 3,
};

/**
 * Profil için analiz edilecek en fazla `maxCount` film id'sini SEÇER.
 * Timestamp/kayıt sırası verisi olmadığı için "en yeni" varsayımı
 * yapılmaz — bunun yerine tamamen içerik tabanlı, deterministik bir
 * öncelik sırası kullanılır (aynı localStorage verisi her zaman aynı
 * seçimi üretir):
 *
 * 1. Rating'i olan filmler, |ratingWeight| büyükten küçüğe
 * 2. Eşitlikte rating değeri büyükten küçüğe
 * 3. Sonra yalnızca status'u olan (rating'siz) filmler, status
 *    önceliğine göre (watched > dropped > watching > plan-to-watch)
 * 4. Son eşitlikte movie id küçükten büyüğe
 *
 * Saf bir fonksiyondur — fetch içermez, geçici script ile test edilebilir.
 */
export function selectMovieIdsForProfile(
  ratings: Record<string, number>,
  watchStatuses: Record<string, WatchStatus>,
  maxCount: number = MAX_ANALYZED_MOVIES
): number[] {
  const ratedEntries = Object.entries(ratings)
    .map(([key, rating]) => {
      const id = parseValidMovieId(key);

      return id === null
        ? null
        : { id, rating, absWeight: Math.abs(getRatingWeight(rating)) };
    })
    .filter((entry): entry is { id: number; rating: number; absWeight: number } => entry !== null)
    .sort((a, b) => {
      if (b.absWeight !== a.absWeight) {
        return b.absWeight - a.absWeight;
      }

      if (b.rating !== a.rating) {
        return b.rating - a.rating;
      }

      return a.id - b.id;
    });

  const ratedIds = ratedEntries.map((entry) => entry.id);
  const ratedIdSet = new Set(ratedIds);

  const statusOnlyEntries = Object.entries(watchStatuses)
    .map(([key, status]) => {
      const id = parseValidMovieId(key);

      return id === null || ratedIdSet.has(id)
        ? null
        : { id, priority: STATUS_SELECTION_PRIORITY[status] };
    })
    .filter((entry): entry is { id: number; priority: number } => entry !== null)
    .sort((a, b) => {
      if (a.priority !== b.priority) {
        return a.priority - b.priority;
      }

      return a.id - b.id;
    });

  return [...ratedIds, ...statusOnlyEntries.map((entry) => entry.id)].slice(
    0,
    maxCount
  );
}

export function toTasteProfileMovie(movie: MovieDetails): TasteProfileMovie {
  const genreIds = movie.genres.map((genre) => genre.id);
  // keywords alt-kaynağı normalde her zaman gelir (append_to_response'a
  // eklendi), ancak eksik/null olma ihtimaline karşı güvenle boş listeye
  // düşer — DNA profili crash üretmeden boş sinyal döner.
  const keywordIds = (movie.keywords?.keywords ?? []).map(
    (keyword) => keyword.id
  );

  // Oyuncu listesi ilk 10 (baş rol) ile sınırlanır — film detay sayfasıyla
  // aynı kural (bkz. app/movie/[id]/page.tsx: cast.slice(0, 10)); çok
  // küçük figüran rollerinin inferred oyuncu sinyalini sulandırmasını
  // önler.
  const castIds = movie.credits.cast.slice(0, 10).map((member) => member.id);
  const directorIds = movie.credits.crew
    .filter((member) => member.job === "Director")
    .map((member) => member.id);
  const companyIds = movie.production_companies.map((company) => company.id);

  return {
    id: movie.id,
    genreIds,
    runtime: movie.runtime,
    releaseDate: movie.release_date || null,
    originalLanguage: movie.original_language || null,
    originCountryCodes: movie.origin_country ?? [],
    castIds,
    directorIds,
    companyIds,
    dnaProfile: buildMovieDnaProfile({
      movieId: movie.id,
      genreIds,
      keywordIds,
    }),
  };
}

/**
 * Kullanıcının yerel verilerini (ratings, watch statuses, favori
 * kişi/stüdyolar) toplar, en fazla MAX_ANALYZED_MOVIES film için TMDB
 * detaylarını (mevcut useMoviesByIds — sınırlı eşzamanlılıkla) getirir ve
 * saf buildTasteProfile fonksiyonuyla zevk profilini üretir. Profil yalnızca
 * girdi verisi değiştiğinde yeniden hesaplanır (useMemo).
 */
export function useTasteProfile(): UseTasteProfileResult {
  const { ratings, isLoaded: ratingsLoaded } = useMovieRatings();
  const { statuses, isLoaded: statusesLoaded } = useWatchStatuses();
  const { favoritePeople, isLoaded: peopleLoaded } = useFavoritePeople();
  const { favoriteCompanies, isLoaded: companiesLoaded } =
    useFavoriteCompanies();

  const movieIds = useMemo(
    () => selectMovieIdsForProfile(ratings, statuses),
    [ratings, statuses]
  );

  const {
    movies,
    isLoading: moviesLoading,
    hasError,
  } = useMoviesByIds(movieIds);

  const isStoreLoaded =
    ratingsLoaded && statusesLoaded && peopleLoaded && companiesLoaded;

  const profile = useMemo(() => {
    if (!isStoreLoaded || moviesLoading) {
      return null;
    }

    const tasteProfileMovies = movies.map(toTasteProfileMovie);

    // Etiket sözlükleri, zaten fetch edilmiş film verisinden (genres,
    // credits, production_companies) ücretsiz üretilir — ek bir TMDB
    // isteği veya yeni bir mapping gerekmez.
    const genreLabels: Record<number, string> = {};
    const personNames: Record<number, string> = {};
    const companyNames: Record<number, string> = {};

    for (const movie of movies) {
      for (const genre of movie.genres) {
        genreLabels[genre.id] = genre.name;
      }

      for (const castMember of movie.credits.cast.slice(0, 10)) {
        personNames[castMember.id] = castMember.name;
      }

      for (const crewMember of movie.credits.crew) {
        if (crewMember.job === "Director") {
          personNames[crewMember.id] = crewMember.name;
        }
      }

      for (const company of movie.production_companies) {
        companyNames[company.id] = company.name;
      }
    }

    return buildTasteProfile({
      ratings,
      watchStatuses: statuses,
      movies: tasteProfileMovies,
      favoritePeople,
      favoriteCompanies,
      genreLabels,
      personNames,
      companyNames,
    });
  }, [
    isStoreLoaded,
    moviesLoading,
    movies,
    ratings,
    statuses,
    favoritePeople,
    favoriteCompanies,
  ]);

  return {
    profile,
    isLoading: !isStoreLoaded || moviesLoading,
    hasError,
  };
}
