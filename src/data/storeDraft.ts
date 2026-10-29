/** Browser-only staging data. Never presented as the public server database. */
import { useEffect, useState } from "react";
import { stores as examples } from "./stores";
import type { StoreData } from "../types/street";

export const STORE_DRAFT_KEY = "itda-store-draft-v4";
export const STORE_DRAFT_EVENT = "itda-store-draft-changed";

export function validStores(input: unknown): input is StoreData[] {
  if (!Array.isArray(input) || input.length > 2000) return false;
  const ids = new Set<number>();
  for (const entry of input) {
    if (!entry || typeof entry !== "object") return false;
    const s = entry as StoreData;
    if (!Number.isSafeInteger(s.id) || s.id < 1 || ids.has(s.id) ||
      ![1, 2, 3].includes(s.floor) || !["맛", "멋"].includes(s.type) ||
      ![s.name, s.building, s.category, s.description, s.menu, s.price, s.walking].every(v => typeof v === "string" && v.length <= 2000) ||
      !s.name.trim() || !s.building.trim() ||
      (s.unit !== undefined && (typeof s.unit !== "string" || s.unit.length > 150)) ||
      (s.event !== undefined && (typeof s.event !== "string" || s.event.length > 2000)) ||
      (s.eventUntil !== undefined && (typeof s.eventUntil !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(s.eventUntil))) ||
      !Array.isArray(s.tags) || s.tags.length > 30 || !s.tags.every(t => typeof t === "string" && t.length <= 100) ||
      !Number.isFinite(s.aiScore) || s.aiScore < 0 || s.aiScore > 100) return false;
    ids.add(s.id);
  }
  return true;
}
export function readStoreDraft(): StoreData[] {
  try {
    const raw = localStorage.getItem(STORE_DRAFT_KEY);
    if (raw !== null) {
      const candidate: unknown = JSON.parse(raw);
      if (validStores(candidate)) return candidate;
    }
  } catch { /* invalid browser storage uses seed list */ }
  return examples;
}
export function saveStoreDraft(input: StoreData[]): void {
  if (!validStores(input)) throw new Error("가게 정보의 이름·층·유형·중복 ID를 확인해 주세요.");
  localStorage.setItem(STORE_DRAFT_KEY, JSON.stringify(input));
  window.dispatchEvent(new Event(STORE_DRAFT_EVENT));
}
export function useStoreDraft(): StoreData[] {
  const [data, setData] = useState(readStoreDraft);
  useEffect(() => {
    const refresh = () => setData(readStoreDraft());
    window.addEventListener(STORE_DRAFT_EVENT, refresh);
    window.addEventListener("focus", refresh);
    return () => { window.removeEventListener(STORE_DRAFT_EVENT, refresh); window.removeEventListener("focus", refresh); };
  }, []);
  return data;
}
