/** Only web images and bundled street photos are accepted, never executable/data URLs. */
export function validStorefrontImage(value: unknown): value is string {
  if (typeof value !== 'string' || value.length > 1000) return false;
  if (/^\/street\/[a-zA-Z0-9/_-]+\.(jpg|jpeg|png|webp)$/.test(value)) return true;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && !url.username && !url.password;
  } catch { return false; }
}
