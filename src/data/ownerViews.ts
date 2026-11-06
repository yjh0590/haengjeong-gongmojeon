export const ownerViews = ["home", "stores", "marketing", "account", "guide"] as const;
export type OwnerView = typeof ownerViews[number];
