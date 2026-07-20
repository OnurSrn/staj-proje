import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-neutral-950 px-6 text-white">
      <section className="max-w-lg rounded-2xl border border-neutral-800 bg-neutral-900 p-8 text-center">
        <p className="text-sm font-semibold uppercase tracking-widest text-yellow-400">
          404
        </p>

        <h1 className="mt-4 text-3xl font-bold">Sayfa bulunamadı</h1>

        <p className="mt-4 text-neutral-400">
          Aradığın film, kişi veya sayfa mevcut değil ya da kaldırılmış
          olabilir.
        </p>

        <div className="mt-6 flex flex-wrap justify-center gap-4">
          <Link
            href="/"
            className="rounded-lg bg-yellow-400 px-6 py-3 font-semibold text-black transition hover:bg-yellow-300"
          >
            Ana Sayfaya Dön
          </Link>

          <Link
            href="/search"
            className="rounded-lg border border-neutral-700 px-6 py-3 font-semibold text-white transition hover:border-yellow-400 hover:text-yellow-400"
          >
            Film Ara
          </Link>
        </div>
      </section>
    </main>
  );
}
