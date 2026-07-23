import Link from "next/link";
import MovieCard from "@/components/MovieCard";
import RailControls from "@/components/home/RailControls";
import SectionHeader from "@/components/ui/SectionHeader";
import { getPosterUrl, type TmdbMovie } from "@/lib/tmdb";

// "secondary" tonu, aynı rail bileşenini kullanan komşu rail'lerin (ör.
// Popular / Now Playing) veri mantığına dokunmadan yalnızca hangi marka
// renginin baskın olduğunu ters çevirerek görsel olarak ayrışmasını sağlar
// (bkz. görev talimatı bölüm 3 "Popüler ile Gösterimde çok aynı
// hissediyorsa... surface tonu ile fark yarat").
type MovieRailTone = "primary" | "secondary";

type MovieRailProps = {
  title: string;
  description?: string;
  movies: TmdbMovie[];
  href?: string;
  actionLabel?: string;
  tone?: MovieRailTone;
  className?: string;
};

// Bir rail'de gösterilecek üst sınır. TMDB kategori uç noktaları zaten
// sayfa başına 20 sonuç döndürdüğü için bu pratikte bir üst sınır
// garantisidir, ekstra sayfalama gerektirmez.
const RAIL_MAX_MOVIES = 20;

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-+|-+$)/g, "");
}

// Aynı film aynı rail içinde birden fazla görünmesin. TMDB kategori
// sayfaları normalde zaten tekilse de, bu saf fonksiyon MovieRail'i
// çağıran koddan bağımsız olarak garanti sağlar.
function dedupeMovies(movies: TmdbMovie[]): TmdbMovie[] {
  const seenIds = new Set<number>();
  const result: TmdbMovie[] = [];

  for (const movie of movies) {
    if (seenIds.has(movie.id)) {
      continue;
    }

    seenIds.add(movie.id);
    result.push(movie);
  }

  return result;
}

export default function MovieRail({
  title,
  description,
  movies,
  href,
  actionLabel,
  tone = "primary",
  className,
}: MovieRailProps) {
  const displayedMovies = dedupeMovies(movies).slice(0, RAIL_MAX_MOVIES);

  if (displayedMovies.length === 0) {
    return null;
  }

  const scrollId = `rail-${slugify(title)}`;
  const isSecondary = tone === "secondary";

  const headerPanelClassName = isSecondary
    ? "pattern-brand pattern-medium relative overflow-hidden rounded-xl border border-accent/15 bg-gradient-to-r from-accent-secondary-soft/60 to-accent-soft/40 px-5 py-4 backdrop-blur-sm transition-colors duration-200 motion-reduce:transition-none hover:border-accent/30 hover:from-accent-secondary-soft hover:to-accent-soft"
    : "pattern-brand pattern-medium relative overflow-hidden rounded-xl border border-accent-secondary/15 bg-gradient-to-r from-accent-soft/60 to-accent-secondary-soft/40 px-5 py-4 backdrop-blur-sm transition-colors duration-200 motion-reduce:transition-none hover:border-accent-secondary/30 hover:from-accent-soft hover:to-accent-secondary-soft";

  const titleClassName = isSecondary
    ? "text-2xl font-bold text-accent-secondary sm:text-3xl"
    : "text-2xl font-bold text-accent sm:text-3xl";

  const barClassName = isSecondary
    ? "h-6 w-1 shrink-0 rounded-full bg-accent sm:h-7"
    : "h-6 w-1 shrink-0 rounded-full bg-accent-secondary sm:h-7";

  const actionLinkClassName = isSecondary
    ? "group/action hidden items-center gap-1 text-sm font-semibold text-accent-secondary underline decoration-transparent underline-offset-4 transition-all duration-200 motion-reduce:transition-none hover:text-accent-secondary-hover hover:decoration-current sm:inline-flex"
    : "group/action hidden items-center gap-1 text-sm font-semibold text-accent underline decoration-transparent underline-offset-4 transition-all duration-200 motion-reduce:transition-none hover:text-accent-hover hover:decoration-current sm:inline-flex";

  const cardGlowClassName = isSecondary
    ? "pointer-events-none absolute inset-0 rounded-xl border border-transparent bg-gradient-to-br from-accent-secondary/0 to-accent/0 opacity-0 transition-opacity duration-200 motion-reduce:transition-none group-hover:border-accent/50 group-hover:from-accent-secondary/15 group-hover:to-accent/10 group-hover:opacity-100 group-focus-within:border-accent/50 group-focus-within:from-accent-secondary/15 group-focus-within:to-accent/10 group-focus-within:opacity-100"
    : "pointer-events-none absolute inset-0 rounded-xl border border-transparent bg-gradient-to-br from-accent/0 to-accent-secondary/0 opacity-0 transition-opacity duration-200 motion-reduce:transition-none group-hover:border-accent-secondary/50 group-hover:from-accent/15 group-hover:to-accent-secondary/10 group-hover:opacity-100 group-focus-within:border-accent-secondary/50 group-focus-within:from-accent/15 group-focus-within:to-accent-secondary/10 group-focus-within:opacity-100";

  return (
    <section className={className}>
      <SectionHeader
        className={headerPanelClassName}
        title={
          <div className="flex items-center gap-3">
            <span aria-hidden="true" className={barClassName} />

            <h2 className={titleClassName}>{title}</h2>
          </div>
        }
        description={
          description ? (
            <p className="text-sm text-muted">{description}</p>
          ) : undefined
        }
        action={
          <div className="flex items-center gap-3">
            {href && actionLabel && (
              <Link href={href} className={actionLinkClassName}>
                {actionLabel}
                <span
                  aria-hidden="true"
                  className="inline-block transition-transform duration-200 motion-reduce:transition-none group-hover/action:translate-x-0.5"
                >
                  →
                </span>
              </Link>
            )}

            <RailControls targetId={scrollId} />
          </div>
        }
      />

      <div
        id={scrollId}
        className="rail-scroll mt-6 flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2"
      >
        {displayedMovies.map((movie) => (
          <div
            key={movie.id}
            className="group relative w-[45%] shrink-0 snap-start sm:w-[32%] md:w-[24%] lg:w-[19%] xl:w-[15%]"
          >
            <MovieCard
              id={movie.id}
              title={movie.title}
              year={movie.release_date?.slice(0, 4) ?? ""}
              rating={movie.vote_average}
              voteCount={movie.vote_count}
              overview={movie.overview}
              posterUrl={getPosterUrl(movie.poster_path)}
            />

            <div aria-hidden="true" className={cardGlowClassName} />
          </div>
        ))}
      </div>
    </section>
  );
}
