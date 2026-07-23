"use client";

import { useEffect, useRef, useState } from "react";
import { useSettings } from "@/components/SettingsProvider";
import { t } from "@/lib/i18n";
import {
  getRegionByCode,
  getRegionName,
  SUPPORTED_REGIONS,
  type AppLanguage,
  type AppTheme,
} from "@/lib/settings";

const LANGUAGES: AppLanguage[] = ["tr", "en"];
const THEMES: AppTheme[] = ["system", "dark", "light"];

const SAVED_STATUS_DURATION_MS = 2000;

// Reset sonrası dil de varsayılana (tr) döndüğü için durum mesajı hep tr
// gösterilir — kullanıcı resetten önce hangi dilde olursa olsun, resetin
// sonucu (dilin de tr'ye döndüğü) tr metinle tutarlıdır.
const DEFAULT_LANGUAGE_FOR_RESET: AppLanguage = "tr";

const OPTION_BUTTON_BASE =
  "rounded-full border px-4 py-2 text-sm font-semibold transition-all duration-200 motion-reduce:transition-none disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";

function optionButtonClassName(isActive: boolean): string {
  return isActive
    ? `${OPTION_BUTTON_BASE} border-accent bg-accent text-accent-foreground shadow-[0_0_14px_-4px_var(--accent)]`
    : `${OPTION_BUTTON_BASE} border-border text-foreground hover:border-accent-secondary/60 hover:text-accent`;
}

function DashboardSkeleton() {
  return (
    <div className="mt-10 space-y-8">
      {Array.from({ length: 3 }).map((_, index) => (
        <div key={index} className="space-y-3">
          <div className="h-4 w-24 animate-pulse rounded bg-surface-elevated" />
          <div className="h-10 w-full max-w-sm animate-pulse rounded-lg bg-surface-elevated" />
        </div>
      ))}
    </div>
  );
}

export default function SettingsDashboard() {
  const { settings, isLoaded, setLanguage, setTheme, setRegion, resetSettings } =
    useSettings();
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const statusTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (statusTimeoutRef.current) {
        clearTimeout(statusTimeoutRef.current);
      }
    };
  }, []);

  function announceStatus(message: string) {
    setStatusMessage(message);

    if (statusTimeoutRef.current) {
      clearTimeout(statusTimeoutRef.current);
    }

    statusTimeoutRef.current = setTimeout(() => {
      setStatusMessage(null);
    }, SAVED_STATUS_DURATION_MS);
  }

  if (!isLoaded) {
    return <DashboardSkeleton />;
  }

  const language = settings.language;

  function handleLanguageChange(nextLanguage: AppLanguage) {
    setLanguage(nextLanguage);
    announceStatus(t(nextLanguage, "settings", "savedStatus"));
  }

  function handleThemeChange(nextTheme: AppTheme) {
    setTheme(nextTheme);
    announceStatus(t(language, "settings", "savedStatus"));
  }

  function handleRegionChange(nextRegion: string) {
    setRegion(nextRegion);
    announceStatus(t(language, "settings", "savedStatus"));
  }

  function handleReset() {
    resetSettings();
    announceStatus(t(DEFAULT_LANGUAGE_FOR_RESET, "settings", "resetStatus"));
  }

  const currentRegion = getRegionByCode(settings.region);

  return (
    <div className="mt-10 max-w-2xl space-y-10">
      <section
        aria-label={t(language, "settings", "summaryHeading")}
        className="grid grid-cols-1 gap-3 rounded-xl border border-accent/15 bg-gradient-to-br from-accent-soft/50 to-surface-subtle p-4 sm:grid-cols-3"
      >
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-muted">
            {t(language, "settings", "languageSection")}
          </p>
          <p className="mt-1 text-sm font-semibold text-foreground">
            {t(language, "language", language)}
          </p>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-muted">
            {t(language, "settings", "themeSection")}
          </p>
          <p className="mt-1 text-sm font-semibold text-foreground">
            {t(language, "theme", settings.theme)}
          </p>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-muted">
            {t(language, "settings", "regionSection")}
          </p>
          <p className="mt-1 text-sm font-semibold text-foreground">
            {currentRegion
              ? `${getRegionName(currentRegion, language)} (${currentRegion.isoCode})`
              : settings.region}
          </p>
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold">
          {t(language, "settings", "languageSection")}
        </h2>

        <div className="mt-3 flex flex-wrap gap-3" role="group">
          {LANGUAGES.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => handleLanguageChange(option)}
              aria-pressed={language === option}
              className={optionButtonClassName(language === option)}
            >
              {t(language, "language", option)}
            </button>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold">
          {t(language, "settings", "themeSection")}
        </h2>

        <div className="mt-3 flex flex-wrap gap-3" role="group">
          {THEMES.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => handleThemeChange(option)}
              aria-pressed={settings.theme === option}
              className={optionButtonClassName(settings.theme === option)}
            >
              {t(language, "theme", option)}
            </button>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold">
          {t(language, "settings", "regionSection")}
        </h2>

        <div className="mt-3 max-w-sm">
          <label className="sr-only" htmlFor="region-select">
            {t(language, "settings", "regionSection")}
          </label>

          <select
            id="region-select"
            value={settings.region}
            onChange={(event) => handleRegionChange(event.target.value)}
            className="w-full rounded-lg border border-border bg-input px-4 py-2.5 text-sm text-foreground transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            {SUPPORTED_REGIONS.map((region) => (
              <option key={region.isoCode} value={region.isoCode}>
                {getRegionName(region, language)} ({region.isoCode})
              </option>
            ))}
          </select>
        </div>
      </section>

      <section className="rounded-xl border border-border bg-surface p-4">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-muted">
          {t(language, "settings", "localDataTitle")}
        </h2>

        <p className="mt-2 text-sm text-muted">
          {t(language, "settings", "localDataNote")}
        </p>
      </section>

      <section className="flex flex-wrap items-center gap-4">
        <button
          type="button"
          onClick={handleReset}
          className="rounded-lg border border-border px-4 py-2 text-sm font-semibold text-foreground transition hover:border-accent hover:text-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          {t(language, "settings", "resetButton")}
        </button>

        <p
          role="status"
          aria-live="polite"
          className="min-h-5 text-sm text-accent"
        >
          {statusMessage ?? ""}
        </p>
      </section>
    </div>
  );
}
