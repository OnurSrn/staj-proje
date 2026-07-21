"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

type NavLink = {
  href: string;
  label: string;
};

const NAV_LINKS: NavLink[] = [
  { href: "/", label: "Movies" },
  { href: "/search", label: "Search" },
  { href: "/what-to-watch", label: "What to Watch" },
  { href: "/collections", label: "Collections" },
  { href: "/favorites", label: "Favorites" },
  { href: "/watchlist", label: "Watchlist" },
  { href: "/activity", label: "Activity" },
  { href: "/ratings", label: "Ratings" },
  { href: "/profile", label: "Profile" },
  { href: "/about", label: "About" },
];

const MOBILE_MENU_ID = "navbar-mobile-menu";

// "/" tam eşleşme gerektirir (aksi halde her rota onunla eşleşirdi).
// Diğer bağlantılar kendi alt rotalarında da aktif kabul edilir — ör.
// /collections/inception-2010 -> Collections, /search?q=x -> Search.
// /movie/* ve /person/* hiçbir bağlantıyla eşleşmez, bu da istenen davranış.
function isLinkActive(pathname: string, href: string): boolean {
  if (href === "/") {
    return pathname === "/";
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

const FOCUS_RING_CLASSES =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-400 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950";

function desktopLinkClassName(isActive: boolean): string {
  const base = `whitespace-nowrap border-b-2 pb-1 text-sm transition-colors motion-reduce:transition-none ${FOCUS_RING_CLASSES}`;

  return isActive
    ? `${base} border-yellow-400 font-semibold text-yellow-400`
    : `${base} border-transparent text-neutral-300 hover:text-yellow-400`;
}

function mobileLinkClassName(isActive: boolean): string {
  const base = `block rounded-lg px-3 py-3 text-base transition-colors motion-reduce:transition-none ${FOCUS_RING_CLASSES}`;

  return isActive
    ? `${base} font-semibold text-yellow-400 underline underline-offset-4`
    : `${base} text-neutral-300 hover:text-yellow-400`;
}

function HamburgerIcon({ isOpen }: { isOpen: boolean }) {
  const barClassName =
    "absolute h-0.5 w-6 rounded-full bg-current transition-transform duration-200 motion-reduce:transition-none";

  return (
    <span
      aria-hidden="true"
      className="relative flex h-5 w-6 flex-col items-center justify-center"
    >
      <span
        className={`${barClassName} ${isOpen ? "rotate-45" : "-translate-y-2"}`}
      />
      <span
        className={`h-0.5 w-6 rounded-full bg-current transition-opacity duration-200 motion-reduce:transition-none ${
          isOpen ? "opacity-0" : "opacity-100"
        }`}
      />
      <span
        className={`${barClassName} ${isOpen ? "-rotate-45" : "translate-y-2"}`}
      />
    </span>
  );
}

export default function Navbar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [previousPathname, setPreviousPathname] = useState(pathname);
  const headerRef = useRef<HTMLElement | null>(null);
  const toggleButtonRef = useRef<HTMLButtonElement | null>(null);

  // Route değişince mobil menü otomatik kapansın. Bu, render sırasında
  // yapılan bir state düzeltmesidir (useEffect içinde setState yerine) —
  // React'ın "prop/route değişince state sıfırlama" için önerdiği desen;
  // bir useEffect + setState kombinasyonunun tetikleyeceği gereksiz ekstra
  // render turunu (cascading render) engeller.
  if (pathname !== previousPathname) {
    setPreviousPathname(pathname);
    setIsOpen(false);
  }

  // Escape ile kapatma ve menü dışına tıklayınca kapatma yalnızca menü
  // açıkken dinlenir — kapalıyken gereksiz event listener eklenmez.
  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
        toggleButtonRef.current?.focus();
      }
    }

    function handlePointerDown(event: MouseEvent) {
      if (
        headerRef.current &&
        !headerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("mousedown", handlePointerDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handlePointerDown);
    };
  }, [isOpen]);

  return (
    <header
      ref={headerRef}
      className="border-b border-neutral-800 bg-neutral-950"
    >
      <nav className="mx-auto max-w-7xl px-6 py-4">
        <div className="flex items-center justify-between gap-4">
          <Link
            href="/"
            className={`shrink-0 text-2xl font-bold text-yellow-400 transition hover:text-yellow-300 ${FOCUS_RING_CLASSES}`}
          >
            CineScope
          </Link>

          <div className="hidden items-center gap-x-6 xl:flex">
            {NAV_LINKS.map((link) => {
              const isActive = isLinkActive(pathname, link.href);

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  aria-current={isActive ? "page" : undefined}
                  className={desktopLinkClassName(isActive)}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>

          <button
            ref={toggleButtonRef}
            type="button"
            aria-label={isOpen ? "Menüyü kapat" : "Menüyü aç"}
            aria-expanded={isOpen}
            aria-controls={MOBILE_MENU_ID}
            onClick={() => setIsOpen((previous) => !previous)}
            className={`flex h-11 w-11 items-center justify-center rounded-lg text-neutral-200 transition hover:text-yellow-400 xl:hidden ${FOCUS_RING_CLASSES}`}
          >
            <HamburgerIcon isOpen={isOpen} />
          </button>
        </div>

        <div
          id={MOBILE_MENU_ID}
          className={`mt-4 border-t border-neutral-800 pt-4 xl:hidden ${
            isOpen ? "block" : "hidden"
          }`}
        >
          <div className="flex flex-col gap-1">
            {NAV_LINKS.map((link) => {
              const isActive = isLinkActive(pathname, link.href);

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  aria-current={isActive ? "page" : undefined}
                  onClick={() => setIsOpen(false)}
                  className={mobileLinkClassName(isActive)}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>
        </div>
      </nav>
    </header>
  );
}
