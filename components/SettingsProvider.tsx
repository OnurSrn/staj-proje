"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import {
  DEFAULT_SETTINGS,
  LANGUAGE_COOKIE_KEY,
  normalizeRegionCode,
  parseAppSettings,
  resolveTheme,
  serializeAppSettings,
  SETTINGS_STORAGE_KEY,
  type AppLanguage,
  type AppSettings,
  type AppTheme,
} from "@/lib/settings";

// Server Component'ler (movie/person detail, home, vb.) localStorage'a
// erişemediği için dil tercihi burada ayrıca küçük bir cookie'ye yazılır —
// bkz. lib/serverLanguage.ts. Yalnızca dil taşınır (tema/bölge cookie'ye
// yazılmaz); "Secure" bayrağı yalnızca https altında eklenir ki http
// üzerindeki local geliştirme ortamında cookie sessizce reddedilmesin.
function syncLanguageCookie(language: AppLanguage) {
  const secureAttribute =
    window.location.protocol === "https:" ? "; Secure" : "";

  document.cookie = `${LANGUAGE_COOKIE_KEY}=${language}; path=/; max-age=31536000; samesite=lax${secureAttribute}`;
}

// SavedMoviesProvider/PreferenceProvider'daki store fabrikası deseniyle
// tutarlı: modül seviyesinde tek instance, cached raw/parsed çift (stabil
// snapshot referansı), aynı sekme için custom event, farklı sekme için
// storage event.
function createSettingsStore(key: string) {
  const eventName = `cinescope-storage:${key}`;
  let cachedRaw: string | null = null;
  let cachedSettings: AppSettings = DEFAULT_SETTINGS;

  function readSettings(): AppSettings {
    const rawValue = localStorage.getItem(key);

    if (rawValue === cachedRaw) {
      return cachedSettings;
    }

    cachedRaw = rawValue;
    cachedSettings = parseAppSettings(rawValue);

    return cachedSettings;
  }

  function getSnapshot(): AppSettings {
    return readSettings();
  }

  function getServerSnapshot(): AppSettings {
    return DEFAULT_SETTINGS;
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

  function commit(updatedSettings: AppSettings) {
    cachedRaw = serializeAppSettings(updatedSettings);
    cachedSettings = updatedSettings;
    localStorage.setItem(key, cachedRaw);
    syncLanguageCookie(updatedSettings.language);

    window.dispatchEvent(new Event(eventName));
  }

  function setLanguage(language: AppLanguage) {
    commit({ ...readSettings(), language });
  }

  function setTheme(theme: AppTheme) {
    commit({ ...readSettings(), theme });
  }

  function setRegion(region: string) {
    commit({ ...readSettings(), region: normalizeRegionCode(region) });
  }

  function reset() {
    commit(DEFAULT_SETTINGS);
  }

  return {
    getSnapshot,
    getServerSnapshot,
    subscribe,
    setLanguage,
    setTheme,
    setRegion,
    reset,
  };
}

const settingsStore = createSettingsStore(SETTINGS_STORAGE_KEY);

const noopSubscribe = () => () => {};

function useHasMounted(): boolean {
  return useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false
  );
}

type SettingsContextValue = {
  settings: AppSettings;
  isLoaded: boolean;
  setLanguage: (language: AppLanguage) => void;
  setTheme: (theme: AppTheme) => void;
  setRegion: (region: string) => void;
  resetSettings: () => void;
};

const SettingsContext = createContext<SettingsContextValue | null>(null);

export default function SettingsProvider({
  children,
  initialLanguage,
}: {
  children: ReactNode;
  // Root layout'ta (Server Component) getServerLanguage() ile cookie'den
  // okunur ve buraya prop olarak geçirilir. Sunucu render'ı ile istemcinin
  // hydration render'ı bu prop sayesinde AYNI dili kullanır (localStorage
  // henüz mount öncesi hiç okunmadığı için useSyncExternalStore'un
  // getServerSnapshot'ı burada devreye girmez) — bu, "önce tr sonra en'e
  // zıplama" flaşını engelleyen asıl mekanizma. isLoaded true olduktan
  // sonra gerçek (localStorage tabanlı) değere sorunsuzca geçilir çünkü
  // cookie her zaman localStorage ile senkron tutulur (syncLanguageCookie).
  initialLanguage?: AppLanguage;
}) {
  const storeSettings = useSyncExternalStore(
    settingsStore.subscribe,
    settingsStore.getSnapshot,
    settingsStore.getServerSnapshot
  );

  const isLoaded = useHasMounted();

  const settings: AppSettings = isLoaded
    ? storeSettings
    : {
        ...storeSettings,
        language: initialLanguage ?? storeSettings.language,
      };

  // Kendini onaran senkronizasyon: cookie silinmiş ama localStorage hâlâ
  // farklı bir dil taşıyorsa (nadir bir uyumsuzluk), bir sonraki server
  // render'ının doğru dili görebilmesi için cookie burada localStorage'daki
  // gerçek değere göre düzeltilir.
  useEffect(() => {
    if (isLoaded && storeSettings.language !== initialLanguage) {
      syncLanguageCookie(storeSettings.language);
    }
  }, [isLoaded, storeSettings.language, initialLanguage]);

  // Tema DOM'a burada uygulanır: mount'ta bir kez, theme değişince tekrar.
  // "system" seçiliyken cihaz tercihi canlı izlenir; diğer durumlarda hiç
  // listener eklenmez (gereksiz iş yok). app/layout.tsx'teki inline script
  // ilk paint öncesi aynı sonucu zaten uyguladığı için burada flash
  // oluşmaz — bu efekt yalnızca sonraki değişiklikleri senkronize eder.
  useEffect(() => {
    function applyResolvedTheme() {
      const prefersDark = window.matchMedia(
        "(prefers-color-scheme: dark)"
      ).matches;

      document.documentElement.setAttribute(
        "data-theme",
        resolveTheme(settings.theme, prefersDark)
      );
    }

    applyResolvedTheme();

    if (settings.theme !== "system") {
      return;
    }

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    mediaQuery.addEventListener("change", applyResolvedTheme);

    return () => {
      mediaQuery.removeEventListener("change", applyResolvedTheme);
    };
  }, [settings.theme]);

  const setLanguage = useCallback(
    (language: AppLanguage) => settingsStore.setLanguage(language),
    []
  );

  const setTheme = useCallback(
    (theme: AppTheme) => settingsStore.setTheme(theme),
    []
  );

  const setRegion = useCallback(
    (region: string) => settingsStore.setRegion(region),
    []
  );

  const resetSettings = useCallback(() => settingsStore.reset(), []);

  return (
    <SettingsContext.Provider
      value={{ settings, isLoaded, setLanguage, setTheme, setRegion, resetSettings }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings(): SettingsContextValue {
  const context = useContext(SettingsContext);

  if (!context) {
    throw new Error("useSettings must be used within a SettingsProvider");
  }

  return context;
}
