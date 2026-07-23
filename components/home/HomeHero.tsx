"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { buildHeroSlideLabel, t } from "@/lib/i18n";
import type { AppLanguage } from "@/lib/settings";
import { getBackdropUrl, getPosterUrl, type MovieDetails } from "@/lib/tmdb";

const AUTOPLAY_INTERVAL_MS = 8000;

type HomeHeroProps = {
  movies: MovieDetails[];
  language: AppLanguage;
};

export default function HomeHero({ movies, language }: HomeHeroProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [manualNavKey, setManualNavKey] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  // SSR/ilk client render'da her zaman "true" varsayılır (sunucu, OS
  // tercihini bilemez) — gerçek tercih yalnızca mount sonrası bir effect
  // içinde okunur, böylece hydration uyumsuzluğu oluşmaz.
  const [autoplayAllowed, setAutoplayAllowed] = useState(true);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

    function handleChange(event: MediaQueryListEvent) {
      setAutoplayAllowed(!event.matches);
    }

    // İlk okuma, RailControls'teki aynı desenle asenkron hale getirilir
    // (react-hooks/set-state-in-effect) — setState effect gövdesinde
    // senkron çağrılmaz, "change" dinleyicisiyle aynı asenkron yoldan
    // geçer.
    const initialCheckId = requestAnimationFrame(() =>
      setAutoplayAllowed(!mediaQuery.matches)
    );

    mediaQuery.addEventListener("change", handleChange);

    return () => {
      cancelAnimationFrame(initialCheckId);
      mediaQuery.removeEventListener("change", handleChange);
    };
  }, []);

  useEffect(() => {
    if (movies.length <= 1 || isPaused || !autoplayAllowed) {
      return;
    }

    const intervalId = setInterval(() => {
      // Sekme arka plandayken ilerleme yapılmaz — interval'i durdurup
      // yeniden kurmak yerine, her tick'te görünürlük kontrol edilir;
      // sekme geri görünür olduğunda normal ritim otomatik devam eder.
      if (document.visibilityState !== "visible") {
        return;
      }

      setActiveIndex((current) => (current + 1) % movies.length);
    }, AUTOPLAY_INTERVAL_MS);

    return () => clearInterval(intervalId);
    // manualNavKey yalnızca sayacı SIFIRLAMAK için bağımlılık listesinde —
    // otomatik tick'ler bu değeri değiştirmez, yalnızca kullanıcının
    // manuel seçimi değiştirir ("manuel seçimden sonra sayaç yeniden
    // başlasın").
  }, [movies.length, isPaused, autoplayAllowed, manualNavKey]);

  const goToIndex = useCallback((index: number) => {
    setActiveIndex(index);
    setManualNavKey((key) => key + 1);
  }, []);

  if (movies.length === 0) {
    return null;
  }

  const activeMovie = movies[activeIndex];
  const year = activeMovie.release_date?.slice(0, 4) ?? "";
  const hasRating =
    activeMovie.vote_count > 0 &&
    Number.isFinite(activeMovie.vote_average) &&
    activeMovie.vote_average > 0;
  const genreNames = activeMovie.genres.slice(0, 3);

  return (
    <section
      className="relative min-h-[480px] overflow-hidden rounded-2xl border border-border bg-surface sm:min-h-[520px]"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocus={() => setIsPaused(true)}
      onBlur={() => setIsPaused(false)}
    >
      <div className="absolute inset-0">
        {movies.map((movie, index) => {
          const backdropUrl = getBackdropUrl(movie.backdrop_path);

          return backdropUrl ? (
            <Image
              key={movie.id}
              src={backdropUrl}
              alt=""
              fill
              priority={index === 0}
              sizes="100vw"
              className={
                index === activeIndex
                  ? "object-cover opacity-[var(--hero-backdrop-opacity)] transition-opacity duration-700 ease-out motion-reduce:transition-none"
                  : "object-cover opacity-0 transition-opacity duration-700 ease-out motion-reduce:transition-none"
              }
            />
          ) : null;
        })}
      </div>

      {/* Alt kenarda yumuşak taş/karbon tonuna geçiş — arka plan ile
         backdrop fotoğrafı arasında sert bir kesim olmasın. */}
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-background/10" />

      {/* Solda oturan metin bloğunun okunabilirliği için ek yatay derinlik
         — yalnızca geniş ekranda (poster sağda, metin solda kompozisyonu
         orada devreye girer); poster tarafı bilinçli olarak daha temiz
         bırakılır (bkz. görev talimatı bölüm 6B). */}
      <div className="absolute inset-0 hidden bg-gradient-to-r from-background/80 via-background/20 to-transparent lg:block" />

      {/* Kenarlarda yumuşak vinyet — backdrop'un dört bir yanı aniden
         kesilmesin, arka plana yumuşakça erisin. */}
      <div
        className="absolute inset-0 opacity-70"
        style={{
          background:
            "radial-gradient(130% 130% at 50% 25%, transparent 55%, var(--background) 100%)",
        }}
      />

      {/* Marka deseni — arka plandaki gradyanların üstünde, gerçek
         içeriğin altında TEK bir doku katmanı (bkz. app/globals.css
         ".pattern-brand" + ".pattern-hero"). Geometri ve poster-tarafı
         solma artık merkezi olarak tanımlı (bkz. globals.css'teki
         "@media (min-width: 1024px) { .pattern-hero::before ... }"),
         bu bileşen yalnızca rolü belirtir. */}
      <div
        className="pattern-brand pattern-hero absolute inset-0"
        aria-hidden="true"
      />

      <div className="relative flex flex-col gap-8 px-6 py-10 sm:px-10 sm:py-14 lg:flex-row lg:items-center lg:justify-between">
        <div className="order-2 flex min-w-0 flex-1 flex-col gap-5 lg:order-1">
          <div
            key={activeMovie.id}
            className="flex flex-col gap-4 animate-[hero-fade-in_400ms_ease-out] motion-reduce:animate-none"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent-secondary">
              {t(language, "home", "heroEyebrow")}
            </p>

            <div className="flex flex-wrap items-center gap-3 text-sm text-muted">
              {genreNames.map((genre) => (
                <span
                  key={genre.id}
                  className="rounded-full border border-border px-3 py-1"
                >
                  {genre.name}
                </span>
              ))}

              {year && <span>{year}</span>}

              {hasRating && (
                <span className="rounded-full bg-accent px-3 py-1 font-semibold text-accent-foreground">
                  {activeMovie.vote_average.toFixed(1)}
                </span>
              )}
            </div>

            <h1 className="max-w-2xl text-3xl font-bold leading-tight sm:text-5xl">
              {activeMovie.title}
            </h1>

            <p className="max-w-xl line-clamp-3 text-sm text-muted sm:text-base">
              {activeMovie.overview ||
                t(language, "movieDetail", "noOverview")}
            </p>

            <div>
              <Link
                href={`/movie/${activeMovie.id}`}
                className="inline-flex items-center rounded-xl bg-accent px-6 py-3 font-semibold text-accent-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.15),0_10px_24px_-10px_var(--accent)] transition-all duration-200 motion-reduce:transition-none hover:-translate-y-0.5 hover:bg-accent-hover hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.2),0_14px_28px_-10px_var(--accent),0_0_0_4px_var(--accent-secondary-soft)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-secondary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                {t(language, "home", "heroDetailsCta")}
              </Link>
            </div>
          </div>

          {movies.length > 1 && (
            <div
              role="tablist"
              aria-label={t(language, "home", "heroCarouselLabel")}
              className="flex items-center gap-2 pt-1"
            >
              {movies.map((movie, index) => (
                <button
                  key={movie.id}
                  type="button"
                  role="tab"
                  aria-selected={index === activeIndex}
                  aria-label={buildHeroSlideLabel(
                    language,
                    index + 1,
                    movies.length
                  )}
                  onClick={() => goToIndex(index)}
                  className={
                    index === activeIndex
                      ? "h-2.5 w-7 rounded-full bg-accent shadow-[0_0_10px_-2px_var(--accent)] transition-all duration-300 motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                      : "carousel-dot h-2.5 w-2.5 bg-border transition-all duration-300 motion-reduce:transition-none hover:bg-accent-secondary/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                  }
                />
              ))}
            </div>
          )}
        </div>

        <div className="relative order-1 mx-auto aspect-[2/3] w-32 shrink-0 sm:w-40 lg:order-2 lg:w-72">
          {/* Poster'ın arkasında çok hafif iki renkli halo — poster'ı
             backdrop'tan net ayırır, "bağımsız premium bir obje" hissi
             verir (bkz. görev talimatı bölüm 6C). */}
          <div
            aria-hidden="true"
            className="absolute -inset-5 -z-10 rounded-[2rem] bg-accent/20 blur-2xl"
          />
          <div
            aria-hidden="true"
            className="absolute -inset-8 -z-10 rounded-[2.5rem] bg-accent-secondary/15 blur-3xl"
          />

          {movies.map((movie, index) => {
            const posterUrl = getPosterUrl(movie.poster_path);

            return posterUrl ? (
              <div
                key={movie.id}
                className={
                  index === activeIndex
                    ? "absolute inset-0 scale-100 overflow-hidden rounded-xl border border-accent/30 opacity-100 shadow-[0_24px_48px_-20px_rgba(0,0,0,0.55)] transition-all duration-500 ease-out motion-reduce:transition-none"
                    : "absolute inset-0 scale-95 overflow-hidden rounded-xl border border-accent/30 opacity-0 shadow-[0_24px_48px_-20px_rgba(0,0,0,0.55)] transition-all duration-500 ease-out motion-reduce:transition-none"
                }
              >
                <Image
                  src={posterUrl}
                  alt={`${movie.title} poster`}
                  fill
                  sizes="(max-width: 1024px) 160px, 288px"
                  className="object-cover"
                />
              </div>
            ) : null;
          })}
        </div>
      </div>
    </section>
  );
}
