import Image from "next/image";
import Link from "next/link";

type CastCardProps = {
  personId: number;
  name: string;
  character: string;
  profileUrl: string | null;
};

export default function CastCard({
  personId,
  name,
  character,
  profileUrl,
}: CastCardProps) {
  return (
    <Link
      href={`/person/${personId}`}
      className="group block overflow-hidden rounded-xl border border-neutral-800 bg-neutral-900 transition duration-200 hover:border-yellow-400/60"
    >
      <div className="relative aspect-[2/3] overflow-hidden bg-neutral-800">
        {profileUrl ? (
          <Image
            src={profileUrl}
            alt={name}
            fill
            sizes="(max-width: 640px) 50vw, 180px"
            className="object-cover transition duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center px-4 text-center text-sm text-neutral-500">
            Oyuncu görseli bulunamadı
          </div>
        )}
      </div>

      <div className="p-4">
        <h3 className="truncate font-semibold text-white">{name}</h3>

        <p className="mt-1 line-clamp-2 text-sm text-neutral-400">
          {character || "Karakter bilgisi yok"}
        </p>
      </div>
    </Link>
  );
}
