"use client";

import {
  createContext,
  useCallback,
  useContext,
  useSyncExternalStore,
  type ReactNode,
} from "react";

const FAVORITE_PEOPLE_KEY = "cinescope-favorite-people";
const FAVORITE_COMPANIES_KEY = "cinescope-favorite-companies";

// Güvenli üst sınırlar: localStorage sınırsız büyümesin ve arama sonucu
// tıklama fırtınasında liste kontrolsüz şişmesin.
const MAX_FAVORITE_ACTORS = 50;
const MAX_FAVORITE_DIRECTORS = 30;
const MAX_FAVORITE_COMPANIES = 30;

export type FavoritePersonRole = "actor" | "director";

export type FavoritePerson = {
  id: number;
  name: string;
  profilePath: string | null;
  role: FavoritePersonRole;
};

export type FavoriteCompany = {
  id: number;
  name: string;
  logoPath: string | null;
  originCountry: string | null;
};

// Ekleme/toggle sonucu — UI'ın "zaten favoride", "eklendi", "çıkarıldı" veya
// "limit doldu" durumlarını kullanıcıya anlaşılır biçimde göstermesi için.
export type AddFavoriteResult = "added" | "duplicate" | "limit-reached";
export type ToggleFavoriteResult = "added" | "removed" | "limit-reached";

const EMPTY_PEOPLE: FavoritePerson[] = [];
const EMPTY_COMPANIES: FavoriteCompany[] = [];

// ─── Parser yardımcıları ────────────────────────────────────────────────
//
// SavedMoviesProvider'daki desenle tutarlı: bozuk/geçersiz JSON veya
// geçersiz kayıtlar sessizce elenir, sayfa asla çökmez.

