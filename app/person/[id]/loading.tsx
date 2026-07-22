export default function PersonDetailsLoading() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="mx-auto max-w-7xl px-6 py-16">
        <div className="grid gap-10 md:grid-cols-[280px_1fr]">
          <div className="aspect-[2/3] animate-pulse rounded-2xl border border-border bg-surface" />

          <div className="flex flex-col justify-center">
            <div className="h-4 w-32 animate-pulse rounded bg-surface-elevated" />
            <div className="mt-4 h-10 w-72 max-w-full animate-pulse rounded bg-surface-elevated" />

            <div className="mt-6 flex flex-wrap gap-3">
              <div className="h-7 w-24 animate-pulse rounded-full bg-surface-elevated" />
              <div className="h-7 w-32 animate-pulse rounded-full bg-surface-elevated" />
              <div className="h-7 w-40 animate-pulse rounded-full bg-surface-elevated" />
            </div>

            <div className="mt-8 max-w-3xl space-y-3">
              <div className="h-5 w-24 animate-pulse rounded bg-surface-elevated" />
              <div className="h-4 animate-pulse rounded bg-surface-elevated" />
              <div className="h-4 animate-pulse rounded bg-surface-elevated" />
              <div className="h-4 w-2/3 animate-pulse rounded bg-surface-elevated" />
            </div>
          </div>
        </div>

        <section className="mt-16">
          <div className="mb-8">
            <div className="h-4 w-28 animate-pulse rounded bg-surface-elevated" />
            <div className="mt-3 h-8 w-40 animate-pulse rounded bg-surface-elevated" />
          </div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {Array.from({ length: 12 }).map((_, index) => (
              <div
                key={index}
                className="overflow-hidden rounded-xl border border-border bg-surface"
              >
                <div className="aspect-[2/3] animate-pulse bg-surface-elevated" />

                <div className="p-3">
                  <div className="h-4 animate-pulse rounded bg-surface-elevated" />

                  <div className="mt-3 flex justify-between">
                    <div className="h-3 w-10 animate-pulse rounded bg-surface-elevated" />
                    <div className="h-5 w-8 animate-pulse rounded bg-surface-elevated" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </section>
    </main>
  );
}
