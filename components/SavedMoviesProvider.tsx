"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import {
  createMediaKey,
  createMovieKey,
  getMediaId,
  getMediaType,
  isMediaKey,
  type MediaKey,
  type MediaType,
} from "@/lib/mediaKey";

const FAVORITES_KEY = "cinescope-favorites";
const WATCHLIST_KEY = "cinescope-watchlist";
const RATINGS_KEY = "cinescope-movie-ratings";
const WATCH_STATUSES_KEY = "cinescope-watch-statuses";

const EMPTY_KEYS: MediaKey[] = [];
const EMPTY_IDS: number[] = [];
const EMPTY_RATINGS: Record<MediaKey, number> = {};
const EMPTY_WATCH_STATUSES: Record<MediaKey, WatchStatus> = {};
const EMPTY_MOVIE_RATINGS: Record<string, number> = {};
const EMPTY_MOVIE_WATCH_STATUSES: Record<string, WatchStatus> = {};

export type WatchStatus = "watched" | "watching" | "dropped" | "plan-to-watch";

const VALID_WATCH_STATUSES: WatchStatus[] = [
  "watched",
  "watching",
  "dropped",
  "plan-to-watch",
];

const RATABLE_WATCH_STATUSES: WatchStatus[] = ["watched", "dropped"];

// Kişisel puan yalnızca kullanıcı filmi bitirdiğinde ("watched") veya
// deneyip yarım bıraktığında ("dropped") anlamlıdır — henüz izlenmemiş
// veya devam eden bir film için puan vermek yanıltıcı olur.
export function canRateMovie(status: WatchStatus | null): boolean {
  return status !== null && RATABLE_WATCH_STATUSES.includes(status);
}

// ─── Context şekilleri ──────────────────────────────────────────────────
//
// Dışa açılan alanlar (favoriteIds, watchlistIds, ratings, statuses) bilinçli
// olarak film odaklı kaldı: sayısal movie ID dizisi / numeric-string anahtarlı
// obje. Depolama katmanı (aşağıdaki store'lar) MediaKey kullanıyor, ancak bu
// dönüşüm tamamen bu dosya içinde kapanıyor — mevcut sayfalar (Favorites,
// Watchlist, Ratings, Profile, Activity) hiçbir değişiklik yapmadan aynı
// number[] / Record<string, ...> şekillerini almaya devam ediyor. TV desteği
// geldiğinde bu alanlar değişmeden, yalnızca *Media varyantları kullanılarak
// genişletilebilir.
type SavedMoviesContextValue = {
  favoriteIds: number[];
  watchlistIds: number[];
  isLoaded: boolean;
  isFavorite: (movieId: number) => boolean;
  isInWatchlist: (movieId: number) => boolean;
  toggleFavorite: (movieId: number) => void;
  toggleWatchlist: (movieId: number) => void;
  addToWatchlist: (movieId: number) => void;
  isFavoriteMedia: (mediaType: MediaType, id: number) => boolean;
  toggleFavoriteMedia: (mediaType: MediaType, id: number) => void;
  isInWatchlistMedia: (mediaType: MediaType, id: number) => boolean;
};

const SavedMoviesContext = createContext<SavedMoviesContextValue | null>(
  null
);

type MovieRatingsContextValue = {
  ratings: Record<string, number>;
  isLoaded: boolean;
  getMovieRating: (movieId: number) => number | null;
  setMovieRating: (movieId: number, rating: number) => void;
  removeMovieRating: (movieId: number) => void;
  getMediaRating: (mediaType: MediaType, id: number) => number | null;
};

const MovieRatingsContext = createContext<MovieRatingsContextValue | null>(
  null
);

type WatchStatusesContextValue = {
  statuses: Record<string, WatchStatus>;
  isLoaded: boolean;
  getWatchStatus: (movieId: number) => WatchStatus | null;
  setWatchStatus: (movieId: number, status: WatchStatus) => void;
  removeWatchStatus: (movieId: number) => void;
  getMediaWatchStatus: (mediaType: MediaType, id: number) => WatchStatus | null;
};

