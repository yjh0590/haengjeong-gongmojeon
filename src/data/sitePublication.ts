/**
 * Optional Supabase publication layer. Read-only public access, RLS-protected admin writes.
 * Only VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY are allowed in the frontend.
 * No service-role / secret key is ever used in browser code.
 */
import { useEffect, useState } from "react";
import { getFacadeAnnotations, type FacadeAnnotation } from "./facadeAnnotations";
import { isValidMapGeometry, readMapGeometry, type MapGeometry } from "./mapGeometry";
import { isValidStreetNodes, readStreetNodes } from "./streetNetwork";
import { readStoreDraft, validStores } from "./storeDraft";
import type { StoreData, StreetNode } from "../types/street";

export type SitePublication = {
  version: 1;
  stores: StoreData[];
  geometry: MapGeometry;
  nodes: StreetNode[];
  facades: FacadeAnnotation[];
};
export type PublishedResponse = { data: SitePublication; publishedAt: string };
export type AdminSession = { token: string; refreshToken: string; email: string; expiresAt: number };
const url = String(import.meta.env.VITE_SUPABASE_URL || "").replace(/\/+$/, "");
const key = String(import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || "");
export const publicationConfigured = /^https:\/\/[\w-]+\.supabase\.co$/.test(url) && key.startsWith("sb_publishable_");

function headers(token?: string): HeadersInit {
  return { apikey: key, ...(token ? { Authorization: `Bearer ${token}` } : {}), "Content-Type": "application/json" };
}
async function resultOrError<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let reason = `서버 요청 실패 (${response.status})`;
    try { const obj = await response.json() as {message?: string; error_description?: string; error?: string}; reason = obj.message || obj.error_description || obj.error || reason; } catch { /* keep status */ }
    throw new Error(reason);
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}
function validFacades(input: unknown, nodes: StreetNode[], stores: StoreData[]): input is FacadeAnnotation[] {
  if (!Array.isArray(input) || input.length > 5000) return false;
  const storeIds = new Set(stores.map(s => s.id));
  const nodeIds = new Set(nodes.map(n => n.id));
  return input.every((f: FacadeAnnotation) => f && nodeIds.has(f.nodeId) && storeIds.has(f.storeId) &&
    ["forward", "back", "left", "right"].includes(f.view) &&
    Array.isArray(f.points) && f.points.length >= 3 && f.points.length <= 100 &&
    f.points.every(p => p && Number.isFinite(p.x) && Number.isFinite(p.y) && p.x >= 0 && p.x <= 100 && p.y >= 0 && p.y <= 100));
}
export function validPublication(v: unknown): v is SitePublication {
  if (!v || typeof v !== "object") return false;
  const x = v as SitePublication;
  return x.version === 1 && validStores(x.stores) && isValidMapGeometry(x.geometry) &&
    isValidStreetNodes(x.nodes) && validFacades(x.facades, x.nodes, x.stores);
}
/** Assemble a validated, photo-free publication snapshot from this browser's drafts. */
export function preparePublication(): SitePublication {
  const stores = readStoreDraft();
  const ids = new Set(stores.map(s => s.id));
  const nodes = readStreetNodes().map(node => ({ ...node, stores: node.stores.filter(id => ids.has(id)) }));
  const nodeIds = new Set(nodes.map(n => n.id));
  const rawGeometry = readMapGeometry();
  const geometry: MapGeometry = {
    ...rawGeometry,
    stores: Object.fromEntries(Object.entries(rawGeometry.stores).filter(([id]) => ids.has(Number(id)))),
    nodes: Object.fromEntries(Object.entries(rawGeometry.nodes).filter(([id]) => nodeIds.has(id))),
  };
  const facades = getFacadeAnnotations().filter(f => ids.has(f.storeId) && nodeIds.has(f.nodeId));
  const prepared: SitePublication = { version: 1, stores, geometry, nodes, facades };
  if (!validPublication(prepared)) throw new Error("게시할 지도 또는 점포 데이터가 올바르지 않습니다.");
  return prepared;
}
/** A null result means no publication exists; [] stores means an intentionally empty publication. */
export async function fetchPublication(): Promise<PublishedResponse | null> {
  if (!publicationConfigured) return null;
  const response = await fetch(`${url}/rest/v1/itda_publication?id=eq.main&select=payload,published_at`, {
    headers: headers(), cache: "no-store",
  });
  const rows = await resultOrError<Array<{ payload: unknown; published_at: string }>>(response);
  if (!rows.length) return null;
  if (!validPublication(rows[0].payload)) throw new Error("서버에 저장된 게시 데이터 형식이 올바르지 않습니다.");
  return { data: rows[0].payload, publishedAt: rows[0].published_at };
}
type AuthTokens = { access_token: string; refresh_token: string; expires_in: number; user?: {id?: string; email?: string} };

