import type { Metadata } from "next";
import ForYouDashboard from "@/components/ForYouDashboard";
import { t } from "@/lib/i18n";
import { getServerLanguage } from "@/lib/serverLanguage";

export const metadata: Metadata = {
  title: "Sana Özel",
  description:
    "Kullanıcının puanları ve tercihleriyle oluşturulan kişisel film önerileri.",
};

export default async function ForYouPage() {
  const language = await getServerLanguage();

  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="mx-auto max-w-7xl px-6 py-16">
        <p className="text-sm font-semibold uppercase tracking-widest text-accent">
          {t(language, "forYou", "eyebrow")}
        </p>

        <h1 className="mt-4 text-4xl font-bold">
          {t(language, "forYou", "title")}
        </h1>

        <p className="mt-4 max-w-2xl text-muted">
          {t(language, "forYou", "subtitle")}
        </p>

        <p className="mt-3 max-w-2xl text-xs text-muted">
          {t(language, "forYou", "privacyNote")}
        </p>

        <ForYouDashboard />
      </section>
    </main>
  );
}
