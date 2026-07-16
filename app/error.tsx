"use client";

type ErrorPageProps = {
  error: Error & {
    digest?: string;
  };
  reset: () => void;
};

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-neutral-950 px-6 text-white">
      <section className="max-w-lg rounded-2xl border border-red-900/50 bg-neutral-900 p-8 text-center">
        <p className="text-sm font-semibold uppercase tracking-widest text-red-400">
          Bir hata oluştu
        </p>

        <h1 className="mt-4 text-3xl font-bold">
          Filmler şu anda yüklenemiyor
        </h1>

        <p className="mt-4 text-neutral-400">
          İnternet bağlantısını veya TMDB API ayarlarını kontrol edip tekrar
          deneyebilirsin.
        </p>

        {process.env.NODE_ENV === "development" && (
          <p className="mt-4 rounded-lg bg-neutral-950 p-3 text-left text-xs text-red-300">
            {error.message}
          </p>
        )}

        <button
          type="button"
          onClick={reset}
          className="mt-6 rounded-lg bg-yellow-400 px-6 py-3 font-semibold text-black transition hover:bg-yellow-300"
        >
          Tekrar Dene
        </button>
      </section>
    </main>
  );
}