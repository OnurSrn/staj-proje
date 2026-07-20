import Link from "next/link";

export default function Navbar() {
  return (
    <header className="border-b border-neutral-800 bg-neutral-950">
      <nav className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-x-6 gap-y-3 px-6 py-5">
        <Link
          href="/"
          className="text-2xl font-bold text-yellow-400 transition hover:text-yellow-300"
        >
          CineScope
        </Link>

        <div className="flex flex-wrap items-center justify-end gap-x-4 gap-y-2 text-sm text-neutral-300">
          <Link href="/" className="transition hover:text-yellow-400">
            Movies
          </Link>

          <Link href="/search" className="transition hover:text-yellow-400">
            Search
          </Link>

          <Link
            href="/what-to-watch"
            className="transition hover:text-yellow-400"
          >
            What to Watch
          </Link>

          <Link
            href="/collections"
            className="transition hover:text-yellow-400"
          >
            Collections
          </Link>

          <Link
            href="/favorites"
            className="transition hover:text-yellow-400"
          >
            Favorites
          </Link>

          <Link
            href="/watchlist"
            className="transition hover:text-yellow-400"
          >
            Watchlist
          </Link>

          <Link
            href="/activity"
            className="transition hover:text-yellow-400"
          >
            Activity
          </Link>

          <Link
            href="/ratings"
            className="transition hover:text-yellow-400"
          >
            Ratings
          </Link>

          <Link
            href="/profile"
            className="transition hover:text-yellow-400"
          >
            Profile
          </Link>

          <Link href="/about" className="transition hover:text-yellow-400">
            About
          </Link>
        </div>
      </nav>
    </header>
  );
}