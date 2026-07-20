import type { Metadata } from "next";
import ProfileDashboard from "@/components/ProfileDashboard";

export const metadata: Metadata = {
  title: "Profile",
  description:
    "Film zevkini ve kişisel puanlama istatistiklerini özetleyen profil sayfan.",
};

export default function ProfilePage() {
  return (
    <main className="min-h-screen bg-neutral-950 text-white">
      <section className="mx-auto max-w-7xl px-6 py-16">
        <p className="text-sm font-semibold uppercase tracking-widest text-yellow-400">
          Yerel Profil
        </p>

        <h1 className="mt-4 text-4xl font-bold">Profile</h1>

        <p className="mt-4 text-neutral-400">
          Favorilerin, watchlist&apos;in ve puanlarına dayalı kişisel özetin
          burada.
        </p>

        <ProfileDashboard />
      </section>
    </main>
  );
}
