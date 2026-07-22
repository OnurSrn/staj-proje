import type { Metadata } from "next";
import WatchActivityDashboard from "@/components/WatchActivityDashboard";
import { t } from "@/lib/i18n";
import { getServerLanguage } from "@/lib/serverLanguage";

export const metadata: Metadata = {
  title: "Activity",
  description:
    "İzleme durumlarını ve izleme geçmişi istatistiklerini görüntüle.",
};

export default async function ActivityPage() {
  const language = await getServerLanguage();

  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="mx-auto max-w-7xl px-6 py-16">
        <p className="text-sm font-semibold uppercase tracking-widest text-accent">
          {t(language, "activity", "eyebrow")}
        </p>

        <h1 className="mt-4 text-4xl font-bold">
          {t(language, "activity", "title")}
        </h1>

        <p className="mt-4 text-muted">
          {t(language, "activity", "subtitle")}
        </p>

        <WatchActivityDashboard />
      </section>
    </main>
  );
}