const WatchStatusesContext =
  createContext<WatchStatusesContextValue | null>(null);

// ─── Migrasyon + parse yardımcıları ─────────────────────────────────────
//
// Eski veri iki biçimde karşımıza çıkabilir:
// - Diziler (favorites/watchlist): çıplak sayısal ID (123)
// - Objeler (ratings/statuses): sayısal-string anahtar ("123")
// İkisi de "movie" kabul edilip MediaKey'e çevrilir. Zaten geçerli bir
// MediaKey ise dokunulmaz. Bir film hem eski hem yeni biçimde varsa (aynı
// movie ID), tek kayda indirilir; obje durumunda (ratings/statuses) yeni
// MediaKey kaydı önceliklidir.

function normalizeLegacyIdToMediaKey(value: unknown): MediaKey | null {
  if (typeof value === "number") {
    return Number.isInteger(value) && value > 0 ? createMovieKey(value) : null;
  }

  if (typeof value === "string" && isMediaKey(value)) {
    return value;
  }

  return null;
}

function parseMediaKeyList(rawValue: string | null): MediaKey[] {
  if (!rawValue) {
    return [];
  }

  try {
    const parsedValue: unknown = JSON.parse(rawValue);

    if (!Array.isArray(parsedValue)) {
      return [];
    }

    const seen = new Set<MediaKey>();
    const result: MediaKey[] = [];

    for (const item of parsedValue) {
      const key = normalizeLegacyIdToMediaKey(item);

      if (key && !seen.has(key)) {
        seen.add(key);
        result.push(key);
      }
    }

    return result;
  } catch {
    return [];
  }
}

function isValidRating(value: unknown): value is number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return false;
  }

  if (value < 1 || value > 10) {
    return false;
  }

  return Math.round(value * 2) === value * 2;
}

function clampRating(rating: number): number {
  const roundedToHalfStep = Math.round(rating * 2) / 2;

  return Math.min(10, Math.max(1, roundedToHalfStep));
}

// Ratings/statuses objeleri için ortak migrasyon: legacy (numeric-string
// anahtar) kayıtları önce toplanır, sonra geçerli MediaKey kayıtları bunların
// üzerine yazılır — böylece aynı film için çakışma olduğunda yeni MediaKey
// kaydı kazanır (rule: "Ratings/Watch status çakışmasında geçerli yeni
// MediaKey kaydı öncelikli olsun").
function parseMediaKeyRecord<T>(
  rawValue: string | null,
  isValidValue: (value: unknown) => value is T
): Record<MediaKey, T> {
  if (!rawValue) {
    return {};
  }

  try {
    const parsedValue: unknown = JSON.parse(rawValue);

    if (
      typeof parsedValue !== "object" ||
      parsedValue === null ||
      Array.isArray(parsedValue)
    ) {
      return {};
    }

    const legacyEntries: Record<string, T> = {};
    const mediaKeyEntries: Record<string, T> = {};

    for (const [rawKey, rawValueEntry] of Object.entries(
      parsedValue as Record<string, unknown>
    )) {
      if (!isValidValue(rawValueEntry)) {
        continue;
      }

      if (isMediaKey(rawKey)) {
        mediaKeyEntries[rawKey] = rawValueEntry;
        continue;
      }

      if (/^\d+$/.test(rawKey)) {
        const numericId = Number(rawKey);

        if (Number.isInteger(numericId) && numericId > 0) {
          legacyEntries[createMovieKey(numericId)] = rawValueEntry;
        }
      }
    }

    return { ...legacyEntries, ...mediaKeyEntries } as Record<MediaKey, T>;
  } catch {
    return {};
  }
}

function parseMediaRatings(rawValue: string | null): Record<MediaKey, number> {
  return parseMediaKeyRecord(rawValue, isValidRating);
}

