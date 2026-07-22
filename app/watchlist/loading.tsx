export default function WatchlistLoading() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="mx-auto max-w-7xl px-6 py-16">
        <div className="h-4 w-28 animate-pulse rounded bg-surface-elevated" />
        <div className="mt-4 h-10 w-56 animate-pulse rounded bg-surface-elevated" />
        <div className="mt-4 h-5 w-96 max-w-full animate-pulse rounded bg-surface-elevated" />

        <div className="mt-8 grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="flex flex-col gap-3">
              <div className="overflow-hidden rounded-xl border border-border bg-surface">
                <div className="aspect-[2/3] animate-pulse bg-surface-elevated" />

                <div className="space-y-3 p-4">
                  <div className="h-5 animate-pulse rounded bg-surface-elevated" />
                  <div className="h-4 w-2/3 animate-pulse rounded bg-surface-elevated" />
                </div>
              </div>

              <div className="h-10 animate-pulse rounded-lg bg-surface" />
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
