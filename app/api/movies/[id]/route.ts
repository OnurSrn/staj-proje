import { NextResponse } from "next/server";
import { getMovieDetails, getMovieDnaDetails, TmdbNotFoundError } from "@/lib/tmdb";

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
    // Varsayılan davranış (mode param yok) geriye dönük uyumlu kalır: tam
    // getMovieDetails (credits,videos,recommendations,keywords). ?mode=dna
    // yalnızca For You/DNA akışının kullandığı hafif alan setini çeker
    // (bkz. lib/tmdb.ts getMovieDnaDetails).
    const mode = new URL(request.url).searchParams.get("mode");
    const movie =
      mode === "dna" ? await getMovieDnaDetails(id) : await getMovieDetails(id);

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