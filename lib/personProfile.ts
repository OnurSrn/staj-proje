import type {
  PersonDetails,
  PersonExternalIds,
  PersonMovieCredit,
  PersonMovieCrewCredit,
} from "@/lib/tmdb";

export type PersonExternalLinkPlatform =
  | "instagram"
  | "x"
  | "facebook"
  | "imdb";

export type PersonExternalLink = {
  platform: PersonExternalLinkPlatform;
  label: string;
  url: string;
};

const PLATFORM_LABELS: Record<PersonExternalLinkPlatform, string> = {
  instagram: "Instagram",
  x: "X",
  facebook: "Facebook",
  imdb: "IMDb",
};

// TMDB external_ids alanları bir handle/id döndürür, URL değil — yine de
// javascript: gibi değerlerin veya slash/query içeren beklenmedik
// içeriklerin URL'ye sızmaması için yalnızca güvenli karakter setine izin
// verilir. Platform host'ları burada sabittir, kullanıcıdan gelen ham bir
// URL asla kullanılmaz.
const SAFE_ID_PATTERN = /^[A-Za-z0-9._-]+$/;

function sanitizeId(rawId: string | null | undefined): string | null {
  if (!rawId) {
    return null;
  }

  const trimmed = rawId.trim();

  if (trimmed.length === 0 || !SAFE_ID_PATTERN.test(trimmed)) {
    return null;
  }

  return trimmed;
}

/**
 * Saf fonksiyon: aynı externalIds girdisi her zaman aynı, deterministik
 * sıradaki (instagram, x, facebook, imdb) link listesini üretir. Eksik
 * veya güvensiz alanlar sessizce atlanır.
 */
export function buildPersonExternalLinks(
  externalIds: PersonExternalIds | null | undefined
): PersonExternalLink[] {
  if (!externalIds) {
    return [];
  }

  const links: PersonExternalLink[] = [];

  const instagramId = sanitizeId(externalIds.instagram_id);

  if (instagramId) {
    links.push({
      platform: "instagram",
      label: PLATFORM_LABELS.instagram,
      url: `https://www.instagram.com/${instagramId}`,
    });
  }

  const twitterId = sanitizeId(externalIds.twitter_id);

  if (twitterId) {
    links.push({
      platform: "x",
      label: PLATFORM_LABELS.x,
      url: `https://x.com/${twitterId}`,
    });
  }

  const facebookId = sanitizeId(externalIds.facebook_id);

  if (facebookId) {
    links.push({
      platform: "facebook",
      label: PLATFORM_LABELS.facebook,
      url: `https://www.facebook.com/${facebookId}`,
    });
  }

  const imdbId = sanitizeId(externalIds.imdb_id);

  if (imdbId) {
    links.push({
      platform: "imdb",
      label: PLATFORM_LABELS.imdb,
      url: `https://www.imdb.com/name/${imdbId}`,
    });
  }

  return links;
}

export type PersonRoleFlags = {
  canFavoriteAsActor: boolean;
  canFavoriteAsDirector: boolean;
};

/**
 * Rol tespiti mevcut person details + movie_credits verisinden yapılır,
 * ek bir TMDB isteği gerektirmez. Ne oyunculuk ne yönetmenlik sinyali
 * bulunan (belirsiz) kişiler için iki bayrak da false döner.
 */
export function detectPersonRoles(
  person: Pick<PersonDetails, "known_for_department">,
  cast: PersonMovieCredit[],
  crew: PersonMovieCrewCredit[]
): PersonRoleFlags {
  const isActingDepartment = person.known_for_department === "Acting";
  const isDirectingDepartment = person.known_for_department === "Directing";

  const hasCastWork = cast.length > 0;
  const hasDirectorCrewWork = crew.some(
    (credit) => credit.job === "Director"
  );

  return {
    canFavoriteAsActor: isActingDepartment || hasCastWork,
    canFavoriteAsDirector: isDirectingDepartment || hasDirectorCrewWork,
  };
}
