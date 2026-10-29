import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { ArrowLeft, KeyRound, MailCheck, ShieldCheck } from "lucide-react";
import { appUrl } from "../config/site";
import { publicationConfigured } from "../data/sitePublication";
import "../styles/PasswordSetup.css";

const supabaseUrl = String(import.meta.env.VITE_SUPABASE_URL || "").replace(/\/+$/, "");
const publishableKey = String(import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || "");

/** Supabase's Dashboard invite/recovery links normally return session tokens in the URL fragment. */
function readCallback() {
  const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
  const query = new URLSearchParams(window.location.search);
  const type = hash.get("type") || query.get("type") || "";
  return {
    token: hash.get("access_token") || "",
    type,
    error: hash.get("error_description") || query.get("error_description") || "",
    hasCode: query.has("code"),
  };
}

type Mode = "request" | "choose" | "finished";

export default function PasswordSetup() {
  const [callback] = useState(readCallback);
  const hasRecoverySession = Boolean(callback.token) && (callback.type === "recovery" || callback.type === "invite");
  const [mode, setMode] = useState<Mode>(hasRecoverySession ? "choose" : "request");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState(callback.error ? decodeURIComponent(callback.error.replace(/\+/g, " ")) :
    callback.hasCode ? "이 이메일은 다른 인증 방식을 사용합니다. 아래에서 재설정 메일을 새로 요청해 주세요." : "");

  useEffect(() => {
    document.title = "ITDA · 관리자 비밀번호 설정";
    // Remove tokens from address bar and browser history as soon as the app takes over.
    if (window.location.hash || window.location.search) window.history.replaceState(null, "", window.location.pathname);
  }, []);

  const requestLink = async (event: FormEvent) => {
    event.preventDefault();
    if (!publicationConfigured) { setMessage("Supabase 환경변수가 연결되지 않았습니다."); return; }
    setBusy(true); setMessage("");
    try {
      const redirectTo = `${window.location.origin}/reset-password`;
      const res = await fetch(`${supabaseUrl}/auth/v1/recover?redirect_to=${encodeURIComponent(redirectTo)}`, {
        method: "POST", headers: { apikey: publishableKey, "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({})) as {msg?: string; message?: string; error_description?: string};
        throw new Error(err.error_description || err.msg || err.message || `메일 요청 실패 (${res.status})`);
      }
      setMessage("비밀번호 재설정 메일을 요청했어요. 받은 편지함과 스팸함을 확인해 주세요. 계정이 없더라도 보안을 위해 같은 안내가 표시될 수 있습니다.");
    } catch (err) { setMessage(err instanceof Error ? err.message : "이메일 요청 중 오류가 발생했어요."); }
    finally { setBusy(false); }
  };

  const updatePassword = async (event: FormEvent) => {
    event.preventDefault();
    if (!hasRecoverySession) { setMessage("유효한 인증 링크가 없습니다. 비밀번호 재설정 메일을 새로 요청해 주세요."); return; }
    if (password.length < 12) { setMessage("비밀번호는 12자 이상으로 설정해 주세요."); return; }
    if (password !== confirm) { setMessage("두 비밀번호가 서로 다릅니다."); return; }
    setBusy(true); setMessage("");
    try {
      const res = await fetch(`${supabaseUrl}/auth/v1/user`, {
        method: "PUT",
        headers: { apikey: publishableKey, Authorization: `Bearer ${callback.token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({})) as {msg?: string; message?: string; error_description?: string};
        throw new Error(err.error_description || err.msg || err.message || `비밀번호 변경 실패 (${res.status})`);
      }
      setPassword(""); setConfirm(""); setMode("finished");
      setMessage("비밀번호가 설정됐어요. 이제 관리자 페이지에서 이메일과 방금 설정한 비밀번호로 로그인하세요.");
    } catch (err) { setMessage(err instanceof Error ? err.message : "비밀번호 변경 중 오류가 발생했어요. 메일을 다시 요청해 주세요."); }
    finally { setBusy(false); }
  };

  return <main className="itda-password-page">
    <section className="itda-password-card">
      <a className="itda-password-back" href={appUrl("editor", "/catalog")}><ArrowLeft size={17}/> 관리자 점포 관리로 돌아가기</a>
      <span className="itda-password-eyebrow">ITDA · ADMIN ACCESS</span>
      <div className="itda-password-icon">{mode === "finished" ? <ShieldCheck size={28}/> : mode === "choose" ? <KeyRound size={28}/> : <MailCheck size={28}/>}</div>
      <h1>{mode === "finished" ? "비밀번호 설정 완료" : mode === "choose" ? "새 비밀번호 설정" : "관리자 비밀번호 만들기·재설정"}</h1>
      <p className="itda-password-sub">{mode === "finished"
        ? "ITDA 관리자 계정으로 로그인할 수 있어요. 게시 권한은 별도로 등록돼 있어야 합니다."
        : mode === "choose" ? "이메일에서 인증된 계정의 새 비밀번호를 설정합니다." : "초대받은 계정에도 사용할 수 있어요. 재설정 메일을 받은 뒤 링크를 열어 주세요."}</p>
      {!publicationConfigured && <p className="itda-password-note" role="alert">Supabase 설정이 없어 이메일 인증을 사용할 수 없습니다. Vercel 환경변수를 확인해 주세요.</p>}
      {mode === "request" && <form onSubmit={event => void requestLink(event)}>
        <label htmlFor="itda-email">Supabase Authentication에 등록한 이메일</label>
        <input id="itda-email" type="email" autoComplete="email" placeholder="admin@example.com" value={email} onChange={event => setEmail(event.target.value)} required />
        <button type="submit" disabled={busy || !publicationConfigured}>{busy ? "요청 중…" : "비밀번호 설정 메일 보내기"}</button>
        <p className="itda-password-tip">Supabase → Authentication → URL Configuration에 <code>{window.location.origin}/reset-password</code>를 Redirect URLs로 허용해야 해요.</p>
      </form>}
      {mode === "choose" && <form onSubmit={event => void updatePassword(event)}>
        <label htmlFor="itda-new-password">새 비밀번호 (12자 이상)</label>
        <input id="itda-new-password" type="password" autoComplete="new-password" minLength={12} value={password} onChange={event => setPassword(event.target.value)} required />
        <label htmlFor="itda-new-password-confirm">새 비밀번호 확인</label>
        <input id="itda-new-password-confirm" type="password" autoComplete="new-password" minLength={12} value={confirm} onChange={event => setConfirm(event.target.value)} required />
        <button type="submit" disabled={busy || !publicationConfigured}>{busy ? "설정 중…" : "새 비밀번호 저장"}</button>
      </form>}
      {mode === "finished" && <a className="itda-password-action" href={appUrl("editor", "/catalog")}>관리자 페이지에서 로그인하기</a>}
      {message && <p className="itda-password-message" role="status">{message}</p>}
      <p className="itda-password-disclaimer">이 화면은 ITDA 계정의 비밀번호만 변경하며 Supabase 데이터베이스 비밀번호에는 영향을 주지 않습니다. 인증 링크와 비밀번호는 다른 사람에게 공유하지 마세요.</p>
    </section>
  </main>;
}
