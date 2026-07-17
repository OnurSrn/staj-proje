import type {
  MovieGenre,
  MovieSort,
} from "@/lib/tmdb";

type MovieFiltersProps = {
  genres: MovieGenre[];
  selectedGenre: number;
  selectedSort: MovieSort;
};

export default function MovieFilters({
  genres,
  selectedGenre,
  selectedSort,
}: MovieFiltersProps) {
  return (
    <form
      action="/"
      method="GET"
      className="mb-8 grid gap-4 rounded-2xl border border-neutral-800 bg-neutral-900 p-5 sm:grid-cols-[1fr_1fr_auto]"
    >
      <div>
        <label
          htmlFor="genre"
          className="mb-2 block text-sm font-semibold text-neutral-300"
        >
          Film Türü
        </label>

        <select
          id="genre"
          name="genre"
          defaultValue={selectedGenre.toString()}
          className="w-full rounded-lg border border-neutral-700 bg-neutral-950 px-4 py-3 text-white outline-none focus:border-yellow-400"
        >
          <option value="0">Tüm Türler</option>

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
          className="mb-2 block text-sm font-semibold text-neutral-300"
        >
          Sıralama
        </label>

        <select
          id="sort"
          name="sort"
          defaultValue={selectedSort}
          className="w-full rounded-lg border border-neutral-700 bg-neutral-950 px-4 py-3 text-white outline-none focus:border-yellow-400"
        >
          <option value="popularity.desc">
            En Popüler
          </option>

          <option value="vote_average.desc">
            En Yüksek Puan
          </option>

          <option value="primary_release_date.desc">
            En Yeni
          </option>
        </select>
      </div>

      <input type="hidden" name="page" value="1" />

      <button
        type="submit"
        className="self-end rounded-lg bg-yellow-400 px-6 py-3 font-semibold text-black transition hover:bg-yellow-300"
      >
        Filtrele
      </button>
    </form>
  );
}