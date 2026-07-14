export type Movie = {
  id: number;
  title: string;
  year: string;
  rating: number;
  posterText: string;
};

export const movies: Movie[] = [
  {
    id: 1,
    title: "Inception",
    year: "2010",
    rating: 8.8,
    posterText: "INCEPTION",
  },
  {
    id: 2,
    title: "Interstellar",
    year: "2014",
    rating: 8.7,
    posterText: "INTERSTELLAR",
  },
  {
    id: 3,
    title: "The Dark Knight",
    year: "2008",
    rating: 9.0,
    posterText: "BATMAN",
  },
  {
    id: 4,
    title: "Dune",
    year: "2021",
    rating: 8.1,
    posterText: "DUNE",
  },
];