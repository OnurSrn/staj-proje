"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSettings } from "@/components/SettingsProvider";
import { t } from "@/lib/i18n";

type NavLinkKey =
  | "movies"
  | "search"
  | "whatToWatch"
  | "collections"
  | "favorites"
  | "watchlist"
  | "activity"
  | "ratings"
  | "profile"
  | "about";

type NavLink = {
  href: string;
  key: NavLinkKey;
};

const NAV_LINKS: NavLink[] = [
  { href: "/", key: "movies" },
  { href: "/search", key: "search" },
  { href: "/what-to-watch", key: "whatToWatch" },
  { href: "/collections", key: "collections" },
  { href: "/favorites", key: "favorites" },
  { href: "/watchlist", key: "watchlist" },
  { href: "/activity", key: "activity" },
  { href: "/ratings", key: "ratings" },
  { href: "/profile", key: "profile" },
  { href: "/about", key: "about" },
];

const SETTINGS_HREF = "/settings";
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
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background";

function desktopLinkClassName(isActive: boolean): string {
  const base = `whitespace-nowrap border-b-2 pb-1 text-sm transition-colors motion-reduce:transition-none ${FOCUS_RING_CLASSES}`;

  return isActive
    ? `${base} border-accent font-semibold text-accent`
    : `${base} border-transparent text-muted hover:text-accent`;
}

function mobileLinkClassName(isActive: boolean): string {
  const base = `block rounded-lg px-3 py-3 text-base transition-colors motion-reduce:transition-none ${FOCUS_RING_CLASSES}`;

  return isActive
    ? `${base} font-semibold text-accent underline underline-offset-4`
    : `${base} text-muted hover:text-accent`;
}

function settingsIconButtonClassName(isActive: boolean): string {
  const base = `flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border text-lg transition motion-reduce:transition-none ${FOCUS_RING_CLASSES}`;

  return isActive
    ? `${base} border-accent text-accent`
    : `${base} border-border text-muted hover:border-accent hover:text-accent`;
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
  const { settings } = useSettings();
  const language = settings.language;
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

  const isSettingsActive = isLinkActive(pathname, SETTINGS_HREF);
  const settingsLabel = t(language, "navbar", "settings");

  return (
    <header
      ref={headerRef}
      className="border-b border-border bg-background"
    >
      <nav className="mx-auto max-w-7xl px-6 py-4">
        <div className="flex items-center justify-between gap-4">
          <Link
            href="/"
            className={`shrink-0 text-2xl font-bold text-accent transition hover:opacity-90 ${FOCUS_RING_CLASSES}`}
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
                  {t(language, "navbar", link.key)}
                </Link>
              );
            })}
          </div>

          <div className="flex items-center gap-2">
            {/* Ayarlara kompakt, ana nav listesini büyütmeyen bir erişim —
                masaüstünde ayrı bir dişli ikonu, mobilde menü içindeki son
                madde (bkz. aşağı). */}
            <Link
              href={SETTINGS_HREF}
              aria-label={settingsLabel}
              title={settingsLabel}
              aria-current={isSettingsActive ? "page" : undefined}
              className={`hidden xl:flex ${settingsIconButtonClassName(isSettingsActive)}`}
            >
              <span aria-hidden="true">⚙</span>
            </Link>

            <button
              ref={toggleButtonRef}
              type="button"
              aria-label={
                isOpen
                  ? t(language, "navbar", "closeMenu")
                  : t(language, "navbar", "openMenu")
              }
              aria-expanded={isOpen}
              aria-controls={MOBILE_MENU_ID}
              onClick={() => setIsOpen((previous) => !previous)}
              className={`flex h-11 w-11 items-center justify-center rounded-lg text-foreground transition hover:text-accent xl:hidden ${FOCUS_RING_CLASSES}`}
            >
              <HamburgerIcon isOpen={isOpen} />
            </button>
          </div>
        </div>

        <div
          id={MOBILE_MENU_ID}
          className={`mt-4 border-t border-border pt-4 xl:hidden ${
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
                  {t(language, "navbar", link.key)}
                </Link>
              );
            })}

            <Link
              href={SETTINGS_HREF}
              aria-current={isSettingsActive ? "page" : undefined}
              onClick={() => setIsOpen(false)}
              className={`mt-1 border-t border-border pt-2 ${mobileLinkClassName(isSettingsActive)}`}
            >
              <span aria-hidden="true">⚙ </span>
              {settingsLabel}
            </Link>
          </div>
        </div>
      </nav>
    </header>
  );
}
