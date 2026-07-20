import type { Metadata } from "next";
import RatedMoviesDashboard from "@/components/RatedMoviesDashboard";

export const metadata: Metadata = {
  title: "Ratings",
  description:
    "Kendi verdiğin film puanlarını ve kişisel istatistiklerini görüntüle.",
};

export default function RatingsPage() {
  return (
    <main className="min-h-screen bg-neutral-950 text-white">
      <section className="mx-auto max-w-7xl px-6 py-16">
        <p className="text-sm font-semibold uppercase tracking-widest text-yellow-400">
          Kişisel İstatistikler
        </p>

        <h1 className="mt-4 text-4xl font-bold">Ratings</h1>

        <p className="mt-4 text-neutral-400">
          Puanladığın filmleri ve kişisel istatistiklerini burada
          görebilirsin.
        </p>

        <RatedMoviesDashboard />
      </section>
    </main>
  );
}
