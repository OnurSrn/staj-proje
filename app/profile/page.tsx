import type { Metadata } from "next";
import ProfileDashboard from "@/components/ProfileDashboard";
import PageShell from "@/components/ui/PageShell";
import { t } from "@/lib/i18n";
import { getServerLanguage } from "@/lib/serverLanguage";

export const metadata: Metadata = {
  title: "Profile",
  description:
    "Film zevkini ve kişisel puanlama istatistiklerini özetleyen profil sayfan.",
};

export default async function ProfilePage() {
  const language = await getServerLanguage();

  return (
    <main className="min-h-screen bg-background text-foreground">
      <PageShell pattern="subtle">
        <p className="text-sm font-semibold uppercase tracking-widest text-accent">
          {t(language, "profile", "eyebrow")}
        </p>

        <h1 className="mt-4 text-4xl font-bold">
          {t(language, "profile", "title")}
        </h1>

        <p className="mt-4 text-muted">
          {t(language, "profile", "subtitle")}
        </p>

        <ProfileDashboard />
      </PageShell>
    </main>
  );
}
