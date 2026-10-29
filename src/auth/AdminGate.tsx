import { createContext, useCallback, useContext, useEffect, useState } from "react";
import type { FormEvent, ReactNode } from "react";
import { ArrowRight, KeyRound, LockKeyhole, LogOut, ShieldCheck, ShieldAlert } from "lucide-react";
import { appUrl } from "../config/site";
import { publicationConfigured, refreshAdminSession, signInAdmin, signOutAdmin, verifyAdminSession, type AdminSession } from "../data/sitePublication";
import "../styles/AdminGate.css";

const STORAGE_KEY = "itda-v44-admin-session";
type AdminAuthContext = {
  session: AdminSession;
  getSession: () => Promise<AdminSession>;
  logout: () => void;
};
const AdminContext = createContext<AdminAuthContext | null>(null);

function readSavedSession(): AdminSession | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const data: unknown = JSON.parse(raw);
    if (!data || typeof data !== "object") return null;
    const value = data as Record<string, unknown>;
    if (typeof value.token !== "string" || typeof value.refreshToken !== "string" ||
        typeof value.email !== "string" || typeof value.expiresAt !== "number") return null;
    return { token: value.token, refreshToken: value.refreshToken, email: value.email, expiresAt: value.expiresAt };
  } catch { return null; }
}
function saveSession(session: AdminSession | null) {
  try {
    if (session) sessionStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    else sessionStorage.removeItem(STORAGE_KEY);
  } catch { /* private browsing may disable storage */ }
}

export function useAdminAuth(): AdminAuthContext {
  const context = useContext(AdminContext);
  if (!context) throw new Error("관리자 로그인 상태가 없습니다.");
  return context;
}

/** Mounts NO editor content until Supabase verifies an admin identity. */
export default function AdminGate({children}: {children: ReactNode}) {
  const [session, setSession] = useState<AdminSession | null>(null);
  const [checking, setChecking] = useState(publicationConfigured);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const route = window.location.pathname;

  useEffect(() => {
    document.title = "ITDA · 관리자 로그인";
    if (!publicationConfigured) return;
    let active = true;
    const saved = readSavedSession();
    if (!saved) { setChecking(false); return; }
    verifyAdminSession(saved).then(next => {
      if (!active) return;
      saveSession(next);
      setSession(next);
    }).catch(() => { if (active) { saveSession(null); setMessage("로그인이 만료되었거나 관리 권한을 확인하지 못했습니다. 다시 로그인해 주세요."); } })
      .finally(() => { if (active) setChecking(false); });
    return () => { active = false; };
  }, []);

  const login = async (event: FormEvent) => {
    event.preventDefault();
    if (busy) return;
    setBusy(true); setMessage("");
    try {
      const next = await signInAdmin(email.trim(), password);
      saveSession(next); setSession(next); setPassword("");
    } catch (error) { setMessage(error instanceof Error ? error.message : "로그인에 실패했습니다."); }
    finally { setBusy(false); }
  };
  const logout = useCallback(() => {
    const current = session;
    saveSession(null); setSession(null); setPassword("");
    if (current) void signOutAdmin(current);
  }, [session]);
  const getSession = useCallback(async () => {
    const current = readSavedSession() || session;
    if (!current) throw new Error("로그인 정보가 없습니다. 다시 로그인해 주세요.");
    try {
      const next = Date.now() > current.expiresAt - 60_000
        ? await refreshAdminSession(current) : await verifyAdminSession(current);
      saveSession(next); setSession(next);
      return next;
    } catch (error) {
      saveSession(null); setSession(null);
      throw error;
    }
  }, [session]);

  if (session) return <AdminContext.Provider value={{session, getSession, logout}}>
    <div className="itda-admin-session-bar"><span><ShieldCheck size={15}/> 관리자 로그인 · <strong>{session.email}</strong></span><button type="button" onClick={logout}><LogOut size={15}/> 로그아웃</button></div>
    {children}
  </AdminContext.Provider>;

  return <main className="itda-auth-page"><section className="itda-auth-card">
    <div className="itda-auth-icon"><LockKeyhole size={27}/></div>
    <span className="itda-auth-eyebrow">ITDA · ADMIN ONLY</span>
    <h1>관리자 로그인</h1>
    <p>점포 등록, 지도·거리 사진 편집은 관리자 인증 후 이용할 수 있습니다.</p>
    <p className="itda-auth-route">접근 요청: <code>{route}</code></p>
    {!publicationConfigured ? <div className="itda-auth-warning"><ShieldAlert size={18}/> Supabase 연결 설정이 없습니다. Vercel의 환경변수를 확인해 주세요. 이 상태에서는 관리자 편집 화면을 열 수 없습니다.</div>
      : checking ? <div className="itda-auth-status">관리자 권한 확인 중…</div>
      : <form onSubmit={event => void login(event)}>
        <label htmlFor="itda-admin-email">관리자 이메일</label>
        <input id="itda-admin-email" type="email" autoComplete="username" value={email} onChange={event => setEmail(event.target.value)} required placeholder="관리자 이메일" />
        <label htmlFor="itda-admin-pass">비밀번호</label>
        <input id="itda-admin-pass" type="password" autoComplete="current-password" value={password} onChange={event => setPassword(event.target.value)} required placeholder="비밀번호" />
        <button type="submit" disabled={busy}>{busy ? "확인 중…" : <>관리자 로그인 <ArrowRight size={16}/></>}</button>
        <a className="itda-auth-recover" href="/reset-password"><KeyRound size={15}/> 비밀번호 만들기·재설정</a>
      </form>}
    {message && <div className="itda-auth-warning" role="alert">{message}</div>}
    <a className="itda-auth-home" href={appUrl("landing")}>ITDA 메인으로 돌아가기</a>
    <small>관리자 계정은 Supabase Authentication에 등록되고 itda_admins 권한을 부여받아야 합니다.</small>
  </section></main>;
}
