import type { Company, Mood, RuntimePreference } from "@/lib/tmdb";
import {
  getCompanyOptions,
  getMoodOptions,
  getRuntimeOptions,
} from "@/lib/i18n";
import type { AppLanguage } from "@/lib/settings";

function findLabel<T extends string>(
  options: { value: T; label: string }[],
  value: T
): string {
  return options.find((option) => option.value === value)?.label ?? "";
}

export type WhatToWatchDescriptionInput = {
  mood: Mood;
  runtime: RuntimePreference;
  company: Company;
  genreName: string | null;
};

// Dil desteği: seçim etiketleri lib/i18n.ts'teki çeviri kaynağından gelir
// (WhatToWatchForm de aynı getMoodOptions/getRuntimeOptions/... helper'larını
// kullanır — etiketler tek yerde tanımlanır, kopyalanmaz). Cümle yapısı
// TR/EN için ayrı kuruluyor çünkü kelime sırası ve edatlar dile göre
// değişiyor; sade bir string birleştirmeyle doğal bir cümle üretmek
// mümkün değil.
export function buildWhatToWatchDescription(
  language: AppLanguage,
  input: WhatToWatchDescriptionInput
): string {
  const moodLabel = findLabel(getMoodOptions(language), input.mood);
  const runtimeLabel = findLabel(getRuntimeOptions(language), input.runtime);
  const companyLabel = findLabel(getCompanyOptions(language), input.company);

  if (language === "tr") {
    const parts = [moodLabel];

    if (input.runtime !== "any") {
      parts.push(runtimeLabel);
    }

    const genreSuffix = input.genreName ? `, ${input.genreName} türünde` : "";

    return `${parts.join(", ")} ve ${companyLabel.toLowerCase()} izlemeye uygun${genreSuffix} filmler seçtik.`;
  }

  const runtimeSuffix = input.runtime !== "any" ? `, ${runtimeLabel.toLowerCase()}` : "";
  const genreInfix = input.genreName ? `${input.genreName} ` : "";

  return `We picked ${genreInfix}${moodLabel.toLowerCase()}${runtimeSuffix} movies, perfect for watching ${companyLabel.toLowerCase()}.`;
}