function parseMediaWatchStatuses(
  rawValue: string | null
): Record<MediaKey, WatchStatus> {
  function isValidWatchStatus(value: unknown): value is WatchStatus {
    return (
      typeof value === "string" &&
      VALID_WATCH_STATUSES.includes(value as WatchStatus)
    );
  }

  return parseMediaKeyRecord(rawValue, isValidWatchStatus);
}

// ─── Store fabrikaları ──────────────────────────────────────────────────
//
// Her store, ham localStorage değerini okur; eğer içerik eski/karışık
// biçimdeyse migrasyon uygulanmış (kanonik) halini sessizce (custom event
// dispatch etmeden) geri yazar — rule: "Migrasyon custom event döngüsü
// oluşturmasın" ve "Her snapshot okumasında tekrar yazma". Bir kez
// kanonikleştirildikten sonra sonraki okumalarda ham değer zaten kanonik
// olduğundan tekrar parse/yazma yapılmaz.

function createIdsStore(key: string) {
  const eventName = `cinescope-storage:${key}`;
  let cachedRaw: string | null = null;
  let cachedKeys: MediaKey[] = EMPTY_KEYS;

  function readKeys(): MediaKey[] {
    const rawValue = localStorage.getItem(key);

    if (rawValue === cachedRaw) {
      return cachedKeys;
    }

    const migratedKeys = parseMediaKeyList(rawValue);

    if (rawValue === null) {
      cachedRaw = null;
    } else {
      const canonicalRaw = JSON.stringify(migratedKeys);

      if (rawValue !== canonicalRaw) {
        localStorage.setItem(key, canonicalRaw);
      }

      cachedRaw = canonicalRaw;
    }

    cachedKeys = migratedKeys;

    return cachedKeys;
  }

  function getSnapshot(): MediaKey[] {
    return readKeys();
  }

  function getServerSnapshot(): MediaKey[] {
    return EMPTY_KEYS;
  }

  function subscribe(onStoreChange: () => void): () => void {
    function handleStorage(event: StorageEvent) {
      if (event.key === key) {
        onStoreChange();
      }
    }

    window.addEventListener("storage", handleStorage);
    window.addEventListener(eventName, onStoreChange);

    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener(eventName, onStoreChange);
    };
  }

  function toggle(mediaKey: MediaKey) {
    const currentKeys = readKeys();
    const updatedKeys = currentKeys.includes(mediaKey)
      ? currentKeys.filter((existingKey) => existingKey !== mediaKey)
      : [...currentKeys, mediaKey];

    cachedRaw = JSON.stringify(updatedKeys);
    cachedKeys = updatedKeys;
    localStorage.setItem(key, cachedRaw);

    window.dispatchEvent(new Event(eventName));
  }

  function add(mediaKey: MediaKey) {
    const currentKeys = readKeys();

    if (currentKeys.includes(mediaKey)) {
      return;
    }

    const updatedKeys = [...currentKeys, mediaKey];

    cachedRaw = JSON.stringify(updatedKeys);
    cachedKeys = updatedKeys;
    localStorage.setItem(key, cachedRaw);

    window.dispatchEvent(new Event(eventName));
  }

  return { getSnapshot, getServerSnapshot, subscribe, toggle, add };
}

