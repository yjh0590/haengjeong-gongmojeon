/** Authenticated owner self-publication with database-enforced per-store quotas. */
import { publicationConfigured, type AdminSession } from "./sitePublication";
import { koreanDate } from "./publicPromotions";

const apiUrl = String(import.meta.env.VITE_SUPABASE_URL || "").replace(/\/+$/, "");
const apiKey = String(import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || "");
export type PromotionStatus = "pending" | "approved" | "rejected" | "published" | "superseded" | "withdrawn";
export type PromotionQuota = { store_id: number; daily_limit: number; used: number; remaining: number; enabled: boolean; quota_date: string; resets_at: string };
export type PromotionPolicy = { daily_limit: number; enabled: boolean };
export type PromotionRequest = {
  id: string;
  user_id: string;
  store_id: number;
  title: string;
  street_copy: string;
  sns_copy: string;
  short_script: string;
  ends_on: string;
  status: PromotionStatus;
  created_at: string;
  reviewed_at: string | null;
};
export type OwnerSession = AdminSession;
const sessionKey = "itda-owner-v45-session";

function authHeaders(token?: string) {
  return { apikey: apiKey, "Content-Type": "application/json", ...(token ? {Authorization:`Bearer ${token}`} : {}) };
}
async function result<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let detail = `서버 요청 실패 (${response.status})`;
    try {
      const data = await response.json() as Record<string, unknown>;
      detail = ["PGRST202", "PGRST205", "42P01"].includes(String(data.code)) ? "점주 직접 게시의 서버 설정이 아직 준비되지 않았습니다. 관리자에게 문의해 주세요." : String(data.message || data.error_description || data.error || detail);
    } catch { /* keep fallback */ }
    throw new Error(detail);
  }
  if (response.status === 204) return undefined as T;
  const body = await response.text();
  if (!body) return undefined as T;
  return JSON.parse(body) as T;
}

export function getSavedOwnerSession(): OwnerSession | null {
  try {
    const raw = sessionStorage.getItem(sessionKey);
    if (!raw) return null;
    const data = JSON.parse(raw) as Partial<OwnerSession>;
    if (typeof data.token === "string" && typeof data.refreshToken === "string" &&
      typeof data.expiresAt === "number" && typeof data.email === "string") return data as OwnerSession;
  } catch { /* ignore broken browser session */ }
  return null;
}
export function saveOwnerSession(session: OwnerSession | null): void {
  if (session) sessionStorage.setItem(sessionKey, JSON.stringify(session));
  else sessionStorage.removeItem(sessionKey);
}

