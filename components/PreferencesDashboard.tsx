"use client";

import Image from "next/image";
import { useSettings } from "@/components/SettingsProvider";
import { buildFavoriteCountHeading, buildRemoveFromFavoritesAriaLabel, t } from "@/lib/i18n";
import { getCompanyLogoUrl, getProfileUrl } from "@/lib/tmdb";
import {
  useFavoriteCompanies,
  useFavoritePeople,
  type FavoriteCompany,
  type FavoritePerson,
} from "@/components/PreferenceProvider";
import type { AppLanguage } from "@/lib/settings";

function FavoritePersonChip({
  person,
  language,
  onRemove,
}: {
  person: FavoritePerson;
  language: AppLanguage;
  onRemove: () => void;
}) {
  const profileUrl = getProfileUrl(person.profilePath);

  return (
    <div className="flex items-center gap-2 rounded-full border border-border bg-surface py-1 pl-1 pr-3">
      <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-full bg-surface-elevated">
        {profileUrl && (
          <Image src={profileUrl} alt={person.name} fill sizes="32px" className="object-cover" />
        )}
      </div>

      <span
        className="max-w-[140px] truncate text-sm text-foreground"
        title={person.name}
      >
        {person.name}
      </span>

      <button
        type="button"
        onClick={onRemove}
        aria-label={buildRemoveFromFavoritesAriaLabel(language, person.name)}
        className="shrink-0 text-muted transition hover:text-danger"
      >
        ✕
      </button>
    </div>
  );
}

function FavoriteCompanyChip({
  company,
  language,
  onRemove,
}: {
  company: FavoriteCompany;
  language: AppLanguage;
  onRemove: () => void;
}) {
  const logoUrl = getCompanyLogoUrl(company.logoPath);

  return (
    <div className="flex items-center gap-2 rounded-full border border-border bg-surface py-1 pl-1 pr-3">
      <div className="relative flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white/10">
        {logoUrl && (
          <Image
            src={logoUrl}
            alt={company.name}
            fill
            sizes="32px"
            className="object-contain p-1"
          />
        )}
      </div>

      <span
        className="max-w-[140px] truncate text-sm text-foreground"
        title={company.name}
      >
        {company.name}
      </span>

      <button
        type="button"
        onClick={onRemove}
        aria-label={buildRemoveFromFavoritesAriaLabel(language, company.name)}
        className="shrink-0 text-muted transition hover:text-danger"
      >
        ✕
      </button>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="mt-10 grid gap-4 sm:grid-cols-3">
      {Array.from({ length: 3 }).map((_, index) => (
        <div
          key={index}
          className="h-24 animate-pulse rounded-xl border border-border bg-surface"
        />
      ))}
    </div>
  );
}

export default function PreferencesDashboard() {
  const {
    favoritePeople,
    isLoaded: peopleLoaded,
    removeFavoritePerson,
  } = useFavoritePeople();
  const {
    favoriteCompanies,
    isLoaded: companiesLoaded,
    removeFavoriteCompany,
  } = useFavoriteCompanies();
  const { settings } = useSettings();
  const language = settings.language;

  if (!peopleLoaded || !companiesLoaded) {
    return <DashboardSkeleton />;
  }

  const favoriteActors = favoritePeople.filter(
    (person) => person.role === "actor"
  );
  const favoriteDirectors = favoritePeople.filter(
    (person) => person.role === "director"
  );

  return (
    <div className="mt-10 space-y-10">
      <section>
        <h3 className="text-lg font-semibold">
          {buildFavoriteCountHeading(language, "actors", favoriteActors.length, 50)}
        </h3>

        {favoriteActors.length === 0 ? (
          <p className="mt-4 text-sm text-muted">
            {t(language, "preferences", "noFavoriteActors")}
          </p>
        ) : (
          <div className="mt-4 flex flex-wrap gap-3">
            {favoriteActors.map((person) => (
              <FavoritePersonChip
                key={`actor-${person.id}`}
                person={person}
                language={language}
                onRemove={() => removeFavoritePerson(person.id, person.role)}
              />
            ))}
          </div>
        )}
      </section>

      <section>
        <h3 className="text-lg font-semibold">
          {buildFavoriteCountHeading(language, "directors", favoriteDirectors.length, 30)}
        </h3>

        {favoriteDirectors.length === 0 ? (
          <p className="mt-4 text-sm text-muted">
            {t(language, "preferences", "noFavoriteDirectors")}
          </p>
        ) : (
          <div className="mt-4 flex flex-wrap gap-3">
            {favoriteDirectors.map((person) => (
              <FavoritePersonChip
                key={`director-${person.id}`}
                person={person}
                language={language}
                onRemove={() => removeFavoritePerson(person.id, person.role)}
              />
            ))}
          </div>
        )}
      </section>

      <section>
        <h3 className="text-lg font-semibold">
          {buildFavoriteCountHeading(language, "studios", favoriteCompanies.length, 30)}
        </h3>

        {favoriteCompanies.length === 0 ? (
          <p className="mt-4 text-sm text-muted">
            {t(language, "preferences", "noFavoriteStudios")}
          </p>
        ) : (
          <div className="mt-4 flex flex-wrap gap-3">
            {favoriteCompanies.map((company) => (
              <FavoriteCompanyChip
                key={company.id}
                company={company}
                language={language}
                onRemove={() => removeFavoriteCompany(company.id)}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
