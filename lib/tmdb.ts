const TMDB_BASE_URL = "https://api.themoviedb.org/3";

export type TmdbMovie = {
  id: number;
  title: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date: string;
  vote_average: number;
};

export type MovieDetails = TmdbMovie & {
  runtime: number | null;
  tagline: string;
  original_language: string;
  genres: {
    id: number;
    name: string;
  }[];
};

type PopularMoviesResponse = {
  results: TmdbMovie[];
};

function getApiKey(): string {
  const apiKey = process.env.TMDB_API_KEY;

  if (!apiKey) {
    throw new Error("TMDB_API_KEY bulunamadı.");
  }

  return apiKey;
}

export async function getPopularMovies(): Promise<TmdbMovie[]> {
  const apiKey = getApiKey();

  const response = await fetch(
    `${TMDB_BASE_URL}/movie/popular?api_key=${apiKey}&language=en-US&page=1`,
    {
      next: {
        revalidate: 3600,
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Filmler alınamadı. Hata kodu: ${response.status}`);
  }

  const data: PopularMoviesResponse = await response.json();

  return data.results;
}

export async function getMovieDetails(
  movieId: string
): Promise<MovieDetails> {
  const apiKey = getApiKey();

  const response = await fetch(
    `${TMDB_BASE_URL}/movie/${movieId}?api_key=${apiKey}&language=en-US`,
    {
      next: {
        revalidate: 3600,
      },
    }
  );

  if (!response.ok) {
    throw new Error(
      `Film detayları alınamadı. Hata kodu: ${response.status}`
    );
  }

  return response.json();
}

export function getPosterUrl(
  posterPath: string | null
): string | null {
  if (!posterPath) {
    return null;
  }

  return `https://image.tmdb.org/t/p/w500${posterPath}`;
}

export function getBackdropUrl(
  backdropPath: string | null
): string | null {
  if (!backdropPath) {
    return null;
  }

  return `https://image.tmdb.org/t/p/original${backdropPath}`;
}