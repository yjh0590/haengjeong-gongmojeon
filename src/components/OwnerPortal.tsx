import { useEffect, useRef, useState } from "react";
import { ArrowRight, ArrowUpRight, BadgeCheck, ClipboardCheck, Image, Share2, Store, WandSparkles } from "lucide-react";
import { appUrl } from "../config/site";
import type { StoreData } from "../types/street";
import "../styles/OwnerPortal.css";

export const ownerViews = ["home", "stores", "marketing", "account", "guide"] as const;
export type OwnerView = typeof ownerViews[number];
type NavigationProps = { view: OwnerView; onNavigate: (view: OwnerView) => void };
const navigation: { view: OwnerView; label: string }[] = [
  { view: "home", label: "대시보드" }, { view: "stores", label: "매장 정보" },
  { view: "marketing", label: "홍보하기" }, { view: "account", label: "제출 내역" },
  { view: "guide", label: "이용 안내" },
];

export function OwnerPortalHeader({ view, onNavigate }: NavigationProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const header = useRef<HTMLElement>(null);
  const toggle = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!menuOpen) return;
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") { setMenuOpen(false); toggle.current?.focus(); }
    }
    function closeOutside(event: PointerEvent) {
      if (event.target instanceof Node && !header.current?.contains(event.target)) setMenuOpen(false);
    }
    document.addEventListener("keydown", closeOnEscape);
    document.addEventListener("pointerdown", closeOutside);
    return () => {
      document.removeEventListener("keydown", closeOnEscape);
      document.removeEventListener("pointerdown", closeOutside);
    };
  }, [menuOpen]);
  function navigate(next: OwnerView) { setMenuOpen(false); onNavigate(next); }
  return <header className="owner-portal-header" ref={header}>
    <div className="owner-portal-header-inner">
      <button className="owner-portal-logo" type="button" onClick={() => navigate("home")} aria-label="ITDA 파트너 대시보드">
        <strong>ITDA<i aria-hidden="true" /></strong><small>맛&멋 AI Street · 파트너</small>
      </button>
      <nav className="owner-portal-nav" aria-label="점주 주 메뉴">
        {navigation.map(item => <button key={item.view} type="button" aria-current={view === item.view ? "page" : undefined} onClick={() => navigate(item.view)}>{item.label}</button>)}
      </nav>
      <button className="owner-portal-menu-toggle" type="button" ref={toggle} aria-label={menuOpen ? "전체 메뉴 닫기" : "전체 메뉴 열기"} aria-expanded={menuOpen} aria-controls="owner-portal-menu" onClick={() => setMenuOpen(open => !open)}><span /><span /><span /></button>
    </div>
    <nav className="owner-portal-menu" id="owner-portal-menu" hidden={!menuOpen} aria-label="점주 전체 메뉴">
      {navigation.map(item => <button key={item.view} type="button" aria-current={view === item.view ? "page" : undefined} onClick={() => navigate(item.view)}>{item.label}</button>)}
    </nav>
  </header>;
}

export function OwnerPortalHome({ onNavigate, onOpenTool }: Pick<NavigationProps, "onNavigate"> & { onOpenTool: (tool: "sns" | "template") => void }) {
  return <div className="owner-portal-home">
    <section className="owner-portal-hero" aria-labelledby="owner-portal-hero-title">
      <img className="owner-portal-hero-image" src="/owner-portal/owner-hero.png" alt="" width="1672" height="941" fetchPriority="high" />
      <div className="owner-portal-shade" aria-hidden="true" />
      <div className="owner-portal-hero-copy"><span className="owner-portal-event-label">EVENT</span><h1 id="owner-portal-hero-title">우리 가게를<br />더 많은 사람에게!</h1><p>특별한 이벤트로 고객을 만나보세요.</p><button className="owner-portal-hero-button" type="button" onClick={() => onNavigate("marketing")}>지금 홍보하기 <ArrowRight size={28} aria-hidden="true" /></button></div>
    </section>
    <section className="owner-portal-quick-actions" aria-label="빠른 관리">
      <button className="owner-portal-quick-card" type="button" onClick={() => onNavigate("marketing")}><span className="owner-portal-quick-icon"><BadgeCheck aria-hidden="true" /></span><span><strong>이벤트 만들기</strong><small>우리 가게를 알리는 첫걸음</small></span><ArrowUpRight aria-hidden="true" /></button>
      <button className="owner-portal-quick-card" type="button" onClick={() => onOpenTool("sns")}><span className="owner-portal-quick-icon"><ClipboardCheck aria-hidden="true" /></span><span><strong>홍보 문구 확인</strong><small>고객에게 전할 한마디</small></span><ArrowUpRight aria-hidden="true" /></button>
      <button className="owner-portal-quick-card" type="button" onClick={() => onNavigate("stores")}><span className="owner-portal-quick-icon"><Store aria-hidden="true" /></span><span><strong>매장 정보 확인</strong><small>우리 가게의 정보를 한눈에</small></span><ArrowUpRight aria-hidden="true" /></button>
    </section>
    <section className="owner-portal-tools" aria-labelledby="owner-portal-tools-title">
      <div className="owner-portal-section-heading"><h2 id="owner-portal-tools-title">홍보 도구</h2><span>가게의 매력을 더 쉽게 전하세요</span></div>
      <div className="owner-portal-tool-grid">
        <a className="owner-portal-tool" href="/owner-portal/owner-hero.png" download="ITDA-owner-banner.png"><Image aria-hidden="true" /><span>배너 이미지</span></a>
        <button className="owner-portal-tool" type="button" onClick={() => onOpenTool("sns")}><Share2 aria-hidden="true" /><span>SNS 문구</span></button>
        <button className="owner-portal-tool" type="button" onClick={() => onOpenTool("template")}><WandSparkles aria-hidden="true" /><span>이벤트 템플릿</span></button>
        <button className="owner-portal-tool" type="button" onClick={() => onNavigate("account")}><ClipboardCheck aria-hidden="true" /><span>제출 내역</span></button>
      </div>
      <p className="owner-portal-demo-note">홍보 문구 생성은 예시 기반 시연입니다. 실제 제출·공개는 점주 로그인과 관리자 승인을 거쳐 진행됩니다.</p>
    </section>
  </div>;
}

