const BASE = 'https://image.tmdb.org/t/p';

export type PosterSize = 'w92' | 'w154' | 'w185' | 'w342' | 'w500';
export type BackdropSize = 'w300' | 'w780' | 'w1280' | 'original';

export function getPosterUrl(
  posterPath: string | null | undefined,
  size: PosterSize = 'w185'
): string | null {
  if (!posterPath) return null;
  return `${BASE}/${size}${posterPath}`;
}

export function getBackdropUrl(
  backdropPath: string | null | undefined,
  size: BackdropSize = 'w780'
): string | null {
  if (!backdropPath) return null;
  return `${BASE}/${size}${backdropPath}`;
}