function isValidId(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value > 0;
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isNullableString(value: unknown): value is string | null {
  return value === null || typeof value === "string";
}

function isValidRole(value: unknown): value is FavoritePersonRole {
  return value === "actor" || value === "director";
}

function parseFavoritePerson(raw: unknown): FavoritePerson | null {
  if (typeof raw !== "object" || raw === null) {
    return null;
  }

  const candidate = raw as Record<string, unknown>;

  if (
    !isValidId(candidate.id) ||
    !isNonEmptyString(candidate.name) ||
    !isValidRole(candidate.role) ||
    !isNullableString(candidate.profilePath ?? null)
  ) {
    return null;
  }

  return {
    id: candidate.id,
    name: candidate.name,
    profilePath: (candidate.profilePath as string | null) ?? null,
    role: candidate.role,
  };
}

// Sıra korunur, aynı id+role kombinasyonu bir kez sayılır; bozuk/harici
// biçimde şişirilmiş bir kayıt bile rol başına güvenli sınırın üzerine
// çıkamaz (yalnızca ekleme anında değil, okuma anında da uygulanır).
function parseFavoritePeopleList(rawValue: string | null): FavoritePerson[] {
  if (!rawValue) {
    return [];
  }

  try {
    const parsedValue: unknown = JSON.parse(rawValue);

    if (!Array.isArray(parsedValue)) {
      return [];
    }

    const seen = new Set<string>();
    const result: FavoritePerson[] = [];
    let actorCount = 0;
    let directorCount = 0;

    for (const item of parsedValue) {
      const person = parseFavoritePerson(item);

      if (!person) {
        continue;
      }

      const key = `${person.id}:${person.role}`;

      if (seen.has(key)) {
        continue;
      }

      if (person.role === "actor") {
        if (actorCount >= MAX_FAVORITE_ACTORS) {
          continue;
        }

        actorCount += 1;
      } else {
        if (directorCount >= MAX_FAVORITE_DIRECTORS) {
          continue;
        }

        directorCount += 1;
      }

      seen.add(key);
      result.push(person);
    }

    return result;
  } catch {
    return [];
  }
}

function parseFavoriteCompany(raw: unknown): FavoriteCompany | null {
  if (typeof raw !== "object" || raw === null) {
    return null;
  }

  const candidate = raw as Record<string, unknown>;

  if (
    !isValidId(candidate.id) ||
    !isNonEmptyString(candidate.name) ||
    !isNullableString(candidate.logoPath ?? null) ||
    !isNullableString(candidate.originCountry ?? null)
  ) {
    return null;
  }

  return {
    id: candidate.id,
    name: candidate.name,
    logoPath: (candidate.logoPath as string | null) ?? null,
    originCountry: (candidate.originCountry as string | null) ?? null,
  };
}

function parseFavoriteCompaniesList(
  rawValue: string | null
): FavoriteCompany[] {
  if (!rawValue) {
    return [];
  }

  try {
    const parsedValue: unknown = JSON.parse(rawValue);

    if (!Array.isArray(parsedValue)) {
      return [];
    }

    const seen = new Set<number>();
    const result: FavoriteCompany[] = [];

    for (const item of parsedValue) {
      const company = parseFavoriteCompany(item);

      if (!company || seen.has(company.id)) {
        continue;
      }

      if (result.length >= MAX_FAVORITE_COMPANIES) {
        continue;
      }

      seen.add(company.id);
      result.push(company);
    }

    return result;
  } catch {
    return [];
  }
}

// ─── Store fabrikaları ──────────────────────────────────────────────────
//
// SavedMoviesProvider'daki createIdsStore/createRatingsStore ile aynı
// desen: modül seviyesinde tek instance, cached raw/parsed çift (stabil
// snapshot referansı için), aynı sekme için custom event, farklı sekme
// için storage event, ilk okumada kanonik olmayan veriyi sessizce
// (event dispatch etmeden) geri yazma.

function createFavoritePeopleStore(key: string) {
  const eventName = `cinescope-storage:${key}`;
  let cachedRaw: string | null = null;
  let cachedPeople: FavoritePerson[] = EMPTY_PEOPLE;

  function readPeople(): FavoritePerson[] {
    const rawValue = localStorage.getItem(key);

    if (rawValue === cachedRaw) {
      return cachedPeople;
    }

    const migratedPeople = parseFavoritePeopleList(rawValue);

    if (rawValue === null) {
      cachedRaw = null;
    } else {
      const canonicalRaw = JSON.stringify(migratedPeople);

      if (rawValue !== canonicalRaw) {
        localStorage.setItem(key, canonicalRaw);
      }

      cachedRaw = canonicalRaw;
    }

    cachedPeople = migratedPeople;

    return cachedPeople;
  }

  function getSnapshot(): FavoritePerson[] {
    return readPeople();
  }

  function getServerSnapshot(): FavoritePerson[] {
    return EMPTY_PEOPLE;
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

  function commit(updatedPeople: FavoritePerson[]) {
    cachedRaw = JSON.stringify(updatedPeople);
    cachedPeople = updatedPeople;
    localStorage.setItem(key, cachedRaw);

    window.dispatchEvent(new Event(eventName));
  }

  function roleLimit(role: FavoritePersonRole): number {
    return role === "actor" ? MAX_FAVORITE_ACTORS : MAX_FAVORITE_DIRECTORS;
  }

  function add(person: FavoritePerson): AddFavoriteResult {
    const currentPeople = readPeople();
    const exists = currentPeople.some(
      (existing) => existing.id === person.id && existing.role === person.role
    );

    if (exists) {
      return "duplicate";
    }

    const roleCount = currentPeople.filter(
      (existing) => existing.role === person.role
    ).length;

    if (roleCount >= roleLimit(person.role)) {
      return "limit-reached";
    }

    commit([...currentPeople, person]);

    return "added";
  }

  function remove(id: number, role: FavoritePersonRole) {
    const currentPeople = readPeople();
    const updatedPeople = currentPeople.filter(
      (existing) => !(existing.id === id && existing.role === role)
    );

    if (updatedPeople.length === currentPeople.length) {
      return;
    }

    commit(updatedPeople);
  }

  function toggle(person: FavoritePerson): ToggleFavoriteResult {
    const currentPeople = readPeople();
    const exists = currentPeople.some(
      (existing) => existing.id === person.id && existing.role === person.role
    );

    if (exists) {
      commit(
        currentPeople.filter(
          (existing) =>
            !(existing.id === person.id && existing.role === person.role)
        )
      );

      return "removed";
    }

    const roleCount = currentPeople.filter(
      (existing) => existing.role === person.role
    ).length;

    if (roleCount >= roleLimit(person.role)) {
      return "limit-reached";
    }

    commit([...currentPeople, person]);

    return "added";
  }

  return { getSnapshot, getServerSnapshot, subscribe, add, remove, toggle };
}

function createFavoriteCompaniesStore(key: string) {
  const eventName = `cinescope-storage:${key}`;
  let cachedRaw: string | null = null;
  let cachedCompanies: FavoriteCompany[] = EMPTY_COMPANIES;

  function readCompanies(): FavoriteCompany[] {
    const rawValue = localStorage.getItem(key);

    if (rawValue === cachedRaw) {
      return cachedCompanies;
    }

    const migratedCompanies = parseFavoriteCompaniesList(rawValue);

    if (rawValue === null) {
      cachedRaw = null;
    } else {
      const canonicalRaw = JSON.stringify(migratedCompanies);

      if (rawValue !== canonicalRaw) {
        localStorage.setItem(key, canonicalRaw);
      }

      cachedRaw = canonicalRaw;
    }

    cachedCompanies = migratedCompanies;

    return cachedCompanies;
  }

  function getSnapshot(): FavoriteCompany[] {
    return readCompanies();
  }

  function getServerSnapshot(): FavoriteCompany[] {
    return EMPTY_COMPANIES;
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

  function commit(updatedCompanies: FavoriteCompany[]) {
    cachedRaw = JSON.stringify(updatedCompanies);
    cachedCompanies = updatedCompanies;
    localStorage.setItem(key, cachedRaw);

    window.dispatchEvent(new Event(eventName));
  }

  function add(company: FavoriteCompany): AddFavoriteResult {
    const currentCompanies = readCompanies();
    const exists = currentCompanies.some(
      (existing) => existing.id === company.id
    );

    if (exists) {
      return "duplicate";
    }

    if (currentCompanies.length >= MAX_FAVORITE_COMPANIES) {
      return "limit-reached";
    }

    commit([...currentCompanies, company]);

    return "added";
  }

  function remove(id: number) {
    const currentCompanies = readCompanies();
    const updatedCompanies = currentCompanies.filter(
      (existing) => existing.id !== id
    );

    if (updatedCompanies.length === currentCompanies.length) {
      return;
    }

    commit(updatedCompanies);
  }

  function toggle(company: FavoriteCompany): ToggleFavoriteResult {
    const currentCompanies = readCompanies();
    const exists = currentCompanies.some(
      (existing) => existing.id === company.id
    );

    if (exists) {
      commit(currentCompanies.filter((existing) => existing.id !== company.id));

      return "removed";
    }

    if (currentCompanies.length >= MAX_FAVORITE_COMPANIES) {
      return "limit-reached";
    }

    commit([...currentCompanies, company]);

    return "added";
  }

  return { getSnapshot, getServerSnapshot, subscribe, add, remove, toggle };
}

const favoritePeopleStore = createFavoritePeopleStore(FAVORITE_PEOPLE_KEY);
const favoriteCompaniesStore = createFavoriteCompaniesStore(
  FAVORITE_COMPANIES_KEY
);

const noopSubscribe = () => () => {};

function useHasMounted(): boolean {
  return useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false
  );
}

// ─── Context ─────────────────────────────────────────────────────────────

type FavoritePeopleContextValue = {
  favoritePeople: FavoritePerson[];
  isLoaded: boolean;
  isFavoritePerson: (id: number, role: FavoritePersonRole) => boolean;
  addFavoritePerson: (person: FavoritePerson) => AddFavoriteResult;
  removeFavoritePerson: (id: number, role: FavoritePersonRole) => void;
  toggleFavoritePerson: (person: FavoritePerson) => ToggleFavoriteResult;
};

const FavoritePeopleContext =
  createContext<FavoritePeopleContextValue | null>(null);

type FavoriteCompaniesContextValue = {
  favoriteCompanies: FavoriteCompany[];
  isLoaded: boolean;
  isFavoriteCompany: (id: number) => boolean;
  addFavoriteCompany: (company: FavoriteCompany) => AddFavoriteResult;
  removeFavoriteCompany: (id: number) => void;
  toggleFavoriteCompany: (company: FavoriteCompany) => ToggleFavoriteResult;
};

const FavoriteCompaniesContext =
  createContext<FavoriteCompaniesContextValue | null>(null);

export default function PreferenceProvider({
  children,
}: {
  children: ReactNode;
}) {
  const favoritePeople = useSyncExternalStore(
    favoritePeopleStore.subscribe,
    favoritePeopleStore.getSnapshot,
    favoritePeopleStore.getServerSnapshot
  );

  const favoriteCompanies = useSyncExternalStore(
    favoriteCompaniesStore.subscribe,
    favoriteCompaniesStore.getSnapshot,
    favoriteCompaniesStore.getServerSnapshot
  );

  const isLoaded = useHasMounted();

  const isFavoritePerson = useCallback(
    (id: number, role: FavoritePersonRole) =>
      favoritePeople.some(
        (person) => person.id === id && person.role === role
      ),
    [favoritePeople]
  );

  const addFavoritePerson = useCallback(
    (person: FavoritePerson) => favoritePeopleStore.add(person),
    []
  );

  const removeFavoritePerson = useCallback(
    (id: number, role: FavoritePersonRole) =>
      favoritePeopleStore.remove(id, role),
    []
  );

  const toggleFavoritePerson = useCallback(
    (person: FavoritePerson) => favoritePeopleStore.toggle(person),
    []
  );

  const isFavoriteCompany = useCallback(
    (id: number) =>
      favoriteCompanies.some((company) => company.id === id),
    [favoriteCompanies]
  );

  const addFavoriteCompany = useCallback(
    (company: FavoriteCompany) => favoriteCompaniesStore.add(company),
    []
  );

  const removeFavoriteCompany = useCallback(
    (id: number) => favoriteCompaniesStore.remove(id),
    []
  );

  const toggleFavoriteCompany = useCallback(
    (company: FavoriteCompany) => favoriteCompaniesStore.toggle(company),
    []
  );

  return (
    <FavoritePeopleContext.Provider
      value={{
        favoritePeople,
        isLoaded,
        isFavoritePerson,
        addFavoritePerson,
        removeFavoritePerson,
        toggleFavoritePerson,
      }}
    >
      <FavoriteCompaniesContext.Provider
        value={{
          favoriteCompanies,
          isLoaded,
          isFavoriteCompany,
          addFavoriteCompany,
          removeFavoriteCompany,
          toggleFavoriteCompany,
        }}
      >
        {children}
      </FavoriteCompaniesContext.Provider>
    </FavoritePeopleContext.Provider>
  );
}

export function useFavoritePeople(): FavoritePeopleContextValue {
  const context = useContext(FavoritePeopleContext);

  if (!context) {
    throw new Error(
      "useFavoritePeople must be used within a PreferenceProvider"
    );
  }

  return context;
}

export function useFavoriteCompanies(): FavoriteCompaniesContextValue {
  const context = useContext(FavoriteCompaniesContext);

  if (!context) {
    throw new Error(
      "useFavoriteCompanies must be used within a PreferenceProvider"
    );
  }

  return context;
}
