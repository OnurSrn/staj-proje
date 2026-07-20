export default function SearchLoading() {
  return (
    <main className="min-h-screen bg-neutral-950 text-white">
      <section className="mx-auto max-w-7xl px-6 py-16">
        <div className="h-4 w-28 animate-pulse rounded bg-neutral-800" />
        <div className="mt-4 h-10 w-72 animate-pulse rounded bg-neutral-800" />
        <div className="mt-4 h-5 w-96 max-w-full animate-pulse rounded bg-neutral-800" />

        <div className="mt-8 flex max-w-3xl gap-3">
          <div className="h-[60px] flex-1 animate-pulse rounded-xl bg-neutral-900" />
          <div className="h-[60px] w-28 animate-pulse rounded-xl bg-neutral-800" />
        </div>

        <section className="mt-12">
          <div className="mb-6">
            <div className="h-8 w-64 animate-pulse rounded bg-neutral-800" />
            <div className="mt-3 h-4 w-40 animate-pulse rounded bg-neutral-800" />
          </div>

          <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {Array.from({ length: 10 }).map((_, index) => (
              <div
                key={index}
                className="overflow-hidden rounded-xl border border-neutral-800 bg-neutral-900"
              >
                <div className="aspect-[2/3] animate-pulse bg-neutral-800" />

                <div className="p-4">
                  <div className="h-6 animate-pulse rounded bg-neutral-800" />

                  <div className="mt-4 flex justify-between">
                    <div className="h-5 w-14 animate-pulse rounded bg-neutral-800" />
                    <div className="h-7 w-10 animate-pulse rounded bg-neutral-800" />
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
