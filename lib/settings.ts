// Merkezi, tip güvenli ayarlar modeli. localStorage'a yazılan/okunan tek
// yer burasıdır — Provider ve inline tema script'i (app/layout.tsx) bu
// dosyadaki sabitlerle tutarlı kalmalıdır.

export const SETTINGS_STORAGE_KEY = "cinescope-settings";

// Server Component'ler localStorage'a erişemez; dil tercihi bu küçük,
// yalnızca dil taşıyan cookie üzerinden senkronize edilir (bkz.
// components/SettingsProvider.tsx ve lib/serverLanguage.ts). Tema/bölge
// cookie'ye yazılmaz — tema zaten inline script + data-theme ile,
// bölge de bu görevde yalnızca client tarafında kullanılıyor.
export const LANGUAGE_COOKIE_KEY = "cinescope-lang";

// Şu an tek sürüm var; ileride alan şekli değişirse parseAppSettings içine
// version'a göre bir migration adımı eklenebilir. Bugün için ayrı bir
// migration framework/registry kurmuyoruz — versiyon sadece yazılan JSON'a
// gömülü bilgi.
export const SETTINGS_VERSION = 1;

export type AppLanguage = "tr" | "en";

export type AppTheme = "system" | "dark" | "light";

export type ResolvedTheme = "dark" | "light";

export type AppRegion = {
  isoCode: string;
  nameTr: string;
  nameEn: string;
};

export type AppSettings = {
  language: AppLanguage;
  theme: AppTheme;
  region: string;
};

export const DEFAULT_SETTINGS: AppSettings = {
  language: "tr",
  theme: "system",
  region: "TR",
};

// Watch Providers gibi gelecekteki özellikler için güvenli, sabit başlangıç
// listesi. TMDB available-regions endpoint'iyle genişletilebilir; bu
// görevde dış API çağrısı yapılmıyor.
export const SUPPORTED_REGIONS: AppRegion[] = [
  { isoCode: "TR", nameTr: "Türkiye", nameEn: "Türkiye" },
  { isoCode: "US", nameTr: "Amerika Birleşik Devletleri", nameEn: "United States" },
  { isoCode: "GB", nameTr: "Birleşik Krallık", nameEn: "United Kingdom" },
  { isoCode: "DE", nameTr: "Almanya", nameEn: "Germany" },
  { isoCode: "FR", nameTr: "Fransa", nameEn: "France" },
  { isoCode: "ES", nameTr: "İspanya", nameEn: "Spain" },
  { isoCode: "IT", nameTr: "İtalya", nameEn: "Italy" },
  { isoCode: "NL", nameTr: "Hollanda", nameEn: "Netherlands" },
  { isoCode: "CA", nameTr: "Kanada", nameEn: "Canada" },
  { isoCode: "AU", nameTr: "Avustralya", nameEn: "Australia" },
  { isoCode: "JP", nameTr: "Japonya", nameEn: "Japan" },
  { isoCode: "KR", nameTr: "Güney Kore", nameEn: "South Korea" },
  { isoCode: "IN", nameTr: "Hindistan", nameEn: "India" },
  { isoCode: "BR", nameTr: "Brezilya", nameEn: "Brazil" },
  { isoCode: "MX", nameTr: "Meksika", nameEn: "Mexico" },
];

const SUPPORTED_REGION_CODES = new Set(
  SUPPORTED_REGIONS.map((region) => region.isoCode)
);

export function isAppLanguage(value: unknown): value is AppLanguage {
  return value === "tr" || value === "en";
}

export function isAppTheme(value: unknown): value is AppTheme {
  return value === "system" || value === "dark" || value === "light";
}

// "us" gibi küçük harfli ama tanınan bir kod büyük harfe normalize edilir;
// tanınmayan/geçersiz her şey TR'ye düşer (bkz. görev talimatı bölüm 5).
export function normalizeRegionCode(value: unknown): string {
  if (typeof value !== "string") {
    return DEFAULT_SETTINGS.region;
  }

  const upperCased = value.trim().toUpperCase();

  return SUPPORTED_REGION_CODES.has(upperCased)
    ? upperCased
    : DEFAULT_SETTINGS.region;
}

export function getRegionByCode(isoCode: string): AppRegion | null {
  return (
    SUPPORTED_REGIONS.find((region) => region.isoCode === isoCode) ?? null
  );
}

export function getRegionName(region: AppRegion, language: AppLanguage): string {
  return language === "tr" ? region.nameTr : region.nameEn;
}

// Ham localStorage değerini güvenli AppSettings'e çevirir. JSON tamamen
// bozuksa veya obje değilse tüm varsayılanlara düşer; obje geçerliyse her
// alan kendi başına doğrulanır (biri geçersizse yalnızca o alan varsayılana
// döner) ve tanınmayan ekstra alanlar (ör. eski/gelecek sürüm alanları)
// sessizce yok sayılır — asla döndürülen nesneye sızmazlar.
export function parseAppSettings(rawValue: string | null): AppSettings {
  if (!rawValue) {
    return DEFAULT_SETTINGS;
  }

  try {
    const parsedValue: unknown = JSON.parse(rawValue);

    if (typeof parsedValue !== "object" || parsedValue === null) {
      return DEFAULT_SETTINGS;
    }

    const candidate = parsedValue as Record<string, unknown>;

    return {
      language: isAppLanguage(candidate.language)
        ? candidate.language
        : DEFAULT_SETTINGS.language,
      theme: isAppTheme(candidate.theme)
        ? candidate.theme
        : DEFAULT_SETTINGS.theme,
      region: normalizeRegionCode(candidate.region),
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function serializeAppSettings(settings: AppSettings): string {
  return JSON.stringify({ version: SETTINGS_VERSION, ...settings });
}

// theme "system" iken gerçek (dark/light) sonucu, cihazın
// prefers-color-scheme tercihine göre çözer. "dark"/"light" doğrudan
// döner — sistem tercihinden bağımsızdır.
export function resolveTheme(
  theme: AppTheme,
  prefersDark: boolean
): ResolvedTheme {
  if (theme === "dark") {
    return "dark";
  }

  if (theme === "light") {
    return "light";
  }

  return prefersDark ? "dark" : "light";
}

const TMDB_LANGUAGE_BY_APP_LANGUAGE: Record<AppLanguage, string> = {
  tr: "tr-TR",
  en: "en-US",
};

// TMDB istekleri için dil parametresi. Bu görevde mevcut TMDB çağrıları bu
// fonksiyona bağlanmıyor — yalnızca gelecekte kullanılacak hazır bir
// helper.
export function getTmdbLanguage(language: AppLanguage): string {
  return TMDB_LANGUAGE_BY_APP_LANGUAGE[language];
}

// Watch Providers gibi bölge bazlı TMDB sorguları için doğrulanmış bölge
// kodu. Girdi zaten normalize edilmiş olsa bile (örn. dışarıdan/eski bir
// kayıttan geliyorsa) burada tekrar doğrulanır — saf ve deterministiktir.
export function getWatchRegion(settings: Pick<AppSettings, "region">): string {
  return normalizeRegionCode(settings.region);
}
