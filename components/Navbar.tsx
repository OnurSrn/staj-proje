import Link from "next/link";

export default function Navbar() {
  return (
    <header className="border-b border-neutral-800 bg-neutral-950">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
        <Link
          href="/"
          className="text-2xl font-bold text-yellow-400 transition hover:text-yellow-300"
        >
          CineScope
        </Link>

        <div className="flex items-center gap-5 text-sm text-neutral-300">
          <Link href="/" className="transition hover:text-yellow-400">
            Movies
          </Link>

          <Link href="/search" className="transition hover:text-yellow-400">
            Search
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

          <Link href="/about" className="transition hover:text-yellow-400">
            About
          </Link>
        </div>
      </nav>
    </header>
  );
}