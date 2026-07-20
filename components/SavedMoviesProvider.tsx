"use client";

import {
  createContext,
  useCallback,
  useContext,
  useSyncExternalStore,
  type ReactNode,
} from "react";

const FAVORITES_KEY = "cinescope-favorites";
const WATCHLIST_KEY = "cinescope-watchlist";
const RATINGS_KEY = "cinescope-movie-ratings";
const WATCH_STATUSES_KEY = "cinescope-watch-statuses";

const EMPTY_IDS: number[] = [];
const EMPTY_RATINGS: Record<string, number> = {};
const EMPTY_WATCH_STATUSES: Record<string, WatchStatus> = {};

export type WatchStatus = "watched" | "watching" | "dropped" | "plan-to-watch";

const VALID_WATCH_STATUSES: WatchStatus[] = [
  "watched",
  "watching",
  "dropped",
  "plan-to-watch",
];

type SavedMoviesContextValue = {
  favoriteIds: number[];
  watchlistIds: number[];
  isLoaded: boolean;
  isFavorite: (movieId: number) => boolean;
  isInWatchlist: (movieId: number) => boolean;
  toggleFavorite: (movieId: number) => void;
  toggleWatchlist: (movieId: number) => void;
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
};

const WatchStatusesContext =
  createContext<WatchStatusesContextValue | null>(null);

function parseIds(rawValue: string | null): number[] {
  if (!rawValue) {
    return [];
  }

  try {
    const parsedValue: unknown = JSON.parse(rawValue);

    if (!Array.isArray(parsedValue)) {
      return [];
    }

    return parsedValue.filter(
      (value): value is number => typeof value === "number"
    );
  } catch {
    return [];
  }
}

function toggleMovieId(currentIds: number[], movieId: number): number[] {
  return currentIds.includes(movieId)
    ? currentIds.filter((id) => id !== movieId)
    : [...currentIds, movieId];
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

function parseRatings(rawValue: string | null): Record<string, number> {
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

    const validRatings: Record<string, number> = {};

    for (const [movieId, rating] of Object.entries(
      parsedValue as Record<string, unknown>
    )) {
      if (/^\d+$/.test(movieId) && isValidRating(rating)) {
        validRatings[movieId] = rating;
      }
    }

    return validRatings;
  } catch {
    return {};
  }
}

function isValidWatchStatus(value: unknown): value is WatchStatus {
  return (
    typeof value === "string" &&
    VALID_WATCH_STATUSES.includes(value as WatchStatus)
  );
}

function parseWatchStatuses(
  rawValue: string | null
): Record<string, WatchStatus> {
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

    const validStatuses: Record<string, WatchStatus> = {};

    for (const [movieId, status] of Object.entries(
      parsedValue as Record<string, unknown>
    )) {
      if (/^\d+$/.test(movieId) && isValidWatchStatus(status)) {
        validStatuses[movieId] = status;
      }
    }

    return validStatuses;
  } catch {
    return {};
  }
}

