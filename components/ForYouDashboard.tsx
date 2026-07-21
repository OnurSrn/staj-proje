"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import MovieCard from "@/components/MovieCard";
import { useRecommendations } from "@/components/hooks/useRecommendations";
import { getPosterUrl } from "@/lib/tmdb";
import type { TasteProfile } from "@/lib/tasteProfile";

const CONFIDENCE_LABELS: Record<TasteProfile["confidence"], string> = {
  low: "Düşük Güven",
  medium: "Orta Güven",
  high: "Yüksek Güven",
};

function DashboardSkeleton() {
  return (
    <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
      {Array.from({ length: 12 }).map((_, index) => (
        <div
          key={index}
          className="overflow-hidden rounded-xl border border-neutral-800 bg-neutral-900"
        >
          <div className="aspect-[2/3] animate-pulse bg-neutral-800" />

          <div className="space-y-2 p-3">
            <div className="h-4 animate-pulse rounded bg-neutral-800" />
            <div className="h-3 w-2/3 animate-pulse rounded bg-neutral-800" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function ForYouDashboard() {
  const router = useRouter();
  const { recommendations, tasteProfile, isLoading, hasError } =
    useRecommendations();

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  if (hasError) {
    return (
      <div className="mt-10 rounded-2xl border border-red-500/40 bg-red-500/10 p-10 text-center">
        <h2 className="text-xl font-semibold text-red-400">
          Öneriler yüklenemedi
        </h2>

        <p className="mt-3 text-neutral-400">
          TMDB&apos;den veri alınırken bir sorun oluştu.
        </p>

        <button
          type="button"
          onClick={() => router.refresh()}
          className="mt-6 rounded-lg bg-yellow-400 px-5 py-3 font-semibold text-black transition hover:bg-yellow-300"
        >
          Tekrar Dene
        </button>
      </div>
    );
  }

  const hasAnyProfileData =
    tasteProfile !== null &&
    (tasteProfile.totalRatedMovies > 0 ||
      tasteProfile.totalStatusMovies > 0 ||
      tasteProfile.explicitFavoriteActorIds.length > 0 ||
      tasteProfile.explicitFavoriteDirectorIds.length > 0 ||
      tasteProfile.explicitFavoriteCompanyIds.length > 0);

  if (!hasAnyProfileData) {
    return (
      <div className="mt-10 rounded-2xl border border-dashed border-neutral-700 bg-neutral-900 p-10 text-center">
        <h2 className="text-xl font-semibold">
          Henüz kişisel öneri oluşturmak için yeterli verin yok.
        </h2>

        <p className="mt-3 text-neutral-400">
          Birkaç filme puan ver, izleme durumu işaretle veya favori
          oyuncu/yönetmen/stüdyo ekle — öneriler burada belirmeye başlar.
        </p>

        <div className="mt-6 flex flex-wrap justify-center gap-4">
          <Link
            href="/"
            className="rounded-lg bg-yellow-400 px-5 py-3 font-semibold text-black transition hover:bg-yellow-300"
          >
            Filmleri Keşfet
          </Link>

          <Link
            href="/preferences"
            className="rounded-lg border border-neutral-700 px-5 py-3 font-semibold text-neutral-200 transition hover:border-yellow-400 hover:text-yellow-400"
          >
            Tercihlerini Ekle
          </Link>

          <Link
            href="/what-to-watch"
            className="rounded-lg border border-neutral-700 px-5 py-3 font-semibold text-neutral-200 transition hover:border-yellow-400 hover:text-yellow-400"
          >
            Ne İzlesem?
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-10">
      <div className="flex flex-wrap items-center gap-3">
        <span className="rounded-full border border-yellow-400/40 px-3 py-1 text-xs font-semibold text-yellow-400">
          {CONFIDENCE_LABELS[tasteProfile.confidence]}
        </span>

        {tasteProfile.confidence === "low" && (
          <p className="text-sm text-neutral-500">
            Daha fazla filme puan verdikçe öneriler sana daha iyi uyum sağlar.
          </p>
        )}
      </div>

      {recommendations.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-neutral-700 bg-neutral-900 p-10 text-center">
          <h2 className="text-xl font-semibold">Şu an için öneri bulunamadı</h2>

          <p className="mt-3 text-neutral-400">
            Daha fazla film puanladıkça veya tercih ekledikçe burada öneriler
            görünecek.
          </p>
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {recommendations.map((candidate) => (
            <div key={candidate.movie.id} className="flex flex-col gap-2">
              <MovieCard
                id={candidate.movie.id}
                title={candidate.movie.title}
                year={candidate.movie.releaseDate?.slice(0, 4) ?? ""}
                rating={candidate.movie.voteAverage}
                voteCount={candidate.movie.voteCount}
                overview={candidate.movie.overview}
                posterUrl={getPosterUrl(candidate.movie.posterPath)}
              />

              {candidate.reasons.length > 0 && (
                <ul className="space-y-1">
                  {candidate.reasons.slice(0, 2).map((reason, index) => (
                    <li
                      key={index}
                      className="line-clamp-1 text-xs text-neutral-500"
                      title={reason.label}
                    >
                      {reason.label}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
