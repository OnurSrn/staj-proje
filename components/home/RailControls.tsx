"use client";

import { useCallback, useEffect, useState } from "react";
import { useSettings } from "@/components/SettingsProvider";
import { t } from "@/lib/i18n";

type RailControlsProps = {
  targetId: string;
  className?: string;
};

function getRailElement(targetId: string): HTMLElement | null {
  return document.getElementById(targetId);
}

export default function RailControls({
  targetId,
  className,
}: RailControlsProps) {
  const { settings } = useSettings();
  const language = settings.language;

  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateScrollState = useCallback(() => {
    const rail = getRailElement(targetId);

    if (!rail) {
      return;
    }

    setCanScrollLeft(rail.scrollLeft > 0);
    setCanScrollRight(
      rail.scrollLeft + rail.clientWidth < rail.scrollWidth - 1
    );
  }, [targetId]);

  useEffect(() => {
    const rail = getRailElement(targetId);

    if (!rail) {
      return;
    }

    // İlk ölçüm, layout oturduktan sonra bir sonraki frame'de yapılır —
    // setState'i effect gövdesinde senkron çağırmak yerine (react-hooks/
    // set-state-in-effect), rAF callback'i "scroll" dinleyicisiyle aynı
    // asenkron yoldan geçer.
    // Tek rAF bazen layout tam oturmadan ölçüyor ve sağ ok kalıcı olarak
    // devre dışı kalabiliyordu (scrollWidth > clientWidth olduğu halde
    // canScrollRight false hesaplanıyordu) — bir sonraki frame'e daha
    // ölçümü erteleyen ikinci bir rAF, "load" gibi yalnızca bir kez
    // tetiklenen global bir olaya bağlı kalmadan (client-side rota
    // geçişlerinde de çalışsın diye) bunu düzeltiyor.
    let secondFrameId = 0;
    const initialMeasureId = requestAnimationFrame(() => {
      secondFrameId = requestAnimationFrame(updateScrollState);
    });

    rail.addEventListener("scroll", updateScrollState, { passive: true });
    window.addEventListener("resize", updateScrollState);

    return () => {
      cancelAnimationFrame(initialMeasureId);
      cancelAnimationFrame(secondFrameId);
      rail.removeEventListener("scroll", updateScrollState);
      window.removeEventListener("resize", updateScrollState);
    };
  }, [targetId, updateScrollState]);

  function scrollByDirection(direction: 1 | -1) {
    const rail = getRailElement(targetId);

    if (!rail) {
      return;
    }

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    const firstCard = rail.firstElementChild as HTMLElement | null;
    const step = firstCard
      ? firstCard.getBoundingClientRect().width + 16
      : rail.clientWidth * 0.8;

    rail.scrollBy({
      left: direction * step,
      behavior: prefersReducedMotion ? "auto" : "smooth",
    });
  }

  return (
    <div
      className={
        className
          ? `hidden items-center gap-2 sm:flex ${className}`
          : "hidden items-center gap-2 sm:flex"
      }
    >
      <button
        type="button"
        onClick={() => scrollByDirection(-1)}
        disabled={!canScrollLeft}
        aria-label={t(language, "home", "railScrollLeft")}
        className="flex h-9 w-9 items-center justify-center rounded-full text-foreground transition-all duration-200 motion-reduce:transition-none hover:-translate-y-0.5 hover:bg-accent/15 hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:text-muted disabled:opacity-40 disabled:hover:translate-y-0"
      >
        <span aria-hidden="true">‹</span>
      </button>

      <button
        type="button"
        onClick={() => scrollByDirection(1)}
        disabled={!canScrollRight}
        aria-label={t(language, "home", "railScrollRight")}
        className="flex h-9 w-9 items-center justify-center rounded-full text-foreground transition-all duration-200 motion-reduce:transition-none hover:-translate-y-0.5 hover:bg-accent/15 hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:text-muted disabled:opacity-40 disabled:hover:translate-y-0"
      >
        <span aria-hidden="true">›</span>
      </button>
    </div>
  );
}
