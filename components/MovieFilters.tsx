import { t } from "@/lib/i18n";
import type { AppLanguage } from "@/lib/settings";
import type {
  MovieGenre,
  MovieSort,
} from "@/lib/tmdb";

type MovieFiltersProps = {
  genres: MovieGenre[];
  selectedGenre: number;
  selectedSort: MovieSort;
  language: AppLanguage;
};

const SORT_VALUES: MovieSort[] = [
  "popularity.desc",
  "vote_average.desc",
  "primary_release_date.desc",
];

export default function MovieFilters({
  genres,
  selectedGenre,
  selectedSort,
  language,
}: MovieFiltersProps) {
  return (
    <form
      action="/"
      method="GET"
      className="mb-8 grid gap-4 rounded-2xl border border-border bg-surface p-5 sm:grid-cols-[1fr_1fr_auto]"
    >
      <div>
        <label
          htmlFor="genre"
          className="mb-2 block text-sm font-semibold text-muted"
        >
          {t(language, "whatToWatch", "genreLabel")}
        </label>

        <select
          id="genre"
          name="genre"
          defaultValue={selectedGenre.toString()}
          className="w-full rounded-lg border border-border bg-input px-4 py-3 text-foreground outline-none focus:border-accent"
        >
          <option value="0">{t(language, "home", "allGenres")}</option>

          {genres.map((genre) => (
            <option key={genre.id} value={genre.id}>
              {genre.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label
          htmlFor="sort"
          className="mb-2 block text-sm font-semibold text-muted"
        >
          {t(language, "home", "sortFieldLabel")}
        </label>

        <select
          id="sort"
          name="sort"
          defaultValue={selectedSort}
          className="w-full rounded-lg border border-border bg-input px-4 py-3 text-foreground outline-none focus:border-accent"
        >
          {SORT_VALUES.map((sortValue) => (
            <option key={sortValue} value={sortValue}>
              {t(language, "sorts", sortValue)}
            </option>
          ))}
        </select>
      </div>

      <input type="hidden" name="page" value="1" />

      <button
        type="submit"
        className="self-end rounded-lg bg-accent px-6 py-3 font-semibold text-accent-foreground transition hover:bg-accent-hover"
      >
        {t(language, "home", "filterCta")}
      </button>
    </form>
  );
}
