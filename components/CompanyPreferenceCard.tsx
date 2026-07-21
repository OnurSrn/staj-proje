"use client";

import { useState } from "react";
import Image from "next/image";
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

const LIMIT_MESSAGE = "En fazla 30 favori stüdyo ekleyebilirsin.";

export default function CompanyPreferenceCard({
  id,
  name,
  logoPath,
  originCountry,
}: CompanyPreferenceCardProps) {
  const { isFavoriteCompany, toggleFavoriteCompany, isLoaded } =
    useFavoriteCompanies();
  const [limitMessage, setLimitMessage] = useState<string | null>(null);

  const logoUrl = getCompanyLogoUrl(logoPath);
  const isFavorite = isLoaded && isFavoriteCompany(id);

  function handleToggle() {
    const company: FavoriteCompany = {
      id,
      name,
      logoPath,
      originCountry: originCountry?.trim() || null,
    };
    const result = toggleFavoriteCompany(company);

    setLimitMessage(result === "limit-reached" ? LIMIT_MESSAGE : null);
  }

  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border border-neutral-800 bg-neutral-900 p-5 text-center">
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
          <span className="text-xs text-neutral-500">Logo yok</span>
        )}
      </div>

      <div className="min-w-0 w-full">
        <h3 className="truncate font-semibold text-white" title={name}>
          {name}
        </h3>

        {originCountry && (
          <p className="mt-1 text-xs text-neutral-500">{originCountry}</p>
        )}
      </div>

      <button
        type="button"
        onClick={handleToggle}
        disabled={!isLoaded}
        className={`w-full rounded-lg px-3 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${
          isFavorite
            ? "border border-yellow-400 text-yellow-400 hover:bg-yellow-400/10"
            : "bg-yellow-400 text-black hover:bg-yellow-300"
        }`}
      >
        {isFavorite ? "Favori Stüdyo · Çıkar" : "Favori Stüdyo Ekle"}
      </button>

      {limitMessage && <p className="text-xs text-red-400">{limitMessage}</p>}
    </div>
  );
}
