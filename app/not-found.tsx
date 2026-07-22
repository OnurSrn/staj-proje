import Link from "next/link";
import { t } from "@/lib/i18n";
import { getServerLanguage } from "@/lib/serverLanguage";

export default async function NotFound() {
  const language = await getServerLanguage();

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6 text-foreground">
      <section className="max-w-lg rounded-2xl border border-border bg-surface p-8 text-center">
        <p className="text-sm font-semibold uppercase tracking-widest text-accent">
          {t(language, "notFound", "eyebrow")}
        </p>

        <h1 className="mt-4 text-3xl font-bold">
          {t(language, "notFound", "title")}
        </h1>

        <p className="mt-4 text-muted">
          {t(language, "notFound", "description")}
        </p>

        <div className="mt-6 flex flex-wrap justify-center gap-4">
          <Link
            href="/"
            className="rounded-lg bg-accent px-6 py-3 font-semibold text-accent-foreground transition hover:bg-accent-hover"
          >
            {t(language, "notFound", "goHome")}
          </Link>

          <Link
            href="/search"
            className="rounded-lg border border-border px-6 py-3 font-semibold text-foreground transition hover:border-accent hover:text-accent"
          >
            {t(language, "common", "searchMoviesCta")}
          </Link>
        </div>
      </section>
    </main>
  );
}