function createRatingsStore(key: string) {
  const eventName = `cinescope-storage:${key}`;
  let cachedRaw: string | null = null;
  let cachedRatings: Record<MediaKey, number> = EMPTY_RATINGS;

  function readRatings(): Record<MediaKey, number> {
    const rawValue = localStorage.getItem(key);

    if (rawValue === cachedRaw) {
      return cachedRatings;
    }

    const migratedRatings = parseMediaRatings(rawValue);

    if (rawValue === null) {
      cachedRaw = null;
    } else {
      const canonicalRaw = JSON.stringify(migratedRatings);

      if (rawValue !== canonicalRaw) {
        localStorage.setItem(key, canonicalRaw);
      }

      cachedRaw = canonicalRaw;
    }

    cachedRatings = migratedRatings;

    return cachedRatings;
  }

  function getSnapshot(): Record<MediaKey, number> {
    return readRatings();
  }

  function getServerSnapshot(): Record<MediaKey, number> {
    return EMPTY_RATINGS;
  }

  function subscribe(onStoreChange: () => void): () => void {
    function handleStorage(event: StorageEvent) {
      if (event.key === key) {
        onStoreChange();
      }
    }

    window.addEventListener("storage", handleStorage);
    window.addEventListener(eventName, onStoreChange);

    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener(eventName, onStoreChange);
    };
  }

  function setRating(mediaKey: MediaKey, rating: number) {
    const updatedRatings = {
      ...readRatings(),
      [mediaKey]: clampRating(rating),
    };

    cachedRaw = JSON.stringify(updatedRatings);
    cachedRatings = updatedRatings;
    localStorage.setItem(key, cachedRaw);

    window.dispatchEvent(new Event(eventName));
  }

  function removeRating(mediaKey: MediaKey) {
    const currentRatings = readRatings();

    if (!(mediaKey in currentRatings)) {
      return;
    }

    const updatedRatings = { ...currentRatings };

    delete updatedRatings[mediaKey];

    cachedRaw = JSON.stringify(updatedRatings);
    cachedRatings = updatedRatings;
    localStorage.setItem(key, cachedRaw);

    window.dispatchEvent(new Event(eventName));
  }

  return {
    getSnapshot,
    getServerSnapshot,
    subscribe,
    setRating,
    removeRating,
  };
}

function createWatchStatusesStore(key: string) {
  const eventName = `cinescope-storage:${key}`;
  let cachedRaw: string | null = null;
  let cachedStatuses: Record<MediaKey, WatchStatus> = EMPTY_WATCH_STATUSES;

  function readStatuses(): Record<MediaKey, WatchStatus> {
    const rawValue = localStorage.getItem(key);

    if (rawValue === cachedRaw) {
      return cachedStatuses;
    }

    const migratedStatuses = parseMediaWatchStatuses(rawValue);

    if (rawValue === null) {
      cachedRaw = null;
    } else {
      const canonicalRaw = JSON.stringify(migratedStatuses);

      if (rawValue !== canonicalRaw) {
        localStorage.setItem(key, canonicalRaw);
      }

      cachedRaw = canonicalRaw;
    }

    cachedStatuses = migratedStatuses;

    return cachedStatuses;
  }

  function getSnapshot(): Record<MediaKey, WatchStatus> {
    return readStatuses();
  }

  function getServerSnapshot(): Record<MediaKey, WatchStatus> {
    return EMPTY_WATCH_STATUSES;
  }

  function subscribe(onStoreChange: () => void): () => void {
    function handleStorage(event: StorageEvent) {
      if (event.key === key) {
        onStoreChange();
      }
    }

    window.addEventListener("storage", handleStorage);
    window.addEventListener(eventName, onStoreChange);

    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener(eventName, onStoreChange);
    };
  }

  function setStatus(mediaKey: MediaKey, status: WatchStatus) {
    const updatedStatuses = {
      ...readStatuses(),
      [mediaKey]: status,
    };

    cachedRaw = JSON.stringify(updatedStatuses);
    cachedStatuses = updatedStatuses;
    localStorage.setItem(key, cachedRaw);

    window.dispatchEvent(new Event(eventName));
  }

  function removeStatus(mediaKey: MediaKey) {
    const currentStatuses = readStatuses();

    if (!(mediaKey in currentStatuses)) {
      return;
    }

    const updatedStatuses = { ...currentStatuses };

    delete updatedStatuses[mediaKey];

    cachedRaw = JSON.stringify(updatedStatuses);
    cachedStatuses = updatedStatuses;
    localStorage.setItem(key, cachedRaw);

    window.dispatchEvent(new Event(eventName));
  }

  return {
    getSnapshot,
    getServerSnapshot,
    subscribe,
    setStatus,
    removeStatus,
  };
}

