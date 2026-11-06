import type { FacadeAnnotation } from "./facadeAnnotations";
import type { StoreData, ViewDirection } from "../types/street";

/** Side buttons are relative to the photographed heading, not a new photo or a walk. */
export function streetSideView(heading: ViewDirection, side: "left" | "right"): ViewDirection {
  const compass: ViewDirection[] = ["forward", "right", "back", "left"];
  return compass[(compass.indexOf(heading) + (side === "left" ? 3 : 1)) % 4];
}

/** Explicit card order first, then legacy outlines ordered from left to right. No truncation. */
export function storesForStreetView(
  stores: StoreData[], facades: FacadeAnnotation[], nodeId: string, view: ViewDirection,
  linkedStoreIds: number[] = [],
): StoreData[] {
  const outlines = facades
    .filter(facade => facade.nodeId === nodeId && facade.view === view)
    .sort((a, b) => center(a) - center(b));
  const visibleIds = [...new Set([...linkedStoreIds, ...outlines.map(facade => facade.storeId)])];
  const byId = new Map(stores.map(store => [store.id, store]));
  return visibleIds.flatMap(id => byId.has(id) ? [byId.get(id)!] : []);
}

function center(facade: FacadeAnnotation) {
  return facade.points.length ? facade.points.reduce((sum, point) => sum + point.x, 0) / facade.points.length : 50;
}

export function streetStorePage(stores: StoreData[], requestedPage: number) {
  const pageCount = Math.ceil(stores.length / 3);
  const page = Math.max(0, Math.min(Number.isFinite(requestedPage) ? Math.floor(requestedPage) : 0, Math.max(0, pageCount - 1)));
  return { page, pageCount, stores: stores.slice(page * 3, page * 3 + 3) };
}
