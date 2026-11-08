import { useEffect, useRef, useState } from "react";
import { ArrowRight, ArrowUpRight, BadgeCheck, Camera, ClipboardCheck, Copy, Mail, Store, MapPin, Utensils, LogIn, Check, Send, PencilLine, Radio, UserRound } from "lucide-react";
import { ADMIN_CONTACT_EMAIL, appUrl } from "../config/site";
import type { StoreData } from "../types/street";
import "../styles/OwnerPortal.css";
import SiteBrand from "./SiteBrand";
import { storeMenuItems } from "../data/storeMenuItems";
import { validStorefrontImage } from "../data/storefrontImage";
import { customerStoreUrl } from "../data/ownerPromotions";
import type { PromotionRequest } from "../data/promotionWorkflow";
import SceneBanner from "./SceneBanner";
import type { OwnerView } from "../data/ownerViews";

type NavigationProps = { view: OwnerView; onNavigate: (view: OwnerView) => void };
const navigation: { view: OwnerView; label: string }[] = [
  { view: "home", label: "대시보드" }, { view: "stores", label: "매장 정보" },
  { view: "marketing", label: "소식 올리기" }, { view: "account", label: "내 계정" },
  { view: "guide", label: "이용 안내" },
];

export function OwnerPortalHeader({ view, onNavigate, signedIn }: NavigationProps & { signedIn: boolean }) {
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
        {navigation.filter(item => item.view !== "account").map(item => <button key={item.view} type="button" aria-current={view === item.view ? "page" : undefined} onClick={() => navigate(item.view)}>{item.label}</button>)}
      </nav>
      {/* One clear way in: login lives on the account page, and this button always leads there. */}
      <button className={`owner-portal-account-button${signedIn ? " is-signed-in" : ""}`} type="button" aria-label={signedIn ? "내 계정" : "점주 로그인"} aria-current={view === "account" ? "page" : undefined} onClick={() => navigate("account")}>{signedIn ? <UserRound size={17} aria-hidden="true" /> : <LogIn size={17} aria-hidden="true" />}<span>{signedIn ? "내 계정" : "점주 로그인"}</span></button>
      <button className="owner-portal-menu-toggle" type="button" ref={toggle} aria-label={menuOpen ? "전체 메뉴 닫기" : "전체 메뉴 열기"} aria-expanded={menuOpen} aria-controls="owner-portal-menu" onClick={() => setMenuOpen(open => !open)}><span /><span /><span /></button>
    </div>
    <nav className="owner-portal-menu" id="owner-portal-menu" hidden={!menuOpen} aria-label="점주 전체 메뉴">
      {navigation.map(item => <button key={item.view} type="button" aria-current={view === item.view ? "page" : undefined} onClick={() => navigate(item.view)}>{item.label}</button>)}
    </nav>
  </header>;
}

/** The hero starts a post; each card below leads somewhere different (no two buttons share a destination). */
export function OwnerPortalHome({ onNavigate, signedIn }: Pick<NavigationProps, "onNavigate"> & { signedIn: boolean }) {
  return <div className="owner-portal-home">
    <section className="owner-portal-hero" aria-labelledby="owner-portal-hero-title">
      <SceneBanner scene="merchant" priority />
      <div className="owner-portal-shade" aria-hidden="true" />
      <div className="owner-portal-hero-copy"><span className="owner-portal-event-label">STORE NEWS</span><h1 id="owner-portal-hero-title">우리 가게 소식을<br />거리에서 전해요</h1><p>오늘의 메뉴와 소식을 올리면 거리를 둘러보는 손님에게 보여요.</p><button className="owner-portal-hero-button" type="button" onClick={() => onNavigate("marketing")}>소식 올리기 <ArrowRight size={28} aria-hidden="true" /></button></div>
    </section>
    <section className="owner-portal-quick-actions" aria-label="빠른 이동">
      <button className="owner-portal-quick-card" type="button" onClick={() => onNavigate("stores")}><span className="owner-portal-quick-icon"><Store aria-hidden="true" /></span><span><strong>우리 가게 정보</strong><small>메뉴·가격 확인, 수정 요청</small></span><ArrowUpRight aria-hidden="true" /></button>
      <button className="owner-portal-quick-card" type="button" onClick={() => onNavigate("account")}><span className="owner-portal-quick-icon">{signedIn ? <ClipboardCheck aria-hidden="true" /> : <LogIn aria-hidden="true" />}</span><span><strong>{signedIn ? "내 계정 · 게시 내역" : "점주 로그인"}</strong><small>{signedIn ? "공개 중인 소식과 지난 소식" : "초대받은 계정으로 시작해요"}</small></span><ArrowUpRight aria-hidden="true" /></button>
      <button className="owner-portal-quick-card" type="button" onClick={() => onNavigate("guide")}><span className="owner-portal-quick-icon"><BadgeCheck aria-hidden="true" /></span><span><strong>이용 안내</strong><small>첫 소식까지 네 단계</small></span><ArrowUpRight aria-hidden="true" /></button>
    </section>
    <p className="owner-portal-demo-note">소식 문구는 등록된 메뉴·가격으로 만든 예시에서 시작해요. 실제 AI 생성은 아니에요. 담당 점포 계정으로 로그인하면 하루 한도 안에서 직접 게시할 수 있어요.</p>
  </div>;
}