type AuthResult = {access_token: string; refresh_token: string; expires_in: number; user?: {email?: string}};
export async function signInOwner(email: string, password: string): Promise<OwnerSession> {
  if (!publicationConfigured) throw new Error("Supabase 연동 설정이 없습니다.");
  const tokens = await result<AuthResult>(await fetch(`${apiUrl}/auth/v1/token?grant_type=password`, {
    method:"POST", headers:authHeaders(), body:JSON.stringify({email,password}),
  }));
  if (!tokens.access_token || !tokens.refresh_token) throw new Error("인증 정보를 받지 못했습니다.");
  const allowed = await fetchOwnerStoreIds(tokens.access_token);
  if (!allowed.length) throw new Error("배정된 점포가 없습니다. 관리자에게 점포 권한을 요청해 주세요.");
  return {token:tokens.access_token,refreshToken:tokens.refresh_token,
    email:tokens.user?.email || email, expiresAt:Date.now()+tokens.expires_in*1000};
}
export async function refreshOwnerSession(session: OwnerSession): Promise<OwnerSession> {
  if (Date.now() < session.expiresAt - 60000) {
    await fetchOwnerStoreIds(session.token); return session;
  }
  const tokens = await result<AuthResult>(await fetch(`${apiUrl}/auth/v1/token?grant_type=refresh_token`, {
    method:"POST", headers:authHeaders(), body:JSON.stringify({refresh_token:session.refreshToken}),
  }));
  if (!tokens.access_token || !tokens.refresh_token) throw new Error("로그인 갱신에 실패했습니다.");
  const allowed = await fetchOwnerStoreIds(tokens.access_token);
  if (!allowed.length) throw new Error("더 이상 접근 가능한 점포가 없습니다.");
  return {token:tokens.access_token,refreshToken:tokens.refresh_token,
    email:tokens.user?.email || session.email,expiresAt:Date.now()+tokens.expires_in*1000};
}
export async function signOutOwner(session: OwnerSession | null) {
  saveOwnerSession(null);
  if (session) await fetch(`${apiUrl}/auth/v1/logout`,{method:"POST",headers:authHeaders(session.token)}).catch(()=>null);
}
export async function fetchOwnerStoreIds(token: string): Promise<number[]> {
  const rows = await result<Array<{store_id:number}>>(await fetch(
    `${apiUrl}/rest/v1/itda_owner_stores?select=store_id`, {headers:authHeaders(token),cache:"no-store"}));
  return rows.map(item=>item.store_id);
}
export async function publishOwnerPromotion(session: OwnerSession, data: {
  store_id:number; title:string; street_copy:string; sns_copy:string; short_script:string; ends_on:string;
}, requestKey: string): Promise<PromotionQuota & { id: string; status: PromotionStatus; duplicate: boolean }> {
  if (!publicationConfigured) throw new Error("Supabase 연결 설정이 없습니다.");
  if (!data.title.trim() || !data.street_copy.trim() || data.street_copy.length > 450) throw new Error("홍보 제목과 거리 문구를 확인해 주세요.");
  const response = await fetch(`${apiUrl}/rest/v1/rpc/itda_publish_owner_promotion`, {
    method:"POST",headers:authHeaders(session.token),
    body:JSON.stringify({target_store_id:data.store_id,promotion_title:data.title,street_text:data.street_copy,sns_text:data.sns_copy,script_text:data.short_script,end_date:data.ends_on,request_key:requestKey}),
  });
  return result(response);
}
export async function fetchPromotionRequests(token:string, pendingOnly=false): Promise<PromotionRequest[]> {
  const filters = pendingOnly ? "&status=eq.pending" : "";
  return result<PromotionRequest[]>(await fetch(
    `${apiUrl}/rest/v1/itda_promotion_requests?select=id,user_id,store_id,title,street_copy,sns_copy,short_script,ends_on,status,created_at,reviewed_at${filters}&order=created_at.desc&limit=100`,
    {headers:authHeaders(token),cache:"no-store"}));
}
/** Active posts are separate from the recent-history limit, so older live stores remain manageable. */
export async function fetchActivePromotions(token: string): Promise<PromotionRequest[]> {
  const items: PromotionRequest[] = [];
  for (let offset=0;offset<2000;offset+=500) {
    const page = await result<PromotionRequest[]>(await fetch(
      `${apiUrl}/rest/v1/itda_promotion_requests?select=id,user_id,store_id,title,street_copy,sns_copy,short_script,ends_on,status,created_at,reviewed_at&status=eq.published&ends_on=gte.${koreanDate()}&order=created_at.desc&limit=500&offset=${offset}`,
      {headers:authHeaders(token),cache:"no-store"}));
    items.push(...page);
    if (page.length<500) break;
  }
  return items;
}
export async function fetchPromotionQuota(token: string, storeId: number): Promise<PromotionQuota> {
  return result(await fetch(`${apiUrl}/rest/v1/rpc/itda_promotion_quota`, {method:"POST",headers:authHeaders(token),body:JSON.stringify({target_store_id:storeId})}));
}
export async function fetchPromotionPolicy(token: string): Promise<PromotionPolicy> {
  const rows = await result<PromotionPolicy[]>(await fetch(`${apiUrl}/rest/v1/itda_promotion_policy?id=eq.main&select=daily_limit,enabled`, {headers:authHeaders(token),cache:"no-store"}));
  if (!rows[0]) throw new Error("게시 정책을 확인할 수 없습니다.");
  return rows[0];
}
export async function updatePromotionPolicy(token: string, dailyLimit: number, enabled: boolean): Promise<PromotionPolicy> {
  return result(await fetch(`${apiUrl}/rest/v1/rpc/itda_set_promotion_policy`, {method:"POST",headers:authHeaders(token),body:JSON.stringify({new_daily_limit:dailyLimit,publishing_enabled:enabled})}));
}
export async function withdrawPromotion(token:string, id:string): Promise<void> {
  await result<unknown>(await fetch(`${apiUrl}/rest/v1/rpc/itda_withdraw_promotion`,{
    method:"POST",headers:authHeaders(token),body:JSON.stringify({target_request_id:id}),
  }));
}
export function promotionStatusLabel(status: PromotionStatus): string {
  return {published:"직접 게시",superseded:"이전 게시",withdrawn:"게시 중단",pending:"이전 승인 대기",approved:"이전 승인",rejected:"이전 반려"}[status];
}
