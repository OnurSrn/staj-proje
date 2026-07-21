"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { getProfileUrl } from "@/lib/tmdb";
import {
  useFavoritePeople,
  type FavoritePerson,
  type FavoritePersonRole,
} from "@/components/PreferenceProvider";

type PersonPreferenceCardProps = {
  id: number;
  name: string;
  profilePath: string | null;
  department: string | null;
  knownForTitles: string[];
  role: FavoritePersonRole;
};

const ROLE_LABEL: Record<FavoritePersonRole, string> = {
  actor: "Favori Oyuncu",
  director: "Favori Yönetmen",
};

const LIMIT_MESSAGE: Record<FavoritePersonRole, string> = {
  actor: "En fazla 50 favori oyuncu ekleyebilirsin.",
  director: "En fazla 30 favori yönetmen ekleyebilirsin.",
};

export default function PersonPreferenceCard({
  id,
  name,
  profilePath,
  department,
  knownForTitles,
  role,
}: PersonPreferenceCardProps) {
  const { isFavoritePerson, toggleFavoritePerson, isLoaded } =
    useFavoritePeople();
  const [limitMessage, setLimitMessage] = useState<string | null>(null);

  const profileUrl = getProfileUrl(profilePath);
  const isFavorite = isLoaded && isFavoritePerson(id, role);

  function handleToggle() {
    const person: FavoritePerson = { id, name, profilePath, role };
    const result = toggleFavoritePerson(person);

    setLimitMessage(result === "limit-reached" ? LIMIT_MESSAGE[role] : null);
  }

  return (
    <div className="flex flex-col overflow-hidden rounded-xl border border-neutral-800 bg-neutral-900">
      <Link href={`/person/${id}`} className="group block">
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
              Görsel bulunamadı
            </div>
          )}
        </div>
      </Link>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <h3 className="truncate font-semibold text-white" title={name}>
          {name}
        </h3>

        {department && (
          <span className="w-fit rounded-full bg-neutral-800 px-2 py-0.5 text-xs text-neutral-400">
            {department}
          </span>
        )}

        {knownForTitles.length > 0 && (
          <p className="line-clamp-2 text-xs text-neutral-500">
            Bilinen: {knownForTitles.join(", ")}
          </p>
        )}

        <button
          type="button"
          onClick={handleToggle}
          disabled={!isLoaded}
          className={`mt-auto rounded-lg px-3 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${
            isFavorite
              ? "border border-yellow-400 text-yellow-400 hover:bg-yellow-400/10"
              : "bg-yellow-400 text-black hover:bg-yellow-300"
          }`}
        >
          {isFavorite
            ? `${ROLE_LABEL[role]} · Çıkar`
            : `${ROLE_LABEL[role]} Ekle`}
        </button>

        {limitMessage && <p className="text-xs text-red-400">{limitMessage}</p>}
      </div>
    </div>
  );
}
