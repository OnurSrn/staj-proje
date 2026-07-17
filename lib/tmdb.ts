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

export type MovieGenre = {
  id: number;
  name: string;
};

export type MovieCastMember = {
  id: number;
  name: string;
  character: string;
  profile_path: string | null;
  order: number;
};

export type MovieVideo = {
  id: string;
  key: string;
  name: string;
  site: string;
  type: string;
  official: boolean;
};

export type MovieDetails = TmdbMovie & {
  runtime: number | null;
  tagline: string;
  original_language: string;
  genres: MovieGenre[];
  credits: {
    cast: MovieCastMember[];
  };
  videos: {
    results: MovieVideo[];
  };
  recommendations: {
    results: TmdbMovie[];
  };
};

export type MovieCategory =
  | "popular"
  | "top-rated"
  | "now-playing"
  | "upcoming";

export type MovieSort =
  | "popularity.desc"
  | "vote_average.desc"
  | "primary_release_date.desc";

export type MovieListResponse = {
  page: number;
  results: TmdbMovie[];
  total_pages: number;
  total_results: number;
};

type MovieGenresResponse = {
  genres: MovieGenre[];
};

function getApiKey(): string {
  const apiKey = process.env.TMDB_API_KEY;

  if (!apiKey) {
    throw new Error("TMDB_API_KEY bulunamadı.");
  }

  return apiKey;
}

function getCategoryEndpoint(category: MovieCategory): string {
  const endpoints: Record<MovieCategory, string> = {
    popular: "popular",
    "top-rated": "top_rated",
    "now-playing": "now_playing",
    upcoming: "upcoming",
  };

  return endpoints[category];
}

export async function getMoviesByCategory(
  category: MovieCategory = "popular",
  page = 1
): Promise<MovieListResponse> {
  const apiKey = getApiKey();
  const safePage = Math.max(1, Math.min(page, 500));

  if (category === "popular") {
    const today = new Date();
    const oneYearAgo = new Date(today);

    oneYearAgo.setFullYear(today.getFullYear() - 1);

    const todayString = today.toISOString().split("T")[0];
    const oneYearAgoString = oneYearAgo.toISOString().split("T")[0];

    const params = new URLSearchParams({
      api_key: apiKey,
      language: "en-US",
      page: safePage.toString(),
      sort_by: "popularity.desc",
      include_adult: "false",
      include_video: "false",
      "primary_release_date.gte": oneYearAgoString,
      "primary_release_date.lte": todayString,
      "vote_count.gte": "100",
    });

    const response = await fetch(
      `${TMDB_BASE_URL}/discover/movie?${params.toString()}`,
      {
        next: {
          revalidate: 3600,
        },
      }
    );

    if (!response.ok) {
      throw new Error(
        `Popüler filmler alınamadı. Hata kodu: ${response.status}`
      );
    }

    return response.json();
  }

  const endpoint = getCategoryEndpoint(category);

  const response = await fetch(
    `${TMDB_BASE_URL}/movie/${endpoint}?api_key=${apiKey}&language=en-US&page=${safePage}`,
    {
      next: {
        revalidate: 3600,
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Filmler alınamadı. Hata kodu: ${response.status}`);
  }

  return response.json();
}

export async function discoverMovies(
  genreId: number,
  sortBy: MovieSort,
  page = 1
): Promise<MovieListResponse> {
  const apiKey = getApiKey();
  const safePage = Math.max(1, Math.min(page, 500));
  const today = new Date().toISOString().split("T")[0];

  const params = new URLSearchParams({
    api_key: apiKey,
    language: "en-US",
    page: safePage.toString(),
    sort_by: sortBy,
    include_adult: "false",
    include_video: "false",
  });

  if (genreId > 0) {
    params.set("with_genres", genreId.toString());
  }

  if (sortBy === "vote_average.desc") {
    params.set("vote_count.gte", "200");
    params.set("primary_release_date.lte", today);
  }

  if (sortBy === "primary_release_date.desc") {
    params.set("primary_release_date.lte", today);
    params.set("vote_count.gte", "20");
  }

  const response = await fetch(
    `${TMDB_BASE_URL}/discover/movie?${params.toString()}`,
    {
      next: {
        revalidate: 3600,
      },
    }
  );

  if (!response.ok) {
    throw new Error(
      `Filmler filtrelenemedi. Hata kodu: ${response.status}`
    );
  }

  return response.json();
}

export async function getMovieGenres(): Promise<MovieGenre[]> {
  const apiKey = getApiKey();

  const response = await fetch(
    `${TMDB_BASE_URL}/genre/movie/list?api_key=${apiKey}&language=en-US`,
    {
      next: {
        revalidate: 86400,
      },
    }
  );

  if (!response.ok) {
    throw new Error(
      `Film türleri alınamadı. Hata kodu: ${response.status}`
    );
  }

  const data: MovieGenresResponse = await response.json();

  return data.genres;
}

export async function getPopularMovies(): Promise<TmdbMovie[]> {
  const data = await getMoviesByCategory("popular", 1);

  return data.results;
}

export async function searchMovies(query: string): Promise<TmdbMovie[]> {
  const trimmedQuery = query.trim();

  if (!trimmedQuery) {
    return [];
  }

  const apiKey = getApiKey();

  const response = await fetch(
    `${TMDB_BASE_URL}/search/movie?api_key=${apiKey}&query=${encodeURIComponent(
      trimmedQuery
    )}&language=en-US&page=1&include_adult=false`,
    {
      cache: "no-store",
    }
  );

  if (!response.ok) {
    throw new Error(
      `Film araması yapılamadı. Hata kodu: ${response.status}`
    );
  }

  const data: MovieListResponse = await response.json();

  return data.results;
}

export async function getMovieDetails(
  movieId: string
): Promise<MovieDetails> {
  const apiKey = getApiKey();

  const response = await fetch(
    `${TMDB_BASE_URL}/movie/${movieId}?api_key=${apiKey}&language=en-US&append_to_response=credits,videos,recommendations`,
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

export function getProfileUrl(
  profilePath: string | null
): string | null {
  if (!profilePath) {
    return null;
  }

  return `https://image.tmdb.org/t/p/w185${profilePath}`;
}