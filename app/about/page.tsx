export const metadata = {
  title: "About",
};

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-neutral-950 text-white">
      <section className="mx-auto max-w-4xl px-6 py-16">
        <p className="text-sm font-semibold uppercase tracking-widest text-yellow-400">
          About the Project
        </p>

        <h1 className="mt-4 text-4xl font-bold">About CineScope</h1>

        <div className="mt-8 space-y-5 leading-8 text-neutral-300">
          <p>
            CineScope, Next.js ve TypeScript kullanılarak geliştirilen bir film
            keşif uygulamasıdır.
          </p>

          <p>
            Film verileri ve görselleri The Movie Database API üzerinden
            alınmaktadır.
          </p>

          <p>
            Proje kapsamında API entegrasyonu, dinamik route yapısı, Server
            Components, responsive tasarım ve kullanıcı listeleri gibi konular
            uygulanmaktadır.
          </p>
        </div>
      </section>
    </main>
  );
}