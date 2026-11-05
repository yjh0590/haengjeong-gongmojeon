import type { FacadeAnnotation } from "./facadeAnnotations";
import type { StoreData, ViewDirection } from "../types/street";

/** Only show stores explicitly associated with this photo direction. */
export function storesForStreetView(
  stores: StoreData[], facades: FacadeAnnotation[], nodeId: string, view: ViewDirection,
): StoreData[] {
  const visibleIds = new Set(facades
    .filter(facade => facade.nodeId === nodeId && facade.view === view)
    .map(facade => facade.storeId));
  return stores.filter(store => visibleIds.has(store.id)).slice(0, 3);
}