function createIdsStore(key: string) {
  const eventName = `cinescope-storage:${key}`;
  let cachedRaw: string | null = null;
  let cachedIds: number[] = EMPTY_IDS;

  function readIds(): number[] {
    const rawValue = localStorage.getItem(key);

    if (rawValue !== cachedRaw) {
      cachedRaw = rawValue;
      cachedIds = parseIds(rawValue);
    }

    return cachedIds;
  }

  function getSnapshot(): number[] {
    return readIds();
  }

  function getServerSnapshot(): number[] {
    return EMPTY_IDS;
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

  function toggle(movieId: number) {
    const updatedIds = toggleMovieId(readIds(), movieId);

    cachedRaw = JSON.stringify(updatedIds);
    cachedIds = updatedIds;
    localStorage.setItem(key, cachedRaw);

    window.dispatchEvent(new Event(eventName));
  }

  function add(movieId: number) {
    const currentIds = readIds();

    if (currentIds.includes(movieId)) {
      return;
    }

    const updatedIds = [...currentIds, movieId];

    cachedRaw = JSON.stringify(updatedIds);
    cachedIds = updatedIds;
    localStorage.setItem(key, cachedRaw);

    window.dispatchEvent(new Event(eventName));
  }

  return { getSnapshot, getServerSnapshot, subscribe, toggle, add };
}

function createRatingsStore(key: string) {
  const eventName = `cinescope-storage:${key}`;
  let cachedRaw: string | null = null;
  let cachedRatings: Record<string, number> = EMPTY_RATINGS;

  function readRatings(): Record<string, number> {
    const rawValue = localStorage.getItem(key);

    if (rawValue !== cachedRaw) {
      cachedRaw = rawValue;
      cachedRatings = parseRatings(rawValue);
    }

    return cachedRatings;
  }

  function getSnapshot(): Record<string, number> {
    return readRatings();
  }

  function getServerSnapshot(): Record<string, number> {
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

  function setRating(movieId: number, rating: number) {
    const updatedRatings = {
      ...readRatings(),
      [String(movieId)]: clampRating(rating),
    };

    cachedRaw = JSON.stringify(updatedRatings);
    cachedRatings = updatedRatings;
    localStorage.setItem(key, cachedRaw);

    window.dispatchEvent(new Event(eventName));
  }

  function removeRating(movieId: number) {
    const currentRatings = readRatings();
    const movieKey = String(movieId);

    if (!(movieKey in currentRatings)) {
      return;
    }

    const updatedRatings = { ...currentRatings };

    delete updatedRatings[movieKey];

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
  let cachedStatuses: Record<string, WatchStatus> = EMPTY_WATCH_STATUSES;

  function readStatuses(): Record<string, WatchStatus> {
    const rawValue = localStorage.getItem(key);

    if (rawValue !== cachedRaw) {
      cachedRaw = rawValue;
      cachedStatuses = parseWatchStatuses(rawValue);
    }

    return cachedStatuses;
  }

  function getSnapshot(): Record<string, WatchStatus> {
    return readStatuses();
  }

  function getServerSnapshot(): Record<string, WatchStatus> {
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

  function setStatus(movieId: number, status: WatchStatus) {
    const updatedStatuses = {
      ...readStatuses(),
      [String(movieId)]: status,
    };

    cachedRaw = JSON.stringify(updatedStatuses);
    cachedStatuses = updatedStatuses;
    localStorage.setItem(key, cachedRaw);

    window.dispatchEvent(new Event(eventName));
  }

  function removeStatus(movieId: number) {
    const currentStatuses = readStatuses();
    const movieKey = String(movieId);

    if (!(movieKey in currentStatuses)) {
      return;
    }

    const updatedStatuses = { ...currentStatuses };

    delete updatedStatuses[movieKey];

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

export default function SavedMoviesProvider({
  children,
}: {
  children: ReactNode;
}) {
  const favoriteIds = useSyncExternalStore(
    favoritesStore.subscribe,
    favoritesStore.getSnapshot,
    favoritesStore.getServerSnapshot
  );

  const watchlistIds = useSyncExternalStore(
    watchlistStore.subscribe,
    watchlistStore.getSnapshot,
    watchlistStore.getServerSnapshot
  );

  const ratings = useSyncExternalStore(
    ratingsStore.subscribe,
    ratingsStore.getSnapshot,
    ratingsStore.getServerSnapshot
  );

  const statuses = useSyncExternalStore(
    watchStatusesStore.subscribe,
    watchStatusesStore.getSnapshot,
    watchStatusesStore.getServerSnapshot
  );

  const isLoaded = useHasMounted();

  const toggleFavorite = useCallback((movieId: number) => {
    favoritesStore.toggle(movieId);
  }, []);

  const toggleWatchlist = useCallback((movieId: number) => {
    watchlistStore.toggle(movieId);
  }, []);

  const isFavorite = useCallback(
    (movieId: number) => favoriteIds.includes(movieId),
    [favoriteIds]
  );

  const isInWatchlist = useCallback(
    (movieId: number) => watchlistIds.includes(movieId),
    [watchlistIds]
  );

  const getMovieRating = useCallback(
    (movieId: number) => ratings[String(movieId)] ?? null,
    [ratings]
  );

  const setMovieRating = useCallback((movieId: number, rating: number) => {
    ratingsStore.setRating(movieId, rating);
  }, []);

  const removeMovieRating = useCallback((movieId: number) => {
    ratingsStore.removeRating(movieId);
  }, []);

  const getWatchStatus = useCallback(
    (movieId: number) => statuses[String(movieId)] ?? null,
    [statuses]
  );

  const setWatchStatus = useCallback(
    (movieId: number, status: WatchStatus) => {
      watchStatusesStore.setStatus(movieId, status);

      // "Daha Sonra İzle" seçmek filmi watchlist'e de ekler (kullanıcının
      // izleme niyetini tek bir yerde tekrar girmesine gerek kalmasın diye).
      // Ancak bu bağ tek yönlüdür: durumu sonradan değiştirmek veya
      // watchlist'ten manuel çıkarmak diğer alanı otomatik güncellemez —
      // aksi halde kullanıcı farkında olmadan veri kaybedebilir. İki sistem
      // bu aşamada kasıtlı olarak tamamen bağlı değildir.
      if (status === "plan-to-watch") {
        watchlistStore.add(movieId);
      }
    },
    []
  );

  const removeWatchStatus = useCallback((movieId: number) => {
    watchStatusesStore.removeStatus(movieId);
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
      }}
    >
      <MovieRatingsContext.Provider
        value={{
          ratings,
          isLoaded,
          getMovieRating,
          setMovieRating,
          removeMovieRating,
        }}
      >
        <WatchStatusesContext.Provider
          value={{
            statuses,
            isLoaded,
            getWatchStatus,
            setWatchStatus,
            removeWatchStatus,
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
