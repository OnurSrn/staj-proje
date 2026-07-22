"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSettings } from "@/components/SettingsProvider";
import { t } from "@/lib/i18n";
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
  const { settings } = useSettings();
  const language = settings.language;
  const [limitMessage, setLimitMessage] = useState<string | null>(null);

  const profileUrl = getProfileUrl(profilePath);
  const isFavorite = isLoaded && isFavoritePerson(id, role);
  const addKey = role === "actor" ? "addActor" : "addDirector";
  const removeKey = role === "actor" ? "removeActor" : "removeDirector";
  const actionLabel = t(
    language,
    "personActions",
    isFavorite ? removeKey : addKey
  );
  const limitKey =
    role === "actor" ? "actorLimitMessage" : "directorLimitMessage";

  function handleToggle() {
    const person: FavoritePerson = { id, name, profilePath, role };
    const result = toggleFavoritePerson(person);

    setLimitMessage(
      result === "limit-reached" ? t(language, "personActions", limitKey) : null
    );
  }

  return (
    <div className="flex flex-col overflow-hidden rounded-xl border border-border bg-surface">
      <Link href={`/person/${id}`} className="group block">
        <div className="relative aspect-[2/3] overflow-hidden bg-surface-elevated">
          {profileUrl ? (
            <Image
              src={profileUrl}
              alt={name}
              fill
              sizes="(max-width: 640px) 50vw, 180px"
              className="object-cover transition duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full items-center justify-center px-4 text-center text-sm text-muted">
              {t(language, "common", "noProfileImage")}
            </div>
          )}
        </div>
      </Link>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <h3 className="truncate font-semibold text-foreground" title={name}>
          {name}
        </h3>

        {department && (
          <span className="w-fit rounded-full bg-surface-elevated px-2 py-0.5 text-xs text-muted">
            {department}
          </span>
        )}

        {knownForTitles.length > 0 && (
          <p className="line-clamp-2 text-xs text-muted">
            {t(language, "personActions", "knownForPrefix")}{" "}
            {knownForTitles.join(", ")}
          </p>
        )}

        <button
          type="button"
          onClick={handleToggle}
          disabled={!isLoaded}
          className={`mt-auto rounded-lg px-3 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${
            isFavorite
              ? "border border-accent text-accent hover:bg-accent/10"
              : "bg-accent text-accent-foreground hover:bg-accent-hover"
          }`}
        >
          {actionLabel}
        </button>

        {limitMessage && <p className="text-xs text-danger">{limitMessage}</p>}
      </div>
    </div>
  );
}
