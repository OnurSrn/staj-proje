export type MediaType = "movie" | "tv";

export type MediaKey = `${MediaType}:${number}`;

const MEDIA_KEY_PATTERN = /^(movie|tv):(\d+)$/;

function isPositiveFiniteInteger(value: number): boolean {
  return Number.isInteger(value) && Number.isFinite(value) && value > 0;
}

export function createMediaKey(mediaType: MediaType, id: number): MediaKey {
  if (!isPositiveFiniteInteger(id)) {
    throw new Error(`Geçersiz medya ID'si: ${id}`);
  }

  return `${mediaType}:${id}`;
}

export function createMovieKey(id: number): MediaKey {
  return createMediaKey("movie", id);
}

export function isMediaKey(value: unknown): value is MediaKey {
  if (typeof value !== "string") {
    return false;
  }

  const match = MEDIA_KEY_PATTERN.exec(value);

  if (!match) {
    return false;
  }

  return isPositiveFiniteInteger(Number(match[2]));
}

export function parseMediaKey(
  value: unknown
): { mediaType: MediaType; id: number } | null {
  if (!isMediaKey(value)) {
    return null;
  }

  const separatorIndex = value.indexOf(":");
  const mediaType = value.slice(0, separatorIndex) as MediaType;
  const id = Number(value.slice(separatorIndex + 1));

  return { mediaType, id };
}

export function getMediaType(mediaKey: MediaKey): MediaType {
  return mediaKey.slice(0, mediaKey.indexOf(":")) as MediaType;
}

export function getMediaId(mediaKey: MediaKey): number {
  return Number(mediaKey.slice(mediaKey.indexOf(":") + 1));
}
