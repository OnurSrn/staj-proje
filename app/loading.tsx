export default function Loading() {
  return (
    <main className="min-h-screen bg-background px-6 py-8 text-foreground">
      <section className="mx-auto max-w-7xl">
        <div className="h-8 w-40 animate-pulse rounded bg-surface-elevated" />

        <div className="py-20">
          <div className="h-4 w-44 animate-pulse rounded bg-surface-elevated" />
          <div className="mt-5 h-12 max-w-3xl animate-pulse rounded bg-surface-elevated" />
          <div className="mt-4 h-12 max-w-2xl animate-pulse rounded bg-surface-elevated" />
          <div className="mt-6 h-6 max-w-xl animate-pulse rounded bg-surface-elevated" />
        </div>

        <div className="mb-6 h-8 w-52 animate-pulse rounded bg-surface-elevated" />

        <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {Array.from({ length: 10 }).map((_, index) => (
            <div
              key={index}
              className="overflow-hidden rounded-xl border border-border bg-surface"
            >
              <div className="aspect-[2/3] animate-pulse bg-surface-elevated" />

              <div className="p-4">
                <div className="h-6 animate-pulse rounded bg-surface-elevated" />

                <div className="mt-4 flex justify-between">
                  <div className="h-5 w-14 animate-pulse rounded bg-surface-elevated" />
                  <div className="h-7 w-10 animate-pulse rounded bg-surface-elevated" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}