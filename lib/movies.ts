export type Movie = {
  id: number;
  title: string;
  year: string;
  rating: number;
  genre: string;
  posterText: string;
};

export const movies: Movie[] = [
  {
    id: 1,
    title: "Inception",
    year: "2010",
    rating: 8.8,
    genre: "Sci-Fi",
    posterText: "INCEPTION",
  },
  {
    id: 2,
    title: "Interstellar",
    year: "2014",
    rating: 8.7,
    genre: "Adventure",
    posterText: "INTERSTELLAR",
  },
  {
    id: 3,
    title: "The Dark Knight",
    year: "2008",
    rating: 9.0,
    genre: "Action",
    posterText: "BATMAN",
  },
  {
    id: 4,
    title: "Dune",
    year: "2021",
    rating: 8.1,
    genre: "Sci-Fi",
    posterText: "DUNE",
  },
  {
    id: 5,
    title: "The Matrix",
    year: "1999",
    rating: 8.7,
    genre: "Cyberpunk",
    posterText: "MATRIX",
  },
];