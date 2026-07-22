import type { Metadata } from "next";
import SettingsDashboard from "@/components/SettingsDashboard";
import { t } from "@/lib/i18n";
import { getServerLanguage } from "@/lib/serverLanguage";

export const metadata: Metadata = {
  title: "Ayarlar",
  description:
    "Dil, görünüm ve bölge tercihlerinin yönetildiği sayfa.",
};

export default async function SettingsPage() {
  const language = await getServerLanguage();

  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="mx-auto max-w-7xl px-6 py-16">
        <p className="text-sm font-semibold uppercase tracking-widest text-accent">
          {t(language, "settings", "title")}
        </p>

        <h1 className="mt-4 text-4xl font-bold">
          {t(language, "settings", "title")}
        </h1>

        <p className="mt-4 text-muted">
          {t(language, "settings", "description")}
        </p>

        <SettingsDashboard />
      </section>
    </main>
  );
}
