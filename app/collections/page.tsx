import type { Metadata } from "next";
import Link from "next/link";
import {
  CINEA_COLLECTIONS,
  type CollectionAccent,
} from "@/lib/cineaCollections";

export const metadata: Metadata = {
  title: "Collections",
  description: "CiNeA'nın özel tematik film koleksiyonlarını keşfet.",
};

const ACCENT_GRADIENTS: Record<CollectionAccent, string> = {
  purple: "from-purple-500/20 via-neutral-900 to-neutral-900",
  red: "from-red-500/20 via-neutral-900 to-neutral-900",
  blue: "from-blue-500/20 via-neutral-900 to-neutral-900",
  green: "from-green-500/20 via-neutral-900 to-neutral-900",
  amber: "from-amber-500/20 via-neutral-900 to-neutral-900",
  cyan: "from-cyan-500/20 via-neutral-900 to-neutral-900",
};

const ACCENT_TEXT: Record<CollectionAccent, string> = {
  purple: "text-purple-300",
  red: "text-red-300",
  blue: "text-blue-300",
  green: "text-green-300",
  amber: "text-amber-300",
  cyan: "text-cyan-300",
};

export default function CollectionsPage() {
  return (
    <main className="min-h-screen bg-neutral-950 text-white">
      <section className="mx-auto max-w-7xl px-6 py-16">
        <p className="text-sm font-semibold uppercase tracking-widest text-yellow-400">
          CiNeA Collections
        </p>

        <h1 className="mt-4 text-4xl font-bold">Collections</h1>

        <p className="mt-4 text-neutral-400">
          Ruh haline uygun tematik koleksiyonlardan birini seç.
        </p>

        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {CINEA_COLLECTIONS.map((collection) => (
            <div
              key={collection.slug}
              className={`flex flex-col justify-between rounded-2xl border border-neutral-800 bg-gradient-to-br p-5 ${ACCENT_GRADIENTS[collection.accent]}`}
            >
              <div>
                <p
                  className={`text-xs font-semibold uppercase tracking-widest ${ACCENT_TEXT[collection.accent]}`}
                >
                  Koleksiyon
                </p>

                <h2 className="mt-2 text-xl font-bold">{collection.title}</h2>

                <p className="mt-3 text-sm text-neutral-300">
                  {collection.shortDescription}
                </p>
              </div>

              <Link
                href={`/collections/${collection.slug}`}
                className="mt-6 inline-block rounded-lg bg-yellow-400 px-5 py-3 text-center font-semibold text-black transition hover:bg-yellow-300"
              >
                Koleksiyonu Aç
              </Link>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
