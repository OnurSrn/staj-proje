import { t } from "@/lib/i18n";
import { getServerLanguage } from "@/lib/serverLanguage";

export const metadata = {
  title: "About",
};

export default async function AboutPage() {
  const language = await getServerLanguage();

  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="mx-auto max-w-4xl px-6 py-16">
        <p className="text-sm font-semibold uppercase tracking-widest text-accent">
          {t(language, "about", "eyebrow")}
        </p>

        <h1 className="mt-4 text-4xl font-bold">About CineScope</h1>

        <div className="mt-8 space-y-5 leading-8 text-foreground">
          <p>{t(language, "about", "paragraph1")}</p>

          <p>{t(language, "about", "paragraph2")}</p>

          <p>{t(language, "about", "paragraph3")}</p>
        </div>
      </section>
    </main>
  );
}
