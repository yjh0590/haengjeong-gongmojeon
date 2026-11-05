import type { StoreData } from "../types/street";

export type LivePromotion = { store_id: number; street_copy: string; ends_on: string; active: boolean };
export function koreanDate(date = new Date()): string {
  return new Intl.DateTimeFormat("sv-SE", { timeZone: "Asia/Seoul", year: "numeric", month: "2-digit", day: "2-digit" }).format(date);
}
export function applyPromotionOverrides(stores: StoreData[], promotions: LivePromotion[], today = koreanDate()): StoreData[] {
  const overrides = new Map(promotions.map(item => [item.store_id, item]));
  return stores.map(store => {
    const override = overrides.get(store.id);
    if (!override) return store;
    const updated = { ...store };
    delete updated.event;
    delete updated.eventUntil;
    if (override.active && override.ends_on >= today) {
      updated.event = override.street_copy;
      updated.eventUntil = override.ends_on;
    }
    return updated;
  });
}
export async function fetchLivePromotions(url: string, key: string): Promise<LivePromotion[]> {
  const response = await fetch(`${url}/rest/v1/itda_live_promotions?select=store_id,street_copy,ends_on,active`, {
    headers: { apikey: key }, cache: "no-store",
  });
  const data: unknown = await response.json();
  // Old installations remain readable until the new migration is installed.
  if (response.status === 404 && data && typeof data === "object" && "code" in data && ["PGRST205", "42P01"].includes(String(data.code))) return [];
  if (!response.ok) throw new Error("점주 홍보 게시 정보를 불러오지 못했습니다.");
  if (!Array.isArray(data) || !data.every(item => item && Number.isInteger(item.store_id) && typeof item.street_copy === "string" && /^\d{4}-\d{2}-\d{2}$/.test(item.ends_on) && typeof item.active === "boolean")) throw new Error("점주 홍보 게시 정보 형식이 올바르지 않습니다.");
  return data as LivePromotion[];
}
