import SavedMoviesGrid from "@/components/SavedMoviesGrid";

export const metadata = {
  title: "Favorites",
};

export default function FavoritesPage() {
  return (
    <main className="min-h-screen bg-neutral-950 text-white">
      <section className="mx-auto max-w-7xl px-6 py-16">
        <p className="text-sm font-semibold uppercase tracking-widest text-yellow-400">
          Your Collection
        </p>

        <h1 className="mt-4 text-4xl font-bold">Favorites</h1>

        <p className="mt-4 text-neutral-400">
          Favori olarak kaydettiğin filmler burada görüntülenir.
        </p>

        <SavedMoviesGrid
            storageKey="cinescope-favorites"
            emptyTitle="Henüz favori film yok"
            emptyDescription="Film detay sayfasından favorilerine film ekleyebilirsin."
            removeButtonText="Favorilerden Çıkar"
        />
      </section>
    </main>
  );
}