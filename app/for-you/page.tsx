import type { Metadata } from "next";
import ForYouDashboard from "@/components/ForYouDashboard";

export const metadata: Metadata = {
  title: "Sana Özel",
  description:
    "Kullanıcının puanları ve tercihleriyle oluşturulan kişisel film önerileri.",
};

export default function ForYouPage() {
  return (
    <main className="min-h-screen bg-neutral-950 text-white">
      <section className="mx-auto max-w-7xl px-6 py-16">
        <p className="text-sm font-semibold uppercase tracking-widest text-yellow-400">
          Kişisel Öneriler
        </p>

        <h1 className="mt-4 text-4xl font-bold">Sana Özel</h1>

        <p className="mt-4 max-w-2xl text-neutral-400">
          Öneriler, verdiğin puanlar, izleme durumların ve açık
          tercihlerinden hesaplanır.
        </p>

        <p className="mt-3 max-w-2xl text-xs text-neutral-600">
          Zevk profilin bu cihazdaki yerel verilerden hesaplanır. Öneri
          adayı ararken yalnızca birkaç kısa filtre (ör. en sevdiğin
          birkaç tür/kişi id&apos;si) sunucuya gönderilir; puanların,
          izleme geçmişin veya kimliğin hiçbir zaman kaydedilmez.
        </p>

        <ForYouDashboard />
      </section>
    </main>
  );
}
