import type { Metadata } from "next";
import Link from "next/link";
import { t } from "@/lib/i18n";
import { getServerLanguage } from "@/lib/serverLanguage";
import {
  CINEA_COLLECTIONS,
  type CollectionAccent,
} from "@/lib/cineaCollections";

export const metadata: Metadata = {
  title: "Collections",
  description: "CiNeA'nın özel tematik film koleksiyonlarını keşfet.",
};

const ACCENT_GRADIENTS: Record<CollectionAccent, string> = {
  purple: "from-purple-500/20 via-surface to-surface",
  red: "from-red-500/20 via-surface to-surface",
  blue: "from-blue-500/20 via-surface to-surface",
  green: "from-green-500/20 via-surface to-surface",
  amber: "from-amber-500/20 via-surface to-surface",
  cyan: "from-cyan-500/20 via-surface to-surface",
};

// Bu proje `dark:` varyantını değil, [data-theme] attribute'unu kullanıyor
// (bkz. app/globals.css) — `dark:` burada kullanılırsa gerçek tema yerine
// işletim sistemi tercihine bağlı kalır ve "system" dışındaki temalarda
// yanlış renk gösterebilir. Bu yüzden her accent için tek, her iki temada
// da yeterli kontrasta sahip bir ton (500) seçildi.
const ACCENT_TEXT: Record<CollectionAccent, string> = {
  purple: "text-purple-500",
  red: "text-red-500",
  blue: "text-blue-500",
  green: "text-green-500",
  amber: "text-amber-500",
  cyan: "text-cyan-500",
};

export default async function CollectionsPage() {
  const language = await getServerLanguage();

  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="mx-auto max-w-7xl px-6 py-16">
        <p className="text-sm font-semibold uppercase tracking-widest text-accent">
          {t(language, "collections", "eyebrow")}
        </p>

        <h1 className="mt-4 text-4xl font-bold">
          {t(language, "collections", "title")}
        </h1>

        <p className="mt-4 text-muted">
          {t(language, "collections", "subtitle")}
        </p>

        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {CINEA_COLLECTIONS.map((collection) => (
            <div
              key={collection.slug}
              className={`flex flex-col justify-between rounded-2xl border border-border bg-gradient-to-br p-5 ${ACCENT_GRADIENTS[collection.accent]}`}
            >
              <div>
                <p
                  className={`text-xs font-semibold uppercase tracking-widest ${ACCENT_TEXT[collection.accent]}`}
                >
                  {t(language, "collections", "cardEyebrow")}
                </p>

                <h2 className="mt-2 text-xl font-bold">{collection.title}</h2>

                <p className="mt-3 text-sm text-foreground">
                  {collection.shortDescription}
                </p>
              </div>

              <Link
                href={`/collections/${collection.slug}`}
                className="mt-6 inline-block rounded-lg bg-accent px-5 py-3 text-center font-semibold text-accent-foreground transition hover:bg-accent-hover"
              >
                {t(language, "collections", "openCollectionCta")}
              </Link>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
