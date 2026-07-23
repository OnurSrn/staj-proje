import type { MovieCrewMember, ProductionCompany } from "@/lib/tmdb";

// "director" bayrağı, ekip bölümünün TR/EN başlığından bağımsız olarak
// hangi bölümün özel (favori butonlu) render edileceğini belirler —
// önceki sürümde bu karşılaştırma sabit "Yönetmen" metnine bakıyordu, bu
// da dil değişince özel render'ı sessizce kırardı.
export type CrewSection = {
  labelKey: "directorLabel" | "writerLabel" | "cinematographerLabel" | "musicLabel";
  isDirectorSection: boolean;
  people: MovieCrewMember[];
};

export function getKeyCrewSections(crew: MovieCrewMember[]): CrewSection[] {
  const usedIds = new Set<number>();

  function pickCrew(jobs: string[]): MovieCrewMember[] {
    const seenIds = new Set<number>();
    const matches: MovieCrewMember[] = [];

    for (const member of crew) {
      if (!jobs.includes(member.job)) {
        continue;
      }

      if (usedIds.has(member.id) || seenIds.has(member.id)) {
        continue;
      }

      seenIds.add(member.id);
      matches.push(member);
    }

    matches.forEach((member) => usedIds.add(member.id));

    return matches;
  }

  const sections: CrewSection[] = [
    {
      labelKey: "directorLabel",
      isDirectorSection: true,
      people: pickCrew(["Director"]),
    },
    {
      labelKey: "writerLabel",
      isDirectorSection: false,
      people: pickCrew(["Writer", "Screenplay"]),
    },
    {
      labelKey: "cinematographerLabel",
      isDirectorSection: false,
      people: pickCrew(["Director of Photography"]),
    },
    {
      labelKey: "musicLabel",
      isDirectorSection: false,
      people: pickCrew(["Original Music Composer"]),
    },
  ];

  return sections.filter((section) => section.people.length > 0);
}

// Aynı stüdyo birden fazla kayıtla gelebilir; geçersiz/eksik id'li kayıtlar
// favori aksiyonu gösteremeyeceği için baştan elenir.
export function getUniqueCompanies(
  companies: ProductionCompany[]
): ProductionCompany[] {
  const seenIds = new Set<number>();
  const uniqueCompanies: ProductionCompany[] = [];

  for (const company of companies) {
    if (!Number.isInteger(company.id) || company.id <= 0) {
      continue;
    }

    if (seenIds.has(company.id)) {
      continue;
    }

    seenIds.add(company.id);
    uniqueCompanies.push(company);
  }

  return uniqueCompanies;
}
