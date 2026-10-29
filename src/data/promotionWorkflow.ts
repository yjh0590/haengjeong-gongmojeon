/** Owner -> admin -> customer workflow. Auth + RLS protect every server operation. */
import { publicationConfigured, type AdminSession } from "./sitePublication";

const apiUrl = String(import.meta.env.VITE_SUPABASE_URL || "").replace(/\/+$/, "");
const apiKey = String(import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || "");
export type PromotionStatus = "pending" | "approved" | "rejected";
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
      detail = String(data.message || data.error_description || data.error || detail);
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
export async function submitOwnerPromotion(session: OwnerSession, data: {
  store_id:number; title:string; street_copy:string; sns_copy:string; short_script:string; ends_on:string;
}): Promise<void> {
  if (!publicationConfigured) throw new Error("Supabase 연결 설정이 없습니다.");
  if (!data.title.trim() || !data.street_copy.trim() || data.street_copy.length > 450) throw new Error("홍보 제목과 거리 문구를 확인해 주세요.");
  const response = await fetch(`${apiUrl}/rest/v1/itda_promotion_requests`, {
    method:"POST",headers:{...authHeaders(session.token),Prefer:"return=minimal"},
    body:JSON.stringify({...data, status:"pending"}),
  });
  await result<void>(response);
}
export async function fetchPromotionRequests(token:string, pendingOnly=false): Promise<PromotionRequest[]> {
  const filters = pendingOnly ? "&status=eq.pending" : "";
  return result<PromotionRequest[]>(await fetch(
    `${apiUrl}/rest/v1/itda_promotion_requests?select=id,user_id,store_id,title,street_copy,sns_copy,short_script,ends_on,status,created_at,reviewed_at${filters}&order=created_at.desc&limit=100`,
    {headers:authHeaders(token),cache:"no-store"}));
}
export async function reviewPromotion(token:string, id:string, approve:boolean): Promise<void> {
  await result<unknown>(await fetch(`${apiUrl}/rest/v1/rpc/itda_review_promotion`,{
    method:"POST",headers:authHeaders(token),body:JSON.stringify({request_id:id,approve}),
  }));
}