const favoritesStore = createIdsStore(FAVORITES_KEY);
const watchlistStore = createIdsStore(WATCHLIST_KEY);
const ratingsStore = createRatingsStore(RATINGS_KEY);
const watchStatusesStore = createWatchStatusesStore(WATCH_STATUSES_KEY);

const noopSubscribe = () => () => {};

function useHasMounted(): boolean {
  return useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false
  );
}

// mediaType === "movie" kayıtlarını filtreleyip sayısal ID dizisine indirger.
// tv:* kayıtları (henüz UI'da gösterilmediği için) burada güvenle atlanır —
// useMoviesByIds gibi film-odaklı tüketicilere asla ulaşmazlar.
function toMovieIds(mediaKeys: MediaKey[]): number[] {
  const movieIds = mediaKeys
    .filter((mediaKey) => getMediaType(mediaKey) === "movie")
    .map((mediaKey) => getMediaId(mediaKey));

  return movieIds.length > 0 ? movieIds : EMPTY_IDS;
}

function toMovieRecord<T>(
  mediaRecord: Record<MediaKey, T>,
  empty: Record<string, T>
): Record<string, T> {
  let result: Record<string, T> | null = null;

  for (const [mediaKey, value] of Object.entries(mediaRecord) as [
    MediaKey,
    T,
  ][]) {
    if (getMediaType(mediaKey) === "movie") {
      result ??= {};
      result[String(getMediaId(mediaKey))] = value;
    }
  }

  return result ?? empty;
}

