import type { Metadata } from "next";
import RatedMoviesDashboard from "@/components/RatedMoviesDashboard";
import { t } from "@/lib/i18n";
import { getServerLanguage } from "@/lib/serverLanguage";

export const metadata: Metadata = {
  title: "Ratings",
  description:
    "Kendi verdiğin film puanlarını ve kişisel istatistiklerini görüntüle.",
};

export default async function RatingsPage() {
  const language = await getServerLanguage();

  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="mx-auto max-w-7xl px-6 py-16">
        <p className="text-sm font-semibold uppercase tracking-widest text-accent">
          {t(language, "ratings", "eyebrow")}
        </p>

        <h1 className="mt-4 text-4xl font-bold">
          {t(language, "ratings", "title")}
        </h1>

        <p className="mt-4 text-muted">
          {t(language, "ratings", "subtitle")}
        </p>

        <RatedMoviesDashboard />
      </section>
    </main>
  );
}
