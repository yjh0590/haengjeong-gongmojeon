export type BrandRole = "landing" | "customer" | "owner" | "editor";

export const brandSubtitles: Record<BrandRole, string> = {
  landing: "인천의 맛과 멋을 잇다", customer: "손님 · 동네의 발견",
  owner: "점주 · 우리 가게의 다음", editor: "관리자 · 상권 관리",
};

export function pageTitle(role: BrandRole, detail?: string) {
  return `맛&멋 AI Street | ${detail || brandSubtitles[role]}`;
}
