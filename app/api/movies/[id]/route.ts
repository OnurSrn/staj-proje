import { NextResponse } from "next/server";
import { getMovieDetails, TmdbNotFoundError } from "@/lib/tmdb";

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
  } catch (error) {
    if (error instanceof TmdbNotFoundError) {
      return NextResponse.json(
        {
          message: "Film bulunamadı.",
        },
        {
          status: 404,
        }
      );
    }

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