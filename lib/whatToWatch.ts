import type {
  Company,
  Discovery,
  Intensity,
  Mood,
  RuntimePreference,
} from "@/lib/tmdb";

type SelectOption<T extends string> = {
  value: T;
  label: string;
};

export const MOOD_OPTIONS: SelectOption<Mood>[] = [
  { value: "fun", label: "Eğlenceli" },
  { value: "exciting", label: "Heyecanlı" },
  { value: "emotional", label: "Duygusal" },
  { value: "dark", label: "Karanlık" },
  { value: "cozy", label: "Rahat" },
  { value: "thoughtful", label: "Düşündürücü" },
];

export const RUNTIME_OPTIONS: SelectOption<RuntimePreference>[] = [
  { value: "short", label: "90 dakikadan kısa" },
  { value: "medium", label: "90-120 dakika" },
  { value: "long", label: "120 dakikadan uzun" },
  { value: "any", label: "Fark etmez" },
];

export const INTENSITY_OPTIONS: SelectOption<Intensity>[] = [
  { value: "light", label: "Hafif" },
  { value: "balanced", label: "Dengeli" },
  { value: "intense", label: "Yoğun" },
];

export const COMPANY_OPTIONS: SelectOption<Company>[] = [
  { value: "alone", label: "Tek başıma" },
  { value: "friends", label: "Arkadaşlarla" },
  { value: "family", label: "Aileyle" },
  { value: "partner", label: "Partnerle" },
];

export const DISCOVERY_OPTIONS: SelectOption<Discovery>[] = [
  { value: "safe", label: "Güvenli seçim" },
  { value: "balanced", label: "Dengeli" },
  { value: "different", label: "Farklı bir şey" },
];

function findLabel<T extends string>(
  options: SelectOption<T>[],
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

export function buildWhatToWatchDescription(
  input: WhatToWatchDescriptionInput
): string {
  const moodLabel = findLabel(MOOD_OPTIONS, input.mood);
  const runtimeLabel = findLabel(RUNTIME_OPTIONS, input.runtime);
  const companyLabel = findLabel(COMPANY_OPTIONS, input.company);

  const parts = [moodLabel];

  if (input.runtime !== "any") {
    parts.push(runtimeLabel);
  }

  const genreSuffix = input.genreName ? `, ${input.genreName} türünde` : "";

  return `${parts.join(", ")} ve ${companyLabel.toLowerCase()} izlemeye uygun${genreSuffix} filmler seçtik.`;
}
