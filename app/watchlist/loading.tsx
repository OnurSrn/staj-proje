export default function WatchlistLoading() {
  return (
    <main className="min-h-screen bg-neutral-950 text-white">
      <section className="mx-auto max-w-7xl px-6 py-16">
        <div className="h-4 w-28 animate-pulse rounded bg-neutral-800" />
        <div className="mt-4 h-10 w-56 animate-pulse rounded bg-neutral-800" />
        <div className="mt-4 h-5 w-96 max-w-full animate-pulse rounded bg-neutral-800" />

        <div className="mt-8 grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="flex flex-col gap-3">
              <div className="overflow-hidden rounded-xl border border-neutral-800 bg-neutral-900">
                <div className="aspect-[2/3] animate-pulse bg-neutral-800" />

                <div className="space-y-3 p-4">
                  <div className="h-5 animate-pulse rounded bg-neutral-800" />
                  <div className="h-4 w-2/3 animate-pulse rounded bg-neutral-800" />
                </div>
              </div>

              <div className="h-10 animate-pulse rounded-lg bg-neutral-900" />
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
