"use client";

import { useState } from "react";
import Image from "next/image";
import { useSettings } from "@/components/SettingsProvider";
import { t } from "@/lib/i18n";
import { getCompanyLogoUrl } from "@/lib/tmdb";
import {
  useFavoriteCompanies,
  type FavoriteCompany,
} from "@/components/PreferenceProvider";

type CompanyPreferenceCardProps = {
  id: number;
  name: string;
  logoPath: string | null;
  originCountry: string | null;
};

export default function CompanyPreferenceCard({
  id,
  name,
  logoPath,
  originCountry,
}: CompanyPreferenceCardProps) {
  const { isFavoriteCompany, toggleFavoriteCompany, isLoaded } =
    useFavoriteCompanies();
  const { settings } = useSettings();
  const language = settings.language;
  const [limitMessage, setLimitMessage] = useState<string | null>(null);

  const logoUrl = getCompanyLogoUrl(logoPath);
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
      originCountry: originCountry?.trim() || null,
    };
    const result = toggleFavoriteCompany(company);

    setLimitMessage(
      result === "limit-reached"
        ? t(language, "personActions", "studioLimitMessage")
        : null
    );
  }

  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border border-border bg-surface p-5 text-center">
      <div className="flex h-20 w-full items-center justify-center overflow-hidden rounded-lg bg-white/5">
        {logoUrl ? (
          <Image
            src={logoUrl}
            alt={name}
            width={140}
            height={60}
            className="max-h-16 w-auto object-contain"
          />
        ) : (
          <span className="text-xs text-muted">
            {t(language, "personActions", "noLogo")}
          </span>
        )}
      </div>

      <div className="min-w-0 w-full">
        <h3 className="truncate font-semibold text-foreground" title={name}>
          {name}
        </h3>

        {originCountry && (
          <p className="mt-1 text-xs text-muted">{originCountry}</p>
        )}
      </div>

      <button
        type="button"
        onClick={handleToggle}
        disabled={!isLoaded}
        className={`w-full rounded-lg px-3 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${
          isFavorite
            ? "border border-accent text-accent hover:bg-accent/10"
            : "bg-accent text-accent-foreground hover:bg-accent-hover"
        }`}
      >
        {actionLabel}
      </button>

      {limitMessage && <p className="text-xs text-danger">{limitMessage}</p>}
    </div>
  );
}
