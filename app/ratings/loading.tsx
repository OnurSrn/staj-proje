export default function RatingsLoading() {
  return (
    <main className="min-h-screen bg-neutral-950 text-white">
      <section className="mx-auto max-w-7xl px-6 py-16">
        <div className="h-4 w-40 animate-pulse rounded bg-neutral-800" />
        <div className="mt-4 h-10 w-40 animate-pulse rounded bg-neutral-800" />
        <div className="mt-4 h-5 w-96 max-w-full animate-pulse rounded bg-neutral-800" />

        <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="rounded-xl border border-neutral-800 bg-neutral-900 p-4"
            >
              <div className="h-3 w-20 animate-pulse rounded bg-neutral-800" />
              <div className="mt-3 h-7 w-16 animate-pulse rounded bg-neutral-800" />
            </div>
          ))}
        </div>

        <div className="mt-10 space-y-2">
          {Array.from({ length: 5 }).map((_, index) => (
            <div
              key={index}
              className="h-5 animate-pulse rounded-full bg-neutral-800"
            />
          ))}
        </div>

        <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {Array.from({ length: 6 }).map((_, index) => (
            <div
              key={index}
              className="overflow-hidden rounded-xl border border-neutral-800 bg-neutral-900"
            >
              <div className="aspect-[2/3] animate-pulse bg-neutral-800" />

              <div className="space-y-2 p-3">
                <div className="h-4 animate-pulse rounded bg-neutral-800" />
                <div className="h-3 w-2/3 animate-pulse rounded bg-neutral-800" />
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
