/** Domain-aware navigation without splitting the React app into separate deployments. */
export type Surface = "landing" | "customer" | "owner" | "editor";
export const BASE_DOMAIN = "itda.link";
const DOMAINS: Record<Surface, string> = {
  landing: BASE_DOMAIN,
  customer: `customer.${BASE_DOMAIN}`,
  owner: `owner.${BASE_DOMAIN}`,
  editor: `editor.${BASE_DOMAIN}`,
};

export function isItDaDomain(hostname = window.location.hostname): boolean {
  return hostname === BASE_DOMAIN || hostname === `www.${BASE_DOMAIN}` ||
    Object.values(DOMAINS).includes(hostname);
}
export function currentSurface(hostname = window.location.hostname): Surface | "legacy" {
  if (hostname === BASE_DOMAIN || hostname === `www.${BASE_DOMAIN}`) return "landing";
  if (hostname === DOMAINS.customer) return "customer";
  if (hostname === DOMAINS.owner) return "owner";
  if (hostname === DOMAINS.editor) return "editor";
  return "legacy";
}

/** On localhost/vercel.app, keep backwards-compatible same-origin routes. */
export function appUrl(surface: Surface, pathname = ""): string {
  if (isItDaDomain()) {
    const normalizedPath = pathname ? (pathname.startsWith("/") ? pathname : `/${pathname}`) : "/";
    return `https://${DOMAINS[surface]}${normalizedPath}`;
  }
  const defaults: Record<Surface, string> = {
    landing: "/welcome", customer: "/", owner: "/owner", editor: "/editor",
  };
  if (pathname) return pathname.startsWith("/") ? pathname : `/${pathname}`;
  return defaults[surface];
}

/** A preview always stays on the current origin, so draft data remains readable. */
export function sameOriginPreview(): string {
  return "/preview/customer";
}
