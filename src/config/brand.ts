export type BrandRole = "landing" | "customer" | "owner" | "editor";

export const brandSubtitles: Record<BrandRole, string> = {
  landing: "메인", customer: "손님", owner: "상인", editor: "관리자",
};

export function pageTitle(role: BrandRole) {
  return `맛&멋 AI Street | ${brandSubtitles[role]}`;
}
