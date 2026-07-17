import SavedMoviesGrid from "@/components/SavedMoviesGrid";

export const metadata = {
  title: "Watchlist",
};

export default function WatchlistPage() {
  return (
    <main className="min-h-screen bg-neutral-950 text-white">
      <section className="mx-auto max-w-7xl px-6 py-16">
        <p className="text-sm font-semibold uppercase tracking-widest text-yellow-400">
          Watch Later
        </p>

        <h1 className="mt-4 text-4xl font-bold">Watchlist</h1>

        <p className="mt-4 text-neutral-400">
          Daha sonra izlemek için kaydettiğin filmler burada görüntülenir.
        </p>

        <SavedMoviesGrid
          storageKey="cinescope-watchlist"
          emptyTitle="İzleme listen şu anda boş"
          emptyDescription="Film detay sayfasından watchlist listene film ekleyebilirsin."
          removeButtonText="Watchlist'ten Çıkar"
        />
      </section>
    </main>
  );
}