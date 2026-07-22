"use client";

import { useSettings } from "@/components/SettingsProvider";
import { t } from "@/lib/i18n";

type ErrorPageProps = {
  error: Error & {
    digest?: string;
  };
  reset: () => void;
};

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  const { settings } = useSettings();
  const language = settings.language;

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6 text-foreground">
      <section className="max-w-lg rounded-2xl border border-danger/50 bg-surface p-8 text-center">
        <p className="text-sm font-semibold uppercase tracking-widest text-danger">
          {t(language, "errorPage", "eyebrow")}
        </p>

        <h1 className="mt-4 text-3xl font-bold">
          {t(language, "errorPage", "title")}
        </h1>

        <p className="mt-4 text-muted">
          {t(language, "errorPage", "description")}
        </p>

        {process.env.NODE_ENV === "development" && (
          <p className="mt-4 rounded-lg bg-background p-3 text-left text-xs text-danger">
            {error.message}
          </p>
        )}

        <button
          type="button"
          onClick={reset}
          className="mt-6 rounded-lg bg-accent px-6 py-3 font-semibold text-accent-foreground transition hover:bg-accent-hover"
        >
          {t(language, "common", "retry")}
        </button>
      </section>
    </main>
  );
}
