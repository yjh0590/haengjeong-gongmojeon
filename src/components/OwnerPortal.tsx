import { useEffect, useRef, useState } from "react";
import { ArrowRight, ArrowUpRight, BadgeCheck, ClipboardCheck, Image, Share2, Store, WandSparkles, MapPin, Utensils, LogIn, Check, Send, PencilLine } from "lucide-react";
import { appUrl } from "../config/site";
import type { StoreData } from "../types/street";
import "../styles/OwnerPortal.css";
import SiteBrand from "./SiteBrand";
import CharacterAccent from "./CharacterAccent";
import { storeMenuItems } from "../data/storeMenuItems";
import SceneBanner from "./SceneBanner";

export const ownerViews = ["home", "stores", "marketing", "account", "guide"] as const;
export type OwnerView = typeof ownerViews[number];
type NavigationProps = { view: OwnerView; onNavigate: (view: OwnerView) => void };
const navigation: { view: OwnerView; label: string }[] = [
  { view: "home", label: "대시보드" }, { view: "stores", label: "매장 정보" },
  { view: "marketing", label: "홍보하기" }, { view: "account", label: "게시 내역" },
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
      <button className="owner-portal-brand" type="button" onClick={() => navigate("home")} aria-label="맛&멋 AI Street 점주 대시보드">
        <SiteBrand role="owner" />
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
      <SceneBanner scene="merchant" priority />
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
        <button className="owner-portal-tool" type="button" onClick={() => onNavigate("account")}><ClipboardCheck aria-hidden="true" /><span>게시 내역</span></button>
      </div>
      <p className="owner-portal-demo-note">홍보 문구 생성은 예시 기반 시연입니다. 담당 점포로 로그인하면 일일 한도 안에서 직접 게시할 수 있습니다.</p>
    </section>
  </div>;
}