/** Check server-side RLS membership on every new/renewed session. */
async function checkAdmin(token: string): Promise<void> {
  const response = await fetch(`${url}/rest/v1/itda_admins?select=user_id&limit=1`, {
    headers: headers(token), cache: "no-store",
  });
  const admins = await resultOrError<Array<{user_id: string}>>(response);
  if (admins.length !== 1) throw new Error("관리자 권한이 없는 계정입니다. Supabase의 itda_admins 등록을 확인해 주세요.");
}

export async function verifyAdminSession(session: AdminSession): Promise<AdminSession> {
  if (!publicationConfigured) throw new Error("Supabase 연결 설정이 없습니다.");
  if (Date.now() > session.expiresAt - 60_000) return refreshAdminSession(session);
  await checkAdmin(session.token);
  return session;
}

export async function refreshAdminSession(session: AdminSession): Promise<AdminSession> {
  if (!session.refreshToken) throw new Error("로그인이 만료됐습니다. 다시 로그인해 주세요.");
  const response = await fetch(`${url}/auth/v1/token?grant_type=refresh_token`, {
    method: "POST", headers: headers(), body: JSON.stringify({ refresh_token: session.refreshToken }),
  });
  const next = await resultOrError<AuthTokens>(response);
  if (!next.access_token || !next.refresh_token) throw new Error("로그인 갱신에 실패했습니다. 다시 로그인해 주세요.");
  await checkAdmin(next.access_token);
  return { token: next.access_token, refreshToken: next.refresh_token, email: next.user?.email || session.email, expiresAt: Date.now() + next.expires_in * 1000 };
}

export async function signInAdmin(email: string, password: string): Promise<AdminSession> {
  if (!publicationConfigured) throw new Error("Supabase 연결 설정이 없습니다.");
  const response = await fetch(`${url}/auth/v1/token?grant_type=password`, {
    method: "POST", headers: headers(), body: JSON.stringify({ email, password }),
  });
  const session = await resultOrError<AuthTokens>(response);
  if (!session.access_token || !session.refresh_token) throw new Error("로그인 토큰을 받지 못했습니다.");
  await checkAdmin(session.access_token);
  return { token: session.access_token, refreshToken: session.refresh_token, email, expiresAt: Date.now() + session.expires_in * 1000 };
}

export async function signOutAdmin(session: AdminSession): Promise<void> {
  if (!publicationConfigured) return;
  // Local credentials are removed even when the network call fails.
  try {
    await fetch(`${url}/auth/v1/logout`, { method: "POST", headers: headers(session.token) });
  } catch { /* local sign-out still succeeds */ }
}

export async function publishSite(data: SitePublication, session: AdminSession): Promise<string> {
  if (!publicationConfigured) throw new Error("Supabase 연결 설정이 없습니다.");
  if (!validPublication(data)) throw new Error("게시 데이터 검증에 실패했습니다.");
  if (Date.now() >= session.expiresAt - 15000) throw new Error("로그인이 만료됐어요. 다시 로그인한 후 게시해 주세요.");
  const response = await fetch(`${url}/rest/v1/itda_publication?on_conflict=id`, {
    method: "POST",
    headers: { apikey: key, Authorization: `Bearer ${session.token}`, "Content-Type": "application/json", Prefer: "resolution=merge-duplicates,return=representation" },
    body: JSON.stringify({ id: "main", payload: data, published_at: new Date().toISOString() }),
  });
  const rows = await resultOrError<Array<{published_at: string}>>(response);
  if (!rows[0]?.published_at) throw new Error("게시 결과를 확인하지 못했습니다.");
  return rows[0].published_at;
}

export type SiteStatus = "demo" | "loading" | "published" | "offline" | "preview";
export function usePublicSite() {
  const preview = typeof window !== "undefined" && window.location.pathname.startsWith("/preview/");
  const [data, setData] = useState<SitePublication | null>(null);
  const [status, setStatus] = useState<SiteStatus>(preview ? "preview" : publicationConfigured ? "loading" : "demo");
  const [publishedAt, setPublishedAt] = useState<string | null>(null);
  useEffect(() => {
    if (preview || !publicationConfigured) return;
    let mounted = true;
    fetchPublication().then(value => {
      if (!mounted) return;
      setData(value?.data || null);setPublishedAt(value?.publishedAt || null);
      setStatus(value ? "published" : "demo");
    }).catch(() => { if (mounted) setStatus("offline"); });
    return () => { mounted = false; };
  }, [preview]);
  return { data, status, publishedAt };
}
