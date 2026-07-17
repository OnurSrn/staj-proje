import { NextResponse } from "next/server";
import { getMovieDetails } from "@/lib/tmdb";

type MovieApiRouteProps = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(
  request: Request,
  { params }: MovieApiRouteProps
) {
  try {
    const { id } = await params;
    const movie = await getMovieDetails(id);

    return NextResponse.json(movie);
  } catch {
    return NextResponse.json(
      {
        message: "Film bilgileri alınamadı.",
      },
      {
        status: 500,
      }
    );
  }
}