export function LivePromotionCard({ item, storeName }: { item: PromotionRequest; storeName?: string }) {
  return <article className="owner-live-card">
    <span className="owner-live-badge"><Radio size={14} aria-hidden="true"/>지금 손님에게 보이는 소식</span>
    {storeName && <strong className="owner-live-store">{storeName}</strong>}
    <p>{item.street_copy}</p>
    <small>{item.ends_on}까지 공개</small>
    <a href={customerStoreUrl(item.store_id)} target="_blank" rel="noreferrer">손님 화면에서 보기 <ArrowUpRight size={15} aria-hidden="true"/></a>
  </article>;
}

const changeTopics = ["메뉴·가격", "영업시간", "가게 소개", "가게 사진", "위치·호수"] as const;

/** There is no request inbox on the server yet, so this builds a message the owner sends to the administrator. */
function StoreChangeRequest({ store, ownerEmail }: { store: StoreData; ownerEmail?: string }) {
  const [topics, setTopics] = useState<string[]>([]);
  const [detail, setDetail] = useState("");
  const [notice, setNotice] = useState("");
  const place = `${store.building} ${store.floor}층${store.unit ? ` ${store.unit}` : ""}`;
  const message = [`[ITDA 매장 정보 수정 요청]`, `가게: ${store.name} (${place}) · 가게 번호 ${store.id}`,
    `고칠 항목: ${topics.length ? topics.join(", ") : "선택 안 함"}`, `바뀐 내용: ${detail.trim() || "(적지 않음)"}`,
    ...(ownerEmail ? [`요청한 계정: ${ownerEmail}`] : [])].join("\n");
  const ready = topics.length > 0 && detail.trim().length > 0;
  async function copy() {
    try { await navigator.clipboard.writeText(message); setNotice("요청 내용을 복사했어요. 관리자에게 메시지나 메일로 보내 주세요."); }
    catch { setNotice("자동 복사가 어려워요. 아래 요청 내용을 길게 눌러 복사해 주세요."); }
  }
  return <section className="owner-change-request" aria-labelledby="owner-change-request-title">
    <div className="owner-info-heading"><PencilLine size={20} aria-hidden="true"/><h2 id="owner-change-request-title">정보 수정 요청</h2></div>
    <p>바뀐 정보를 고르고 적으면 관리자에게 보낼 요청문을 만들어 드려요. 관리자가 확인하고 고친 뒤 손님 화면에 반영돼요.</p>
    <fieldset><legend>고칠 항목</legend>{changeTopics.map(topic => <label key={topic} className={topics.includes(topic) ? "is-selected" : undefined}><input type="checkbox" checked={topics.includes(topic)} onChange={event => { setNotice(""); setTopics(previous => event.target.checked ? [...previous, topic] : previous.filter(item => item !== topic)); }}/>{topic}</label>)}</fieldset>
    <label className="owner-change-detail">바뀐 내용 <span>{detail.length}/500</span><textarea rows={3} maxLength={500} value={detail} placeholder="예: 아메리카노 4,500원 → 4,800원, 월요일 휴무" onChange={event => { setNotice(""); setDetail(event.target.value); }}/></label>
    {ready && <pre className="owner-change-preview" aria-label="보낼 요청 내용">{message}</pre>}
    <div className="owner-change-actions">
      <button type="button" disabled={!ready} onClick={() => void copy()}><Copy size={16} aria-hidden="true"/>요청 내용 복사</button>
      {ADMIN_CONTACT_EMAIL && <a className={ready ? undefined : "is-disabled"} aria-disabled={!ready} href={ready ? `mailto:${ADMIN_CONTACT_EMAIL}?subject=${encodeURIComponent(`[ITDA] ${store.name} 정보 수정 요청`)}&body=${encodeURIComponent(message)}` : undefined}><Mail size={16} aria-hidden="true"/>메일로 보내기</a>}
    </div>
    {!ready && <p className="owner-change-hint">항목을 하나 이상 고르고 바뀐 내용을 적어 주세요.</p>}
    {notice && <p className="owner-change-notice" role="status">{notice}</p>}
  </section>;
}

