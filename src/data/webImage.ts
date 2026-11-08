import webImages from "./webImages.json";

const lighter = new Set<string>(webImages);

/**
 * Display copy of a street photo: phones download the WebP made by scripts/build-web-images.mjs
 * (longest side 1600px) instead of multi-MB originals. Data and admin editors keep the original path.
 */
export function webImage<T extends string | undefined>(src: T): T {
  return (src && lighter.has(src) ? src.replace(/\.(jpe?g|png)$/i, ".web.webp") : src) as T;
}