export default function SavedMoviesProvider({
  children,
}: {
  children: ReactNode;
}) {
  const favoriteKeys = useSyncExternalStore(
    favoritesStore.subscribe,
    favoritesStore.getSnapshot,
    favoritesStore.getServerSnapshot
  );

  const watchlistKeys = useSyncExternalStore(
    watchlistStore.subscribe,
    watchlistStore.getSnapshot,
    watchlistStore.getServerSnapshot
  );

  const mediaRatings = useSyncExternalStore(
    ratingsStore.subscribe,
    ratingsStore.getSnapshot,
    ratingsStore.getServerSnapshot
  );

  const mediaStatuses = useSyncExternalStore(
    watchStatusesStore.subscribe,
    watchStatusesStore.getSnapshot,
    watchStatusesStore.getServerSnapshot
  );

  const isLoaded = useHasMounted();

  const favoriteIds = useMemo(() => toMovieIds(favoriteKeys), [favoriteKeys]);
  const watchlistIds = useMemo(
    () => toMovieIds(watchlistKeys),
    [watchlistKeys]
  );

  const ratings = useMemo(
    () => toMovieRecord(mediaRatings, EMPTY_MOVIE_RATINGS),
    [mediaRatings]
  );

  const statuses = useMemo(
    () => toMovieRecord(mediaStatuses, EMPTY_MOVIE_WATCH_STATUSES),
    [mediaStatuses]
  );

  const toggleFavoriteMedia = useCallback(
    (mediaType: MediaType, id: number) => {
      favoritesStore.toggle(createMediaKey(mediaType, id));
    },
    []
  );

  const toggleWatchlistMedia = useCallback(
    (mediaType: MediaType, id: number) => {
      watchlistStore.toggle(createMediaKey(mediaType, id));
    },
    []
  );

  const isFavoriteMedia = useCallback(
    (mediaType: MediaType, id: number) =>
      favoriteKeys.includes(createMediaKey(mediaType, id)),
    [favoriteKeys]
  );

  const isInWatchlistMedia = useCallback(
    (mediaType: MediaType, id: number) =>
      watchlistKeys.includes(createMediaKey(mediaType, id)),
    [watchlistKeys]
  );

  const toggleFavorite = useCallback(
    (movieId: number) => toggleFavoriteMedia("movie", movieId),
    [toggleFavoriteMedia]
  );

  const toggleWatchlist = useCallback(
    (movieId: number) => toggleWatchlistMedia("movie", movieId),
    [toggleWatchlistMedia]
  );

  const addToWatchlist = useCallback((movieId: number) => {
    watchlistStore.add(createMovieKey(movieId));
  }, []);

  const isFavorite = useCallback(
    (movieId: number) => isFavoriteMedia("movie", movieId),
    [isFavoriteMedia]
  );

  const isInWatchlist = useCallback(
    (movieId: number) => isInWatchlistMedia("movie", movieId),
    [isInWatchlistMedia]
  );

  const getMediaRating = useCallback(
    (mediaType: MediaType, id: number) =>
      mediaRatings[createMediaKey(mediaType, id)] ?? null,
    [mediaRatings]
  );

  const getMovieRating = useCallback(
    (movieId: number) => getMediaRating("movie", movieId),
    [getMediaRating]
  );

  const setMovieRating = useCallback((movieId: number, rating: number) => {
    ratingsStore.setRating(createMovieKey(movieId), rating);
  }, []);

  const removeMovieRating = useCallback((movieId: number) => {
    ratingsStore.removeRating(createMovieKey(movieId));
  }, []);

  const getMediaWatchStatus = useCallback(
    (mediaType: MediaType, id: number) =>
      mediaStatuses[createMediaKey(mediaType, id)] ?? null,
    [mediaStatuses]
  );

  const getWatchStatus = useCallback(
    (movieId: number) => getMediaWatchStatus("movie", movieId),
    [getMediaWatchStatus]
  );

  const setWatchStatus = useCallback(
    (movieId: number, status: WatchStatus) => {
      const mediaKey = createMovieKey(movieId);

      watchStatusesStore.setStatus(mediaKey, status);

      // "Daha Sonra İzle" seçmek filmi watchlist'e de ekler (kullanıcının
      // izleme niyetini tek bir yerde tekrar girmesine gerek kalmasın diye).
      // Ancak bu bağ tek yönlüdür: durumu sonradan değiştirmek veya
      // watchlist'ten manuel çıkarmak diğer alanı otomatik güncellemez —
      // aksi halde kullanıcı farkında olmadan veri kaybedebilir. İki sistem
      // bu aşamada kasıtlı olarak tamamen bağlı değildir.
      if (status === "plan-to-watch") {
        watchlistStore.add(mediaKey);
      }
    },
    []
  );

  const removeWatchStatus = useCallback((movieId: number) => {
    watchStatusesStore.removeStatus(createMovieKey(movieId));
  }, []);

  return (
    <SavedMoviesContext.Provider
      value={{
        favoriteIds,
        watchlistIds,
        isLoaded,
        isFavorite,
        isInWatchlist,
        toggleFavorite,
        toggleWatchlist,
        addToWatchlist,
        isFavoriteMedia,
        toggleFavoriteMedia,
        isInWatchlistMedia,
      }}
    >
      <MovieRatingsContext.Provider
        value={{
          ratings,
          isLoaded,
          getMovieRating,
          setMovieRating,
          removeMovieRating,
          getMediaRating,
        }}
      >
        <WatchStatusesContext.Provider
          value={{
            statuses,
            isLoaded,
            getWatchStatus,
            setWatchStatus,
            removeWatchStatus,
            getMediaWatchStatus,
          }}
        >
          {children}
        </WatchStatusesContext.Provider>
      </MovieRatingsContext.Provider>
    </SavedMoviesContext.Provider>
  );
}

export function useSavedMovies(): SavedMoviesContextValue {
  const context = useContext(SavedMoviesContext);

  if (!context) {
    throw new Error(
      "useSavedMovies must be used within a SavedMoviesProvider"
    );
  }

  return context;
}

export function useMovieRatings(): MovieRatingsContextValue {
  const context = useContext(MovieRatingsContext);

  if (!context) {
    throw new Error(
      "useMovieRatings must be used within a SavedMoviesProvider"
    );
  }

  return context;
}

export function useWatchStatuses(): WatchStatusesContextValue {
  const context = useContext(WatchStatusesContext);

  if (!context) {
    throw new Error(
      "useWatchStatuses must be used within a SavedMoviesProvider"
    );
  }

  return context;
}
