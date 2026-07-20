import type { Metadata } from "next";
import WatchActivityDashboard from "@/components/WatchActivityDashboard";

export const metadata: Metadata = {
  title: "Activity",
  description:
    "İzleme durumlarını ve izleme geçmişi istatistiklerini görüntüle.",
};

export default function ActivityPage() {
  return (
    <main className="min-h-screen bg-neutral-950 text-white">
      <section className="mx-auto max-w-7xl px-6 py-16">
        <p className="text-sm font-semibold uppercase tracking-widest text-yellow-400">
          İzleme Aktivitesi
        </p>

        <h1 className="mt-4 text-4xl font-bold">Activity</h1>

        <p className="mt-4 text-neutral-400">
          İzlediğin, izlemekte olduğun ve izleme planındaki filmleri
          burada takip et.
        </p>

        <WatchActivityDashboard />
      </section>
    </main>
  );
}
