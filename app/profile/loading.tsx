export default function ProfileLoading() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="mx-auto max-w-7xl px-6 py-16">
        <div className="h-4 w-32 animate-pulse rounded bg-surface-elevated" />
        <div className="mt-4 h-10 w-40 animate-pulse rounded bg-surface-elevated" />
        <div className="mt-4 h-5 w-96 max-w-full animate-pulse rounded bg-surface-elevated" />

        <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div
              key={index}
              className="rounded-xl border border-border bg-surface p-4"
            >
              <div className="h-3 w-20 animate-pulse rounded bg-surface-elevated" />
              <div className="mt-3 h-7 w-16 animate-pulse rounded bg-surface-elevated" />
            </div>
          ))}
        </div>

        <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {Array.from({ length: 5 }).map((_, index) => (
            <div
              key={index}
              className="overflow-hidden rounded-xl border border-border bg-surface"
            >
              <div className="aspect-[2/3] animate-pulse bg-surface-elevated" />

              <div className="space-y-2 p-3">
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