export function OwnerPortalStores({ stores, selectedId, published, signedIn, onSelect, onPromote, onNavigate }: {
  stores: StoreData[]; selectedId: number; published: boolean; signedIn: boolean;
  onSelect: (id: number) => void; onPromote: (id: number) => void;
} & Pick<NavigationProps, "onNavigate">) {
  const store = signedIn && published ? stores.find(item => item.id === selectedId) || stores[0] : undefined;
  return <section className="owner-portal-stores" aria-labelledby="owner-portal-stores-title">
    <p className="owner-portal-eyebrow">MY STORE</p><h1 id="owner-portal-stores-title">우리 가게 정보</h1>
    <p className="owner-portal-description">관리자가 내 계정에 연결한 매장의 기본 정보와 메뉴·가격을 확인하세요.</p>
    {store ? <>
      {stores.length > 1 && <label className="owner-assigned-select">담당 매장 선택<select value={store.id} onChange={event => onSelect(Number(event.target.value))}>{stores.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>}
      <article className="owner-store-profile scene-context-banner scene-context-merchant"><SceneBanner scene="merchant" />
        <div><span className="owner-profile-badge"><BadgeCheck size={16} aria-hidden="true"/>관리자 할당 매장</span><h2>{store.name}</h2><p>{store.description}</p><div className="owner-store-tags">{store.tags.map(tag => <span key={tag}>{tag}</span>)}</div></div>

      </article>
      <div className="owner-store-details">
        <section className="owner-menu-card"><div className="owner-info-heading"><Utensils size={20} aria-hidden="true"/><h2>메뉴·서비스와 가격</h2></div><dl>{storeMenuItems(store).map((item, index) => <div key={index}><dt>{item.name || "메뉴 확인 중"}</dt><dd>{item.price || "가격 문의"}</dd></div>)}</dl><p>메뉴·가격 변경은 관리자에게 요청해 주세요.</p></section>
        <section className="owner-store-location"><div className="owner-info-heading"><MapPin size={20} aria-hidden="true"/><h2>매장 기본 정보</h2></div><dl><div><dt>업종</dt><dd>{store.category}</dd></div><div><dt>건물·층</dt><dd>{store.building} · {store.floor}층</dd></div><div><dt>호수</dt><dd>{store.unit || "등록 전"}</dd></div><div><dt>대표 메뉴</dt><dd>{store.menu}</dd></div></dl></section>
      </div>
      <button className="owner-primary-action" type="button" onClick={() => onPromote(store.id)}>우리 가게 홍보하기 <ArrowRight size={17} aria-hidden="true"/></button>
    </> : <div className="owner-store-access"><CharacterAccent /><h2>{!signedIn ? "로그인하면 우리 가게가 보여요" : !published ? "게시된 매장 정보를 확인할 수 없어요" : "아직 연결된 매장이 없어요"}</h2><p>{!signedIn ? "관리자가 초대한 점주 계정으로 로그인해 주세요. 담당 매장만 표시됩니다." : !published ? "서버 연결 상태를 확인하고 잠시 후 다시 시도해 주세요." : "관리자에게 계정과 매장 연결을 요청해 주세요."}</p><button className="owner-primary-action" type="button" onClick={() => onNavigate("account")}><LogIn size={17} aria-hidden="true"/>점주 계정 확인하기</button></div>}
  </section>;
}

const guideSteps = [
  { number: "01", title: "우리 가게 확인", description: "초대받은 계정으로 로그인하면, 관리자가 연결한 매장이 나타나요. 메뉴와 가격을 먼저 확인해 주세요.", view: "stores", action: "매장 정보 보기", icon: Store },
  { number: "02", title: "알리고 싶은 내용 입력", description: "오늘의 목표와 지켜야 할 조건을 적어 주세요. 신메뉴나 한산한 시간대 등 상황을 골라도 좋아요.", view: "marketing", action: "홍보 내용 입력", icon: PencilLine },
  { number: "03", title: "문구 확인하고 초안 저장", description: "예시로 만든 홍보안에서 메뉴·가격·행사 조건을 확인하세요. SNS 문구와 숏폼 대본도 복사할 수 있어요.", view: "marketing", action: "홍보 문구 만들기", icon: Check },
  { number: "04", title: "게시하고 내역 확인", description: "담당 계정으로 로그인한 뒤 종료일과 남은 횟수를 확인해 게시하세요. 사용 횟수는 점포별로 공유하며 한국시간 자정에 초기화돼요.", view: "account", action: "게시 내역 보기", icon: Send },
] as const;

export function OwnerPortalGuide({ onNavigate }: Pick<NavigationProps, "onNavigate">) {
  return <section className="owner-portal-guide" aria-labelledby="owner-portal-guide-title">
    <div className="owner-guide-intro scene-context-banner scene-context-merchant"><SceneBanner scene="merchant" /><div><p className="owner-portal-eyebrow">PARTNER GUIDE</p><h1 id="owner-portal-guide-title">처음이라도, 차근차근.</h1><p className="owner-portal-description">매장 확인부터 첫 게시까지 네 단계로 시작해 보세요.</p></div></div>
    <ol className="owner-visual-guide">{guideSteps.map(({number, title, description, view, action, icon: Icon}, index) => <li key={number}>
      <div className={`owner-guide-illustration guide-scene-${index + 1}`} aria-hidden="true"><div className="guide-window"><span className="guide-window-dots"><i/><i/><i/></span><Icon className="guide-scene-icon" size={30}/>{index === 0 ? <><span className="guide-mini-title">내 가게</span><span className="guide-mini-row">메뉴<span>가격</span></span><span className="guide-mini-row">대표 메뉴<span>확인</span></span></> : index === 1 ? <><span className="guide-mini-title">오늘 알리고 싶은 내용</span><span className="guide-input-lines"/><span className="guide-mini-chip">신메뉴 알리기</span></> : index === 2 ? <><span className="guide-mini-title">우리 가게 홍보안</span><span className="guide-input-lines"/><span className="guide-mini-button">내용 확인 · 초안 저장</span></> : <><span className="guide-mini-title">게시 내역</span><span className="guide-mini-row">가게 소식<span className="guide-mini-chip">게시 완료</span></span><span className="guide-mini-button">오늘의 소식을 전했어요</span></>}</div><span className="guide-step-number">{number}</span></div>
      <div className="owner-guide-step-copy"><span className="owner-portal-eyebrow">STEP {number}</span><h2>{title}</h2><p>{description}</p><button type="button" onClick={() => onNavigate(view)}>{action}<ArrowRight size={16} aria-hidden="true"/></button></div>
    </li>)}</ol>
  </section>;
}

export function OwnerPortalFooter() {
  return <footer className="owner-portal-footer"><a href={appUrl("landing")}><b>ITDA</b> 우리 가게의 다음을 함께</a><small>맛&멋 AI Street · 점주 파트너</small><a href={appUrl("customer")}>소비자 거리 탐색 <ArrowRight size={14} aria-hidden="true" /></a></footer>;
}
