import {
  SEARCH_FILTER_LIMITS,
  serializeSearchFilters,
  type SearchFilters,
} from "@/lib/searchFilters";
import { getSearchSortOptions, t } from "@/lib/i18n";
import type { AppLanguage } from "@/lib/settings";
import type { MovieGenre } from "@/lib/tmdb";

type SearchFilterFormProps = {
  filters: SearchFilters;
  genres: MovieGenre[];
  language: AppLanguage;
  // "Clear filters" yalnızca yapısal filtreleri sıfırlar, arama metnini
  // KORUR (bkz. görev talimatı bölüm 6/rapor) — bu URL page.tsx'te
  // updateSearchFilters/buildSearchHref ile merkezi olarak üretilir; bu
  // component yalnızca tüketir.
  clearFiltersHref: string;
};

const selectClassName =
  "w-full rounded-lg border border-border bg-input px-4 py-3 text-foreground outline-none focus:border-accent";

const labelClassName = "mb-2 block text-sm font-semibold text-muted";

// Bilerek plain bir GET formu — client state gerektirmez (hiçbir alan
// canlı bir önizleme üretmiyor), bu yüzden "use client" YOK: değişiklikler
// yalnızca "Filtreleri Uygula" ile bir sunucu round-trip'i tetikler (bkz.
// görev talimatı "Her seçimde gereksiz anlık network isteği atma").
export default function SearchFilterForm({
  filters,
  genres,
  language,
  clearFiltersHref,
}: SearchFilterFormProps) {
  const sortOptions = getSearchSortOptions(language);

  return (
    <form
      // Bilerek KEY: alanlar (select/input) uncontrolled/defaultValue
      // tabanlı — Next.js <Link> ile yapılan istemci-taraflı (soft) bir
      // navigasyonda React aynı DOM düğümünü koruyup defaultValue'yu
      // YOK SAYAR, bu da chip kaldırma/sayfalama sonrası select'in eski
      // seçimi göstermeye devam etmesine yol açar (doğrulanmış hata — bkz.
      // rapor). serializeSearchFilters'tan türeyen bu key, filtreler her
      // değiştiğinde formu YENİDEN mount ederek DOM'u her zaman sunucudan
      // gelen gerçek filtrelerle senkron tutar.
      key={serializeSearchFilters(filters).toString()}
      action="/search"
      method="GET"
      className="pattern-brand pattern-subtle relative mt-8 max-w-4xl rounded-2xl border border-border bg-surface p-5"
    >
      <div>
        <label htmlFor="query" className={labelClassName}>
          {t(language, "search", "inputLabel")}
        </label>

        <input
          id="query"
          type="text"
          name="query"
          defaultValue={filters.query}
          placeholder={t(language, "search", "inputPlaceholder")}
          className="w-full min-w-0 rounded-lg border border-border bg-input px-4 py-3 text-foreground outline-none transition placeholder:text-muted focus:border-accent"
        />
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div>
          <label htmlFor="genre" className={labelClassName}>
            {t(language, "search", "genreLabel")}
          </label>

          <select
            id="genre"
            name="genre"
            defaultValue={filters.genreId?.toString() ?? "0"}
            className={selectClassName}
          >
            <option value="0">{t(language, "search", "allGenres")}</option>

            {genres.map((genre) => (
              <option key={genre.id} value={genre.id}>
                {genre.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="yearFrom" className={labelClassName}>
            {t(language, "search", "yearFromLabel")}
          </label>

          <input
            id="yearFrom"
            type="number"
            name="yearFrom"
            inputMode="numeric"
            min={SEARCH_FILTER_LIMITS.minYear}
            max={SEARCH_FILTER_LIMITS.maxYear}
            defaultValue={filters.yearFrom ?? ""}
            placeholder={String(SEARCH_FILTER_LIMITS.minYear)}
            className={selectClassName}
          />
        </div>

        <div>
          <label htmlFor="yearTo" className={labelClassName}>
            {t(language, "search", "yearToLabel")}
          </label>

          <input
            id="yearTo"
            type="number"
            name="yearTo"
            inputMode="numeric"
            min={SEARCH_FILTER_LIMITS.minYear}
            max={SEARCH_FILTER_LIMITS.maxYear}
            defaultValue={filters.yearTo ?? ""}
            placeholder={String(SEARCH_FILTER_LIMITS.maxYear)}
            className={selectClassName}
          />
        </div>

        <div>
          <label htmlFor="rating" className={labelClassName}>
            {t(language, "search", "minimumRatingLabel")}
          </label>

          <select
            id="rating"
            name="rating"
            defaultValue={filters.minimumRating?.toString() ?? ""}
            className={selectClassName}
          >
            <option value="">{t(language, "search", "anyRatingOption")}</option>

            {SEARCH_FILTER_LIMITS.ratingQuickOptions.map((value) => (
              <option key={value} value={value}>
                {value}+
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="sort" className={labelClassName}>
            {t(language, "search", "sortLabel")}
          </label>

          <select
            id="sort"
            name="sort"
            defaultValue={filters.sort}
            className={selectClassName}
          >
            {sortOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Filtre değişince sayfa her zaman 1'e döner (bkz. görev talimatı
         bölüm 8) — sayfalama linkleri bu formdan değil, ayrı href'lerden
         gelir ve page'i açıkça taşır. */}
      <input type="hidden" name="page" value="1" />

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <button
          type="submit"
          className="rounded-lg bg-accent px-6 py-3 font-semibold text-accent-foreground transition hover:bg-accent-hover"
        >
          {t(language, "search", "applyFilters")}
        </button>

        <a
          href={clearFiltersHref}
          className="rounded-lg border border-border px-6 py-3 font-semibold text-foreground transition hover:border-accent hover:text-accent"
        >
          {t(language, "common", "clearFilters")}
        </a>
      </div>
    </form>
  );
}
