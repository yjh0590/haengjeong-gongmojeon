import type { StoreData } from "../types/street";

/** Store kinds people look for, grouped from the stores' actual categories (banner shortcuts). */
export type StoreGroupId = "식당" | "카페·빵" | "뷰티" | "생활·놀이";

const cafe = (store: StoreData) => /카페|베이커리|디저트|빵/.test(store.category);
const beauty = (store: StoreData) => /미용|헤어|피부|네일|에스테틱|뷰티/.test(store.category);
const daily = (store: StoreData) => store.category === "편의점";

export const storeGroups: { id: StoreGroupId; match: (store: StoreData) => boolean }[] = [
  { id: "식당", match: store => store.type === "맛" && !cafe(store) && !daily(store) },
  { id: "카페·빵", match: cafe },
  { id: "뷰티", match: store => store.type === "멋" && beauty(store) },
  { id: "생활·놀이", match: store => daily(store) || (store.type === "멋" && !beauty(store)) },
];

export const matchesGroup = (store: StoreData, group: StoreGroupId | null) =>
  !group || Boolean(storeGroups.find(item => item.id === group)?.match(store));
