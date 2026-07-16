import Image from "next/image";
import Link from "next/link";

type MovieCardProps = {
  id: number;
  title: string;
  year: string;
  rating: number;
  overview: string;
  posterUrl: string | null;
};

function getRatingClass(rating: number) {
  if (rating >= 8) {
    return "bg-green-500 text-black";
  }

  if (rating >= 6) {
    return "bg-yellow-400 text-black";
  }

  return "bg-red-500 text-white";
}

export default function MovieCard({
  id,
  title,
  year,
  rating,
  overview,
  posterUrl,
}: MovieCardProps) {
  return (
    <Link
      href={`/movie/${id}`}
      className="group overflow-hidden rounded-xl border border-neutral-800 bg-neutral-900 transition hover:-translate-y-1 hover:border-yellow-400/60"
    >
      <div className="relative aspect-[2/3] bg-neutral-800">
        {posterUrl ? (
          <Image
            src={posterUrl}
            alt={`${title} poster`}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 20vw"
            className="object-cover transition duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center px-4 text-center text-sm text-neutral-500">
            Poster bulunamadı
          </div>
        )}
      </div>

      <div className="p-4">
        <h3 className="truncate text-lg font-semibold text-white">{title}</h3>

        <p className="mt-2 line-clamp-2 text-sm leading-6 text-neutral-500">
          {overview || "Bu film için açıklama bulunmuyor."}
        </p>

        <div className="mt-4 flex items-center justify-between text-sm text-neutral-400">
          <span>{year || "Tarih yok"}</span>

          <span
            className={`rounded-md px-2 py-1 font-semibold ${getRatingClass(
              rating
            )}`}
          >
            {rating.toFixed(1)}
          </span>
        </div>
      </div>
    </Link>
  );
}