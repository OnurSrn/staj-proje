"use client";

import Link from "next/link";
import { useSettings } from "@/components/SettingsProvider";
import { useTasteProfile } from "@/components/hooks/useTasteProfile";
import { buildRuntimePreferenceLabel, t } from "@/lib/i18n";
import type { TasteProfile, WeightedPreference } from "@/lib/tasteProfile";
import type { AppLanguage } from "@/lib/settings";

function getConfidenceLabel(
  language: AppLanguage,
  confidence: TasteProfile["confidence"]
): string {
  return t(language, "confidence", confidence);
}

function getConfidenceDescription(
  language: AppLanguage,
  confidence: TasteProfile["confidence"]
): string {
  const key =
    confidence === "low"
      ? "confidenceLow"
      : confidence === "medium"
        ? "confidenceMedium"
        : "confidenceHigh";

  return t(language, "tasteProfile", key);
}

function Chip({ label }: { label: string }) {
  return (
    <span className="rounded-full bg-surface-elevated px-3 py-1 text-sm text-foreground">
      {label}
    </span>
  );
}

function ChipRow({
  preferences,
  language,
}: {
  preferences: WeightedPreference[];
  language: AppLanguage;
}) {
  const positivePreferences = preferences.filter((p) => p.score > 0);

  if (positivePreferences.length === 0) {
    return (
      <p className="text-sm text-muted">
        {t(language, "tasteProfile", "noTrendText")}
      </p>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      {positivePreferences.slice(0, 5).map((preference) => (
        <Chip key={preference.id} label={preference.label} />
      ))}
    </div>
  );
}

function SectionSkeleton() {
  return (
    <div className="mt-8 space-y-4 rounded-xl border border-border bg-surface p-5">
      <div className="h-4 w-40 animate-pulse rounded bg-surface-elevated" />
      <div className="h-4 w-full animate-pulse rounded bg-surface-elevated" />
      <div className="h-4 w-2/3 animate-pulse rounded bg-surface-elevated" />
    </div>
  );
}

export default function TasteProfileSection() {
  const { profile, isLoading, hasError } = useTasteProfile();
  const { settings } = useSettings();
  const language = settings.language;

  if (isLoading) {
    return <SectionSkeleton />;
  }

  if (hasError || !profile) {
    return null;
  }

  const hasAnyData =
    profile.totalRatedMovies > 0 || profile.totalStatusMovies > 0;

  const explicitActorCount = profile.explicitFavoriteActorIds.length;
  const explicitDirectorCount = profile.explicitFavoriteDirectorIds.length;
  const explicitCompanyCount = profile.explicitFavoriteCompanyIds.length;

  return (
    <section className="mt-8 rounded-xl border border-border bg-surface p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">
          {t(language, "tasteProfile", "heading")}
        </h2>

        <span className="rounded-full border border-accent/40 px-3 py-1 text-xs font-semibold text-accent">
          {getConfidenceLabel(language, profile.confidence)}
        </span>
      </div>

      <p className="mt-2 text-sm text-muted">
        {t(language, "tasteProfile", "descriptionPrefix")}{" "}
        {getConfidenceDescription(language, profile.confidence)}
      </p>

      {!hasAnyData ? (
        <p className="mt-6 text-sm text-muted">
          {t(language, "tasteProfile", "noDataText")}
        </p>
      ) : (
        <div className="mt-6 space-y-5">
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-widest text-muted">
              {t(language, "tasteProfile", "favoriteGenresHeading")}
            </h3>

            <div className="mt-2">
              <ChipRow preferences={profile.genrePreferences} language={language} />
            </div>
          </div>

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-widest text-muted">
              {t(language, "tasteProfile", "movieDnaHeading")}
            </h3>

            <div className="mt-2">
              <ChipRow preferences={profile.dnaPreferences} language={language} />
            </div>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-widest text-muted">
                {t(language, "tasteProfile", "preferredRuntimeHeading")}
              </h3>

              <p className="mt-2 text-sm text-foreground">
                {buildRuntimePreferenceLabel(language, profile.runtimePreference)}
              </p>
            </div>

            <div>
              <h3 className="text-xs font-semibold uppercase tracking-widest text-muted">
                {t(language, "tasteProfile", "erasHeading")}
              </h3>

              <div className="mt-2">
                {profile.eraPreferences.filter((p) => p.score > 0).length ===
                0 ? (
                  <p className="text-sm text-muted">
                    {t(language, "tasteProfile", "noTrendText")}
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {profile.eraPreferences
                      .filter((p) => p.score > 0)
                      .slice(0, 3)
                      .map((era) => (
                        <Chip key={era.id} label={era.label} />
                      ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-widest text-muted">
              {t(language, "tasteProfile", "languagesHeading")}
            </h3>

            <div className="mt-2">
              {profile.languagePreferences.filter((p) => p.score > 0)
                .length === 0 ? (
                <p className="text-sm text-muted">
                  {t(language, "tasteProfile", "noTrendText")}
                </p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {profile.languagePreferences
                    .filter((p) => p.score > 0)
                    .slice(0, 3)
                    .map((languagePreference) => (
                      <Chip
                        key={languagePreference.id}
                        label={languagePreference.label}
                      />
                    ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-x-8 gap-y-2 border-t border-border pt-4 text-sm text-muted">
            <span>
              <span className="font-semibold text-foreground">
                {explicitActorCount}
              </span>{" "}
              {t(language, "profile", "favoriteActorsSuffix")}
            </span>

            <span>
              <span className="font-semibold text-foreground">
                {explicitDirectorCount}
              </span>{" "}
              {t(language, "profile", "favoriteDirectorsSuffix")}
            </span>

            <span>
              <span className="font-semibold text-foreground">
                {explicitCompanyCount}
              </span>{" "}
              {t(language, "profile", "favoriteStudiosSuffix")}
            </span>
          </div>
        </div>
      )}

      <p className="mt-6 text-xs text-muted">
        {t(language, "tasteProfile", "footerNote")}
      </p>

      <Link
        href="/preferences"
        className="mt-4 inline-block text-sm font-semibold text-accent transition hover:text-accent-hover"
      >
        {t(language, "profile", "editPreferencesCta")}
      </Link>
    </section>
  );
}