export function OwnerPortalStores({ stores, published, signedIn, onPromote, onNavigate }: { stores: StoreData[]; published: boolean; signedIn: boolean; onPromote: (id: number) => void } & Pick<NavigationProps, "onNavigate">) {
  return <section className="owner-portal-stores" aria-labelledby="owner-portal-stores-title">
    <p className="owner-portal-eyebrow">OUR LOCAL STORES</p><h1 id="owner-portal-stores-title">우리 가게의 정보를 한눈에.</h1>
    <p className="owner-portal-description">{signedIn ? "점주 계정에 배정된 가게입니다." : published ? "관리자가 게시한 가게 목록입니다. 로그인하면 담당 점포를 확인할 수 있습니다." : "현재 시연용 점포가 표시됩니다."} 점포 등록·수정은 관리자가 진행합니다.</p>
    <div className="owner-portal-store-grid">{stores.map(store => <article key={store.id}><span className="owner-portal-eyebrow">{store.type} · {store.category}</span><h2>{store.name}</h2><p>{store.description}</p><dl><div><dt>위치</dt><dd>{store.building} {store.floor}층 {store.unit}</dd></div><div><dt>대표 메뉴·서비스</dt><dd>{store.menu}</dd></div><div><dt>가격</dt><dd>{store.price}</dd></div></dl><button type="button" onClick={() => onPromote(store.id)}>이 가게 홍보하기 <ArrowRight size={17} aria-hidden="true" /></button></article>)}</div>
    {!stores.length && <p className="owner-portal-empty">배정된 점포가 없습니다. 관리자에게 점포 연결을 요청해 주세요.</p>}
    <button className="owner-portal-inline-button" type="button" onClick={() => onNavigate("account")}>점주 계정 확인하기 <ArrowRight size={16} aria-hidden="true" /></button>
  </section>;
}

export function OwnerPortalGuide({ onNavigate }: Pick<NavigationProps, "onNavigate">) {
  return <section className="owner-portal-guide" aria-labelledby="owner-portal-guide-title"><p className="owner-portal-eyebrow">ITDA PARTNER GUIDE</p><h1 id="owner-portal-guide-title">우리 가게의 다음을 함께.</h1><p className="owner-portal-description">가게 선택부터 홍보안 검토까지, 차근차근 시작해 보세요.</p><ol><li><strong>가게와 오늘의 상황을 선택하세요.</strong><p>홍보하기에서 가게를 고르고 알리고 싶은 내용과 조건을 입력합니다.</p></li><li><strong>홍보 문구를 만들고 확인하세요.</strong><p>예시 기반 홍보안 중 하나를 선택하면 거리 안내 문구, SNS 문구, 숏폼 대본을 확인하고 복사할 수 있습니다.</p></li><li><strong>초안을 저장하고 관리자에게 제출하세요.</strong><p>초안은 현재 브라우저에 저장됩니다. 실제 공개는 담당 점포가 배정된 계정으로 로그인하고 홍보안을 제출한 뒤 관리자 승인을 받아야 합니다.</p></li></ol><button className="owner-portal-inline-button" type="button" onClick={() => onNavigate("marketing")}>지금 홍보하기 <ArrowRight size={16} aria-hidden="true" /></button></section>;
}

export function OwnerPortalFooter() {
  return <footer className="owner-portal-footer"><a href={appUrl("landing")}><b>ITDA</b> 우리 가게의 다음을 함께</a><small>맛&멋 AI Street · 점주 파트너</small><a href={appUrl("customer")}>소비자 거리 탐색 <ArrowRight size={14} aria-hidden="true" /></a></footer>;
}