export function OwnerPortalStores({ stores, selectedId, published, signedIn, ownerEmail, live, onSelect, onPromote, onNavigate }: {
  stores: StoreData[]; selectedId: number; published: boolean; signedIn: boolean; ownerEmail?: string; live?: PromotionRequest;
  onSelect: (id: number) => void; onPromote: (id: number) => void;
} & Pick<NavigationProps, "onNavigate">) {
  const store = signedIn && published ? stores.find(item => item.id === selectedId) || stores[0] : undefined;
  return <section className="owner-portal-stores" aria-labelledby="owner-portal-stores-title">
    <p className="owner-portal-eyebrow">MY STORE</p><h1 id="owner-portal-stores-title">우리 가게 정보</h1>
    <p className="owner-portal-description">관리자가 내 계정에 연결한 매장의 기본 정보와 메뉴·가격을 확인하세요.</p>
    {store ? <>
      {stores.length > 1 && <label className="owner-assigned-select">담당 매장 선택<select value={store.id} onChange={event => onSelect(Number(event.target.value))}>{stores.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>}
      {/* The real storefront photo, never a generated illustration in its place. */}
      <article className="owner-store-profile owner-store-card">
        {validStorefrontImage(store.storefrontImage)
          ? <img className="owner-store-photo" src={store.storefrontImage} alt={`${store.name} 실제 외관`} width="320" height="240" loading="lazy" decoding="async"/>
          : <div className="owner-store-photo is-empty"><Camera size={30} aria-hidden="true"/><strong>가게 사진 준비 중</strong><small>아래 정보 수정 요청으로 사진 등록을 요청해 주세요.</small></div>}
        <div><span className="owner-profile-badge"><BadgeCheck size={16} aria-hidden="true"/>관리자 할당 매장</span><h2>{store.name}</h2><p>{store.description}</p><div className="owner-store-tags">{store.tags.map(tag => <span key={tag}>{tag}</span>)}</div></div>
      </article>
      {live ? <LivePromotionCard item={live}/> : <p className="owner-live-empty"><Radio size={16} aria-hidden="true"/>지금 손님에게 보이는 소식이 없어요.</p>}
      <div className="owner-store-details">
        <section className="owner-menu-card"><div className="owner-info-heading"><Utensils size={20} aria-hidden="true"/><h2>메뉴·서비스와 가격</h2></div><dl>{storeMenuItems(store).map((item, index) => <div key={index}><dt>{item.name || "메뉴 확인 중"}</dt><dd>{item.price || "가격 문의"}</dd></div>)}</dl><p>바뀐 메뉴·가격은 아래 정보 수정 요청으로 알려 주세요.</p></section>
        <section className="owner-store-location"><div className="owner-info-heading"><MapPin size={20} aria-hidden="true"/><h2>매장 기본 정보</h2></div><dl><div><dt>업종</dt><dd>{store.category}</dd></div><div><dt>건물·층</dt><dd>{store.building} · {store.floor}층</dd></div><div><dt>호수</dt><dd>{store.unit || "등록 전"}</dd></div><div><dt>대표 메뉴</dt><dd>{store.menu}</dd></div></dl></section>
      </div>
      <StoreChangeRequest key={store.id} store={store} ownerEmail={ownerEmail}/>
      <button className="owner-primary-action" type="button" onClick={() => onPromote(store.id)}>우리 가게 소식 올리기 <ArrowRight size={17} aria-hidden="true"/></button>
    </> :<div className="owner-store-access scene-context-banner scene-context-merchant owner-store-banner"><SceneBanner scene="store" /><div><h2>{!signedIn ? "로그인하면 우리 가게가 보여요" : !published ? "게시된 매장 정보를 확인할 수 없어요" : "아직 연결된 매장이 없어요"}</h2><p>{!signedIn ? "관리자가 초대한 점주 계정으로 로그인해 주세요. 담당 매장만 표시됩니다." : !published ? "서버 연결 상태를 확인하고 잠시 후 다시 시도해 주세요." : "관리자에게 계정과 매장 연결을 요청해 주세요."}</p><button className="owner-primary-action" type="button" onClick={() => onNavigate("account")}><LogIn size={17} aria-hidden="true"/>점주 계정 확인하기</button></div></div>}
  </section>;
}

const guideSteps = [
  { number: "01", title: "로그인하고 우리 가게 확인", description: "오른쪽 위 ‘점주 로그인’에서 초대받은 계정으로 로그인하면 관리자가 연결한 매장이 보여요. 메뉴와 가격이 다르면 ‘정보 수정 요청’을 보내 주세요.", view: "stores", action: "매장 정보 보기", icon: Store },
  { number: "02", title: "전할 소식 고르기", description: "‘메뉴 소개 · 산책길 초대 · 처음 소개’ 중 하나를 고르고, 더 알리고 싶은 내용을 적어요. 실제로 제공하는 내용만 적어 주세요.", view: "marketing", action: "소식 올리기", icon: PencilLine },
  { number: "03", title: "우리 가게 말투로 다듬기", description: "등록된 메뉴·가격으로 만든 예시를 직접 고쳐요. 손님에게는 ‘거리에서 보이는 한마디’가 보이고, SNS 문구와 숏폼 대본은 복사해서 따로 쓰는 용도예요.", view: "marketing", action: "문구 다듬기", icon: Check },
  { number: "04", title: "게시하고 확인하기", description: "종료일과 오늘 남은 횟수를 확인하고 게시해요. 횟수는 점포별로 함께 쓰고 한국시간 자정에 초기화돼요. 잘못 올렸다면 내 계정에서 게시를 중단할 수 있어요.", view: "account", action: "내 계정 보기", icon: Send },
] as const;

export function OwnerPortalGuide({ onNavigate }: Pick<NavigationProps, "onNavigate">) {
  return <section className="owner-portal-guide" aria-labelledby="owner-portal-guide-title">
    <div className="owner-guide-intro scene-context-banner scene-context-merchant"><SceneBanner scene="help" /><div><p className="owner-portal-eyebrow">PARTNER GUIDE</p><h1 id="owner-portal-guide-title">처음이라도, 차근차근.</h1><p className="owner-portal-description">매장 확인부터 첫 게시까지 네 단계로 시작해 보세요.</p></div></div>
    <ol className="owner-visual-guide">{guideSteps.map(({number, title, description, view, action, icon: Icon}, index) => <li key={number}>
      <div className={`owner-guide-illustration guide-scene-${index + 1}`} aria-hidden="true"><div className="guide-window"><span className="guide-window-dots"><i/><i/><i/></span><Icon className="guide-scene-icon" size={30}/>{index === 0 ? <><span className="guide-mini-title">내 가게</span><span className="guide-mini-row">메뉴<span>가격</span></span><span className="guide-mini-row">대표 메뉴<span>확인</span></span></> : index === 1 ? <><span className="guide-mini-title">어떤 소식을 전할까요?</span><span className="guide-input-lines"/><span className="guide-mini-chip">메뉴를 소개해요</span></> : index === 2 ? <><span className="guide-mini-title">거리에서 보이는 한마디</span><span className="guide-input-lines"/><span className="guide-mini-button">내용 확인 · 초안 저장</span></> : <><span className="guide-mini-title">지금 공개 중</span><span className="guide-mini-row">가게 소식<span className="guide-mini-chip">게시 완료</span></span><span className="guide-mini-button">오늘의 소식을 전했어요</span></>}</div><span className="guide-step-number">{number}</span></div>
      <div className="owner-guide-step-copy"><span className="owner-portal-eyebrow">STEP {number}</span><h2>{title}</h2><p>{description}</p><button type="button" onClick={() => onNavigate(view)}>{action}<ArrowRight size={16} aria-hidden="true"/></button></div>
    </li>)}</ol>
  </section>;
}

export function OwnerPortalFooter() {
  return <footer className="owner-portal-footer"><a href={appUrl("landing")}><b>ITDA</b> 우리 가게의 다음을 함께</a><small>맛&멋 AI Street · 점주 파트너</small><a href={appUrl("customer")}>손님 거리 탐색 <ArrowRight size={14} aria-hidden="true" /></a></footer>;
}
