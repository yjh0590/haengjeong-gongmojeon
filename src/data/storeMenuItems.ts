import type { StoreData } from "../types/street";

export function storeMenuItems(store: StoreData) {
  return store.menuItems?.length ? store.menuItems : [{ name: store.menu, price: store.price }];
}

export function validMenuItems(value: unknown): boolean {
  return value === undefined || (Array.isArray(value) && value.length <= 50 && value.every(item =>
    item && typeof item === "object" && typeof item.name === "string" && typeof item.price === "string" &&
    item.name.length <= 150 && item.price.length <= 150));
}
