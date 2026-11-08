import { appUrl } from "../config/site";
import { koreanDate } from "./publicPromotions";
import type { PromotionRequest } from "./promotionWorkflow";

/** A post is live while it is the store's published post and has not passed its end date (KST). */
export function isLivePromotion(item: PromotionRequest, today = koreanDate()): boolean {
  return item.status === "published" && item.ends_on >= today;
}

/** The newest live post per store. */
export function livePromotionsByStore(history: PromotionRequest[], today = koreanDate()): Map<number, PromotionRequest> {
  const live = new Map<number, PromotionRequest>();
  for (const item of [...history].sort((a, b) => b.created_at.localeCompare(a.created_at)))
    if (isLivePromotion(item, today) && !live.has(item.store_id)) live.set(item.store_id, item);
  return live;
}

/** Opens the customer page with this store's details. */
export function customerStoreUrl(storeId: number): string {
  return appUrl("customer", `/?store=${storeId}`);
}
