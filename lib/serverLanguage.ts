import { cookies } from "next/headers";
import { cache } from "react";
import {
  DEFAULT_SETTINGS,
  isAppLanguage,
  LANGUAGE_COOKIE_KEY,
  type AppLanguage,
} from "@/lib/settings";

// Server Component'lerin (localStorage'a erişemedikleri için) dil tercihini
// okuduğu tek yer. `cache()` ile aynı istek içinde birden fazla sayfa/
// bileşen çağırsa da cookie yalnızca bir kez okunur. Cookie yoksa/geçersizse
// varsayılan (tr) döner — SettingsProvider ilk ziyarette de aynı
// varsayılanı kullandığı için hydration mismatch veya dil flaşı oluşmaz
// (bkz. components/SettingsProvider.tsx "initialLanguage").
export const getServerLanguage = cache(
  async function getServerLanguage(): Promise<AppLanguage> {
    const cookieStore = await cookies();
    const value = cookieStore.get(LANGUAGE_COOKIE_KEY)?.value;

    return isAppLanguage(value) ? value : DEFAULT_SETTINGS.language;
  }
);
