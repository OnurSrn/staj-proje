"use client";

import { useState } from "react";
import { useSettings } from "@/components/SettingsProvider";
import { t } from "@/lib/i18n";
import {
  useFavoritePeople,
  type FavoritePerson,
  type FavoritePersonRole,
} from "@/components/PreferenceProvider";

type PersonPreferenceButtonProps = {
  id: number;
  name: string;
  profilePath: string | null;
  role: FavoritePersonRole;
  // "icon": film detayındaki yönetmen satırı gibi kompakt yerler için kalp
  // ikonu. "label": kişi detay sayfası gibi tam metinli birincil aksiyon.
  variant?: "icon" | "label";
};

export default function PersonPreferenceButton({
  id,
  name,
  profilePath,
  role,
  variant = "icon",
}: PersonPreferenceButtonProps) {
  const { isFavoritePerson, toggleFavoritePerson, isLoaded } =
    useFavoritePeople();
  const { settings } = useSettings();
  const language = settings.language;
  const [limitMessage, setLimitMessage] = useState<string | null>(null);

  const isFavorite = isLoaded && isFavoritePerson(id, role);
  const addKey = role === "actor" ? "addActor" : "addDirector";
  const removeKey = role === "actor" ? "removeActor" : "removeDirector";
  const limitKey =
    role === "actor" ? "actorLimitMessage" : "directorLimitMessage";
  const actionLabel = t(
    language,
    "personActions",
    isFavorite ? removeKey : addKey
  );

  function handleToggle() {
    const person: FavoritePerson = { id, name, profilePath, role };
    const result = toggleFavoritePerson(person);

    setLimitMessage(
      result === "limit-reached" ? t(language, "personActions", limitKey) : null
    );
  }

  const buttonClassName =
    variant === "label"
      ? `rounded-lg px-3 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
          isFavorite
            ? "border border-accent text-accent hover:bg-accent/10"
            : "bg-accent text-accent-foreground hover:bg-accent-hover"
        }`
      : `inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-sm transition disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
          isFavorite
            ? "border-accent text-accent hover:bg-accent/10"
            : "border-border text-muted hover:border-accent hover:text-accent"
        }`;

  return (
    <span className="inline-flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={handleToggle}
        disabled={!isLoaded}
        aria-pressed={isFavorite}
        aria-label={actionLabel}
        title={actionLabel}
        className={buttonClassName}
      >
        {variant === "label" ? (
          actionLabel
        ) : (
          <span aria-hidden="true">{isFavorite ? "♥" : "♡"}</span>
        )}
      </button>

      {limitMessage && (
        <p className="text-xs text-danger">{limitMessage}</p>
      )}
    </span>
  );
}
