"use client";

import { useState } from "react";
import { useSettings } from "@/components/SettingsProvider";
import { t } from "@/lib/i18n";
import {
  useFavoriteCompanies,
  type FavoriteCompany,
} from "@/components/PreferenceProvider";

type CompanyPreferenceButtonProps = {
  id: number;
  name: string;
  logoPath: string | null;
  originCountry: string | null;
};

export default function CompanyPreferenceButton({
  id,
  name,
  logoPath,
  originCountry,
}: CompanyPreferenceButtonProps) {
  const { isFavoriteCompany, toggleFavoriteCompany, isLoaded } =
    useFavoriteCompanies();
  const { settings } = useSettings();
  const language = settings.language;
  const [limitMessage, setLimitMessage] = useState<string | null>(null);

  const isFavorite = isLoaded && isFavoriteCompany(id);
  const actionLabel = t(
    language,
    "personActions",
    isFavorite ? "removeStudio" : "addStudio"
  );

  function handleToggle() {
    const company: FavoriteCompany = {
      id,
      name,
      logoPath,
      originCountry,
    };
    const result = toggleFavoriteCompany(company);

    setLimitMessage(
      result === "limit-reached"
        ? t(language, "personActions", "studioLimitMessage")
        : null
    );
  }

  return (
    <span className="inline-flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={handleToggle}
        disabled={!isLoaded}
        aria-pressed={isFavorite}
        aria-label={actionLabel}
        title={actionLabel}
        className={`inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-sm transition disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
          isFavorite
            ? "border-accent text-accent hover:bg-accent/10"
            : "border-border text-muted hover:border-accent hover:text-accent"
        }`}
      >
        <span aria-hidden="true">{isFavorite ? "♥" : "♡"}</span>
      </button>

      {limitMessage && (
        <p className="text-xs text-danger">{limitMessage}</p>
      )}
    </span>
  );
}
