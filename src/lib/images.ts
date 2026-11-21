// TMDB image sizes: https://developer.themoviedb.org/docs/image-basics
const IMAGE_BASE = "https://image.tmdb.org/t/p";

export function imageUrl(path: string | null | undefined, size: string): string | undefined {
  return path ? `${IMAGE_BASE}/${size}${path}` : undefined;
}

function srcSet(path: string | null | undefined, sizes: Array<[string, number]>) {
  if (!path) return undefined;
  return sizes.map(([size, width]) => `${IMAGE_BASE}/${size}${path} ${width}w`).join(", ");
}

export const posterSrcSet = (path: string | null | undefined) =>
  srcSet(path, [
    ["w154", 154],
    ["w185", 185],
    ["w342", 342],
    ["w500", 500],
    ["w780", 780],
  ]);

export const backdropSrcSet = (path: string | null | undefined) =>
  srcSet(path, [
    ["w300", 300],
    ["w780", 780],
    ["w1280", 1280],
    ["original", 1920],
  ]);

export const profileSrcSet = (path: string | null | undefined) =>
  srcSet(path, [
    ["w185", 185],
    ["h632", 421],
  ]);
