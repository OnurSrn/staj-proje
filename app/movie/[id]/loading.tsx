export default function MovieDetailsLoading() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="relative overflow-hidden">
        <div className="mx-auto max-w-7xl px-6 py-16">
          <div className="grid gap-10 md:grid-cols-[280px_1fr]">
            <div className="aspect-[2/3] animate-pulse rounded-2xl border border-border bg-surface" />

            <div className="flex flex-col justify-center">
              <div className="h-4 w-32 animate-pulse rounded bg-surface-elevated" />
              <div className="mt-4 h-10 w-96 max-w-full animate-pulse rounded bg-surface-elevated" />
              <div className="mt-3 h-5 w-64 animate-pulse rounded bg-surface-elevated" />

              <div className="mt-6 flex flex-wrap gap-3">
                <div className="h-7 w-24 animate-pulse rounded-full bg-surface-elevated" />
                <div className="h-7 w-16 animate-pulse rounded-full bg-surface-elevated" />
                <div className="h-7 w-28 animate-pulse rounded-full bg-surface-elevated" />
                <div className="h-7 w-14 animate-pulse rounded-full bg-surface-elevated" />
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                <div className="h-7 w-20 animate-pulse rounded-md bg-surface-elevated" />
                <div className="h-7 w-24 animate-pulse rounded-md bg-surface-elevated" />
              </div>

              <div className="mt-8 max-w-3xl space-y-3">
                <div className="h-5 w-20 animate-pulse rounded bg-surface-elevated" />
                <div className="h-4 animate-pulse rounded bg-surface-elevated" />
                <div className="h-4 animate-pulse rounded bg-surface-elevated" />
                <div className="h-4 w-2/3 animate-pulse rounded bg-surface-elevated" />
              </div>

              <div className="mt-8 flex flex-wrap gap-4">
                <div className="h-12 w-40 animate-pulse rounded-lg bg-surface-elevated" />
                <div className="h-12 w-44 animate-pulse rounded-lg bg-surface-elevated" />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-16">
        <div className="mb-6">
          <div className="h-4 w-28 animate-pulse rounded bg-surface-elevated" />
          <div className="mt-3 h-8 w-32 animate-pulse rounded bg-surface-elevated" />
        </div>

        <div className="aspect-video animate-pulse rounded-2xl border border-border bg-surface" />
      </section>

      <section className="mx-auto max-w-7xl px-6 py-16">
        <div className="mb-8">
          <div className="h-4 w-16 animate-pulse rounded bg-surface-elevated" />
          <div className="mt-3 h-8 w-40 animate-pulse rounded bg-surface-elevated" />
        </div>

        <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {Array.from({ length: 5 }).map((_, index) => (
            <div
              key={index}
              className="overflow-hidden rounded-xl border border-border bg-surface"
            >
              <div className="aspect-[2/3] animate-pulse bg-surface-elevated" />

              <div className="space-y-2 p-4">
                <div className="h-4 animate-pulse rounded bg-surface-elevated" />
                <div className="h-3 w-2/3 animate-pulse rounded bg-surface-elevated" />
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
