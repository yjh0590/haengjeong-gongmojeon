/**
 * Store outlines on a street photo, in 0-100 percentages relative to the image.
 * This is optional metadata, never estimated from a fictional store location.
 * The editor persists draft annotations in localStorage in the current browser.
 */
export type Point = { x: number; y: number };
export type FacadeAnnotation = { nodeId: string; view: "forward" | "back" | "left" | "right"; storeId: number; points: Point[] };
export const FACADE_KEY = "matmeot-facades-v1";
export const builtInFacades: FacadeAnnotation[] = [];
export function getFacadeAnnotations(): FacadeAnnotation[] {
  try {
    const raw = JSON.parse(localStorage.getItem(FACADE_KEY) || "null");
    if (!Array.isArray(raw)) return builtInFacades;
    return raw.filter((item): item is FacadeAnnotation =>
      typeof item === "object" && !!item && typeof item.nodeId === "string" &&
      typeof item.storeId === "number" && ["forward", "back", "left", "right"].includes(item.view) &&
      Array.isArray(item.points) && item.points.length >= 3 && item.points.every((p: Point) =>
        typeof p.x === "number" && typeof p.y === "number" && p.x >= 0 && p.x <= 100 && p.y >= 0 && p.y <= 100));
  } catch { return builtInFacades; }
}
