export default function CollectionsLoading() {
  return (
    <main className="min-h-screen bg-neutral-950 text-white">
      <section className="mx-auto max-w-7xl px-6 py-16">
        <div className="h-4 w-40 animate-pulse rounded bg-neutral-800" />
        <div className="mt-4 h-10 w-64 animate-pulse rounded bg-neutral-800" />
        <div className="mt-4 h-5 w-96 max-w-full animate-pulse rounded bg-neutral-800" />

        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div
              key={index}
              className="rounded-2xl border border-neutral-800 bg-neutral-900 p-5"
            >
              <div className="h-3 w-24 animate-pulse rounded bg-neutral-800" />
              <div className="mt-3 h-6 w-40 animate-pulse rounded bg-neutral-800" />
              <div className="mt-3 h-4 animate-pulse rounded bg-neutral-800" />
              <div className="mt-2 h-4 w-2/3 animate-pulse rounded bg-neutral-800" />
              <div className="mt-6 h-12 w-full animate-pulse rounded-lg bg-neutral-800" />
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
