import { useEffect, useRef, useState, type ReactNode } from "react";
import { BookOpenText, Camera, ClipboardList, DatabaseBackup, LayoutDashboard, MapPinned, NotebookPen, Store } from "lucide-react";
import { appUrl, sameOriginPreview } from "../config/site";
import "../styles/EditorShell.css";
import SiteBrand from "./SiteBrand";

export default function EditorShell({ children, title, active = "dashboard" }: { children: ReactNode; title: string; active?: "dashboard" | "catalog" | "map" | "street" | "promotions" | "devlog" | "sources" | "backup" }) {
  const [mobile, setMobile] = useState(() => window.matchMedia("(max-width: 600px)").matches);
  const [expanded, setExpanded] = useState(() => !window.matchMedia("(max-width: 600px)").matches);
  const toggle = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const query = window.matchMedia("(max-width: 600px)");
    const resize = () => { setMobile(query.matches);setExpanded(!query.matches); };
    query.addEventListener("change",resize);
    return () => query.removeEventListener("change",resize);
  },[]);
  useEffect(() => {
    if (!mobile || !expanded) return;
    const close = (event: KeyboardEvent) => { if (event.key === "Escape") {setExpanded(false);toggle.current?.focus();} };
    document.addEventListener("keydown",close);
    return () => document.removeEventListener("keydown",close);
  },[mobile,expanded]);
  const links = [
    { label: "대시보드", href: appUrl("editor"), icon: LayoutDashboard, selected: active === "dashboard" },
    { label: "매장 관리", href: appUrl("editor","/catalog"), icon: Store, selected: active === "catalog" },
    { label: "지도 관리", href: appUrl("editor","/map-editor"), icon: MapPinned, selected: active === "map" },
    { label: "거리 사진", href: appUrl("editor","/street-editor"), icon: Camera, selected: active === "street" },
    { label: "홍보 게시 관리", href: appUrl("editor","/promotions"), icon: ClipboardList, selected: active === "promotions" },
    { label: "정보 출처", href: appUrl("editor","/sources"), icon: BookOpenText, selected: active === "sources" },
    { label: "백업·복원", href: appUrl("editor","/backup"), icon: DatabaseBackup, selected: active === "backup" },
    { label: "개발일지", href: appUrl("editor","/devlog"), icon: NotebookPen, selected: active === "devlog" },
  ];
  return <div className={`editor-shell ${expanded ? "is-expanded" : "is-collapsed"}`}>
    <header className="editor-shell-header">
      <a className="editor-brand-link" href={appUrl("editor")} aria-label="맛&멋 AI Street 관리자 홈"><SiteBrand role="editor" /></a>
      <nav aria-label="관리자 바로가기"><a href={sameOriginPreview()}>손님 미리보기</a><a href={appUrl("landing")}>메인</a></nav>
      <button ref={toggle} className="editor-shell-toggle" type="button" aria-label={expanded ? "관리 메뉴 접기" : "관리 메뉴 열기"} aria-controls="editor-sidebar" aria-expanded={expanded} onClick={() => setExpanded(value => !value)}><span /><span /><span /></button>
    </header>
    <div className="editor-shell-grid">
      {mobile && expanded && <button className="editor-shell-backdrop" type="button" aria-label="관리 메뉴 닫기" onClick={() => { setExpanded(false);toggle.current?.focus(); }} />}
      <aside className="editor-shell-sidebar" id="editor-sidebar" hidden={mobile && !expanded}>
        <nav aria-label="관리 메뉴">{links.map(({label,href,icon:Icon,selected}) => <a key={label} href={href} aria-current={selected ? "page" : undefined} title={label}><Icon aria-hidden="true" /><span>{label}</span></a>)}</nav>
        <div className="editor-shell-sidebar-bottom"><i /><span>ADMIN WORKSPACE<small>ITDA 관리자 작업 공간</small></span></div>
      </aside>
      <main className="editor-shell-main">
        <div className="editor-shell-page-heading"><div><p className="editor-shell-eyebrow">ITDA STREET CONTROL</p><h1>{title}</h1></div><span className="editor-shell-badge"><i />관리자 전용</span></div>
        {children}
        <footer className="editor-shell-footer"><span>ITDA ADMIN</span><span>점포·지도·사진은 관리자 게시 · 점주 홍보는 일일 한도 내 직접 게시</span></footer>
      </main>
    </div>
  </div>;
}
