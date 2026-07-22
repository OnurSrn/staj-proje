export default function WhatToWatchLoading() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="mx-auto max-w-7xl px-6 py-16">
        <div className="h-4 w-40 animate-pulse rounded bg-surface-elevated" />
        <div className="mt-4 h-10 w-64 animate-pulse rounded bg-surface-elevated" />
        <div className="mt-4 h-5 w-96 max-w-full animate-pulse rounded bg-surface-elevated" />

        <div className="mt-8 rounded-2xl border border-border bg-surface p-5">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index}>
                <div className="mb-2 h-4 w-20 animate-pulse rounded bg-surface-elevated" />
                <div className="h-12 w-full animate-pulse rounded-lg bg-surface-elevated" />
              </div>
            ))}
          </div>

          <div className="mt-5 h-4 w-72 max-w-full animate-pulse rounded bg-surface-elevated" />
          <div className="mt-5 h-12 w-36 animate-pulse rounded-lg bg-surface-elevated" />
        </div>

        <div className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
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
    </main>
  );
}
