import SavedMoviesGrid from "@/components/SavedMoviesGrid";
import { t } from "@/lib/i18n";
import { getServerLanguage } from "@/lib/serverLanguage";

export const metadata = {
  title: "Watchlist",
};

export default async function WatchlistPage() {
  const language = await getServerLanguage();

  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="mx-auto max-w-7xl px-6 py-16">
        <p className="text-sm font-semibold uppercase tracking-widest text-accent">
          {t(language, "watchlist", "eyebrow")}
        </p>

        <h1 className="mt-4 text-4xl font-bold">
          {t(language, "watchlist", "title")}
        </h1>

        <p className="mt-4 text-muted">
          {t(language, "watchlist", "subtitle")}
        </p>

        <SavedMoviesGrid kind="watchlist" />
      </section>
    </main>
  );
}
