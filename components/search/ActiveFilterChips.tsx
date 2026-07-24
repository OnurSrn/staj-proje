import Link from "next/link";
import {
  buildSearchHref,
  hasActiveStructuralFilters,
  updateSearchFilters,
  type SearchFilters,
} from "@/lib/searchFilters";
import { t } from "@/lib/i18n";
import type { AppLanguage } from "@/lib/settings";
import type { MovieGenre } from "@/lib/tmdb";

type ActiveFilterChipsProps = {
  filters: SearchFilters;
  genres: MovieGenre[];
  language: AppLanguage;
};

type Chip = {
  key: string;
  label: string;
  href: string;
};

const CHIP_CLASSNAME =
  "inline-flex items-center gap-1.5 rounded-full border border-accent/30 bg-accent-soft px-3.5 py-2.5 text-sm font-medium text-accent transition hover:border-accent hover:bg-accent/20";

// Yalnızca aktif YAPISAL filtreleri özetler (bkz. görev talimatı bölüm 7).
// Query kasıtlı olarak chip'e dönüştürülmez — arama kutusunun kendisi
// zaten görünür durumda.
export default function ActiveFilterChips({
  filters,
  genres,
  language,
}: ActiveFilterChipsProps) {
  if (!hasActiveStructuralFilters(filters)) {
    return null;
  }

  const chips: Chip[] = [];

  if (filters.genreId !== undefined) {
    const genreName =
      genres.find((genre) => genre.id === filters.genreId)?.name ??
      String(filters.genreId);

    chips.push({
      key: "genre",
      label: genreName,
      href: buildSearchHref(
        updateSearchFilters(filters, { genreId: undefined })
      ),
    });
  }

  if (filters.yearFrom !== undefined || filters.yearTo !== undefined) {
    const label =
      filters.yearFrom !== undefined && filters.yearTo !== undefined
        ? `${filters.yearFrom}–${filters.yearTo}`
        : filters.yearFrom !== undefined
          ? `${filters.yearFrom}+`
          : `≤${filters.yearTo}`;

    chips.push({
      key: "year",
      label,
      href: buildSearchHref(
        updateSearchFilters(filters, { yearFrom: undefined, yearTo: undefined })
      ),
    });
  }

  if (filters.minimumRating !== undefined) {
    chips.push({
      key: "rating",
      label: `${t(language, "search", "minimumRatingLabel")} ${filters.minimumRating}+`,
      href: buildSearchHref(
        updateSearchFilters(filters, { minimumRating: undefined })
      ),
    });
  }

  if (filters.sort !== "relevance") {
    chips.push({
      key: "sort",
      label: t(language, "searchSorts", filters.sort),
      href: buildSearchHref(updateSearchFilters(filters, { sort: "relevance" })),
    });
  }

  const clearAllHref = buildSearchHref(
    updateSearchFilters(filters, {
      genreId: undefined,
      yearFrom: undefined,
      yearTo: undefined,
      minimumRating: undefined,
      sort: "relevance",
    })
  );

  return (
    <div className="mb-6 flex flex-wrap items-center gap-2">
      <span className="text-sm font-semibold text-muted">
        {t(language, "search", "activeFiltersHeading")}:
      </span>

      {chips.map((chip) => (
        <Link key={chip.key} href={chip.href} className={CHIP_CLASSNAME}>
          {chip.label}
          <span aria-hidden="true">×</span>
        </Link>
      ))}

      <Link
        href={clearAllHref}
        className="text-sm font-semibold text-muted underline underline-offset-4 transition hover:text-accent"
      >
        {t(language, "common", "clearFilters")}
      </Link>
    </div>
  );
}
