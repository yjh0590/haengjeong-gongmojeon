import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft, ArrowRight, ArrowUp, Bookmark, Camera, Check, ChevronDown,
  ChevronRight, Compass, Eye, Heart, Info, Layers3, LocateFixed, Map,
  MapPin, Navigation, Search, Sparkles, Store, Utensils, X, Zap,
} from "lucide-react";
import "../styles/Customer.css";
import type { ApprovedPromotionData, FilterType, StoreData, ViewDirection } from "../types/street";
import { stores as examples } from "../data/stores";
import { useStoreDraft } from "../data/storeDraft";
import { usePublicSite } from "../data/sitePublication";
import { appUrl, currentSurface } from "../config/site";
import { useStreetNodes } from "../data/streetNetwork";
import { findStorePhotoRoute } from "../data/routeGuide";
import { useMapGeometry, MAP_BG_KEY } from "../data/mapGeometry";
import { useDraftPhotoUrls, photoKey } from "../data/localStreetPhotos";
import { getFacadeAnnotations, type FacadeAnnotation } from "../data/facadeAnnotations";

const filters: FilterType[] = ["전체", "맛", "멋", "이벤트"];
const directions: ViewDirection[] = ["forward", "right", "back", "left"];
const directionName: Record<ViewDirection, string> = { forward: "앞", back: "뒤", left: "왼쪽", right: "오른쪽" };
const FAVORITES_KEY = "matmeot-favorites-v1";
const APPROVAL_KEY = "matmeot-approved-promotion";

function readFavorites(): number[] {
  try {
    const raw = JSON.parse(localStorage.getItem(FAVORITES_KEY) || "[]");
    return Array.isArray(raw) ? raw.filter((id): id is number => typeof id === "number") : [];
  } catch { return []; }
}
function readApproved(): ApprovedPromotionData | null {
  try { return JSON.parse(localStorage.getItem(APPROVAL_KEY) || "null"); }
  catch { return null; }
}
function firstAvailableView(nodeId: string, nodes: ReturnType<typeof useStreetNodes>, preferred: ViewDirection = "forward"): ViewDirection {
  const node = nodes.find((item) => item.id === nodeId);
  if (!node) return preferred;
  if (node.views[preferred]) return preferred;
  return directions.find((direction) => node.views[direction]) || preferred;
}
function locateStoreNode(storeId: number, nodes: ReturnType<typeof useStreetNodes>): string {
  return nodes.find((node) => node.stores.includes(storeId))?.id || nodes[0]?.id || "point1";
}
function matchStore(store: StoreData, filter: FilterType, query: string) {
  const categoryMatches = filter === "전체" || (filter === "이벤트" ? Boolean(store.event) : store.type === filter);
  const textMatches = !query.trim() || [store.name, store.category, store.description, store.menu, ...store.tags]
    .join(" ").toLocaleLowerCase().includes(query.trim().toLocaleLowerCase());
  return categoryMatches && textMatches;
}

export default function Customer() {
  const localNodes = useStreetNodes();
  const localGeometry = useMapGeometry();
  const draftStores = useStoreDraft();
  const publication = usePublicSite();
  const streetNodes = publication.data?.nodes || localNodes;
  const geometry = publication.data?.geometry || localGeometry;
  const catalog = publication.data?.stores || (publication.status === "preview" ? draftStores : examples);
  const {urls: draftUrls} = useDraftPhotoUrls();
  const mapBackground = publication.status === "published" ? undefined : draftUrls[MAP_BG_KEY];
  const [floor, setFloor] = useState<"전체" | 1 | 2 | 3>("전체");
  const [building, setBuilding] = useState("전체");
  const [routeTargetId, setRouteTargetId] = useState<number | null>(null);
  const [approvedPromotion, setApprovedPromotion] = useState<ApprovedPromotionData | null>(readApproved);
  const [favorites, setFavorites] = useState<number[]>(readFavorites);
  const [currentNodeId, setCurrentNodeId] = useState("point1");
  const [currentView, setCurrentView] = useState<ViewDirection>("forward");
  const [filter, setFilter] = useState<FilterType>("전체");
  const [query, setQuery] = useState("");
  const [onlySaved, setOnlySaved] = useState(false);
  const [selectedStoreId, setSelectedStoreId] = useState<number | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [showDiscoveries, setShowDiscoveries] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [draftFacades, setDraftFacades] = useState<FacadeAnnotation[]>(getFacadeAnnotations);
  const facades: FacadeAnnotation[] = publication.data?.facades || draftFacades;
  const explorerRef = useRef<HTMLElement>(null);
  const mapRef = useRef<HTMLElement>(null);

  useEffect(() => { document.title = "거리 탐색 · 맛&멋 AI Street"; }, []);
  useEffect(() => {
    if (!detailsOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === "Escape") setDetailsOpen(false); };
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [detailsOpen]);
  useEffect(() => {
    const syncData = () => { setApprovedPromotion(readApproved()); setDraftFacades(getFacadeAnnotations()); };
    const onStorage = (event: StorageEvent) => {
      if (event.key === APPROVAL_KEY || event.key === "matmeot-facades-v1") syncData();
      if (event.key === FAVORITES_KEY) setFavorites(readFavorites());
    };
    window.addEventListener("focus", syncData);
    window.addEventListener("storage", onStorage);
    return () => { window.removeEventListener("focus", syncData); window.removeEventListener("storage", onStorage); };
  }, []);

  const effectiveStores = useMemo(() => catalog.map((store) => {
    // Approved campaigns expire automatically on the date set by the owner.
    const today = new Date();
    const localDate = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,"0")}-${String(today.getDate()).padStart(2,"0")}`;
    const current = store.eventUntil && store.eventUntil < localDate ? {...store,event:undefined} : store;
    if (publication.status === "published" || approvedPromotion?.storeId !== store.id) return current;
    return { ...current, event: approvedPromotion.promotion.streetCopy };
  }), [catalog, approvedPromotion, publication.status]);
  const buildings = useMemo(() => [...new Set(effectiveStores.map(store => store.building.trim()).filter(Boolean))].sort((a,b) => a.localeCompare(b, "ko")), [effectiveStores]);
  const selectedStore = effectiveStores.find((store) => store.id === selectedStoreId) || null;
  const routeTarget = effectiveStores.find(store => store.id === routeTargetId) || null;
  const routePath = useMemo(() => routeTarget ? findStorePhotoRoute(currentNodeId, routeTarget.id, streetNodes) : null,
    [routeTarget, currentNodeId, streetNodes]);
  const routeNextId = routePath && routePath.length > 1 ? routePath[1] : null;
  const routeNextConnection = streetNodes.find(node => node.id === currentNodeId)?.connections.find(link => link.to === routeNextId);
  const currentNode = streetNodes.find((node) => node.id === currentNodeId) || streetNodes[0];
  const currentImage = (publication.status === "published" ? undefined : draftUrls[photoKey(currentNodeId, currentView)]) || currentNode.views[currentView];
  const matchingStores = useMemo(() => effectiveStores.filter((store) =>
    matchStore(store, filter, query) && (floor === "전체" || store.floor === floor) && (building === "전체" || store.building === building) && (!onlySaved || favorites.includes(store.id))),
  [effectiveStores, filter, query, onlySaved, favorites, floor, building]);
  const featuredStores = useMemo(() => effectiveStores.filter((store) => Boolean(store.event)), [effectiveStores]);
  const activeFacades = facades.filter((a) => a.nodeId === currentNodeId && a.view === currentView &&
    effectiveStores.some((s) => s.id === a.storeId));

  const jumpToExplorer = () => explorerRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  const focusNode = (nodeId: string, preferred: ViewDirection = "forward") => {
    setCurrentNodeId(nodeId);
    const node=streetNodes.find(n=>n.id===nodeId);
    if (draftUrls[photoKey(nodeId,preferred)] || node?.views[preferred]) { setCurrentView(preferred); return; }
    const next=directions.find(d=>draftUrls[photoKey(nodeId,d)] || node?.views[d]);
    setCurrentView(next || firstAvailableView(nodeId, streetNodes, preferred));
  };
  const focusStore = (storeId: number, openDetails = false) => {
    const linked = streetNodes.find(node => node.stores.includes(storeId));
    if (linked) {
      const annotation = facades.find(item => item.storeId === storeId && item.nodeId === linked.id);
      focusNode(linked.id, annotation?.view || "forward");
    }
    setSelectedStoreId(storeId);
    const chosen = effectiveStores.find((s) => s.id === storeId);
    if (chosen) { setFloor(chosen.floor); setBuilding(chosen.building); }
    setDetailsOpen(openDetails);
    if (openDetails) jumpToExplorer();
  };
  // '사진 지점 안내' intentionally does not teleport the user to the destination.
  // It follows only administrator-configured directional links, not physical walkways.
  const guideToStore = (storeId: number) => {
    const chosen = effectiveStores.find(store => store.id === storeId);
    if (!chosen) return;
    setRouteTargetId(storeId);
    setSelectedStoreId(storeId);
    setFloor(chosen.floor);
    setBuilding(chosen.building);
    setDetailsOpen(false);
    jumpToExplorer();
  };
  const moveAlongRoute = () => {
    if (!routeNextId || !routeNextConnection) return;
    focusNode(routeNextId, routeNextConnection.arrivalView || routeNextConnection.direction);
  };
  const toggleFavorite = (storeId: number) => {
    setFavorites((previous) => {
      const updated = previous.includes(storeId) ? previous.filter((id) => id !== storeId) : [...previous, storeId];
      localStorage.setItem(FAVORITES_KEY, JSON.stringify(updated));
      return updated;
    });
  };
  const pickRecommended = () => {
    const candidate = [...matchingStores].sort((a, b) => b.aiScore - a.aiScore)[0];
    if (candidate) focusStore(candidate.id, true);
  };

  return <div className="app-shell">
    <header className="top-navigation">
      <button className="brand" type="button" onClick={() => { setShowDiscoveries(false); window.scrollTo({ top: 0, behavior: "smooth" }); }} aria-label="맛앤멋 AI Street 처음으로">
        <span className="brand-symbol"><Sparkles size={20} /></span>
        <span className="brand-text"><strong>맛&멋</strong><span>AI Street</span></span>
      </button>
      <nav className="desktop-nav" aria-label="주요 메뉴">
        <button className={`nav-item ${!showDiscoveries ? "active" : ""}`} type="button" onClick={() => { setShowDiscoveries(false); jumpToExplorer(); }}>거리 탐색</button>
        <button className={`nav-item ${showDiscoveries ? "active" : ""}`} type="button" onClick={() => { setShowDiscoveries(true); setFilter("이벤트"); setOnlySaved(false); setQuery(""); jumpToExplorer(); }}>오늘의 발견</button>
        <a className="nav-item mode-switch-link" href={appUrl("owner")}>점주용 화면 <ArrowRight size={14} /></a>
      </nav>
      <span className="location-pill"><MapPin size={15} /> 송도 타임스페이스 <span className="demo-dot">시범 구역</span></span>
    </header>

    <main className="page">
      <section className="hero">
        <div className="hero-copy">
          <span className="eyebrow"><Sparkles size={14}/> YOUR LOCAL DISCOVERY</span>
          <h1>지도에서 발견하고,<br /><span>거리에서 찾아보세요.</span></h1>
          <p>가게를 고르면 촬영한 거리 사진으로 이어져요.<br className="desktop-break"/> 타임스페이스의 맛과 멋을 한곳에서 탐색해 보세요.</p>
          <div className="hero-actions">
            <button className="primary-action" type="button" onClick={() => { setShowDiscoveries(false); jumpToExplorer(); }}><Map size={18}/> 지도에서 가게 찾기 <ArrowRight size={16}/></button>
            <button className="secondary-action" type="button" onClick={() => { setShowDiscoveries(true); setFilter("이벤트"); setOnlySaved(false); setQuery(""); jumpToExplorer(); }}><Zap size={17}/> 오늘의 발견</button>
          </div>
        </div>
        <div className="hero-aside" aria-label="이용 안내">
          <span className="hero-aside-kicker"><Compass size={16}/> 한눈에 보는 탐색 방법</span>
          <div className="hero-step"><span>01</span><div><strong>지도에서 가게 선택</strong><small>맛집·문화·이벤트를 찾아요</small></div></div>
          <div className="hero-step"><span>02</span><div><strong>거리 사진으로 위치 확인</strong><small>촬영된 방향을 둘러볼 수 있어요</small></div></div>
          <div className="hero-step"><span>03</span><div><strong>마음에 들면 저장</strong><small>다음에 다시 쉽게 찾아요</small></div></div>
          <button className="hero-help" type="button" onClick={() => setShowHelp((p) => !p)} aria-expanded={showHelp}><Info size={15}/> {showHelp ? "안내 접기" : "거리 탐색은 어떻게 작동하나요?"} <ChevronDown size={15}/></button>
          {showHelp && <p className="hero-help-body">현재 사진 2장은 일반 거리 사진이며 360도 파노라마가 아닙니다. 지도는 실측 위치도가 아닌 시연용 구역 안내도예요. 실제 촬영·측량 데이터가 확보되면 교체할 수 있도록 만들었습니다.</p>}
        </div>
      </section>

      <section className="explore-section" ref={explorerRef} id="explore" aria-label="가게 및 거리 탐색">
        <div className="section-heading">
          <div><span className="eyebrow">EXPLORE TIMESPACE</span><h2>우리 동네 거리 탐색</h2><p>전체 안내도에서 촬영 지점·가게·층을 선택해 보세요.</p></div>
          <span className="section-region"><MapPin size={15}/> 전체 구역 · 층별 탐색 준비</span>
        </div>

        <div className="site-data-status" role="status">{publication.status === "published" ? `게시된 점포 데이터 · ${publication.publishedAt ? new Date(publication.publishedAt).toLocaleDateString("ko-KR") : ""} 갱신 · 영업 현황은 점포 확인 필요` : publication.status === "loading" ? "게시된 점포 정보를 불러오는 중입니다. 현재 시연 데이터가 표시될 수 있어요." : publication.status === "offline" ? "서버 연결에 실패해 시연용 점포 정보를 표시하고 있습니다. 실제 영업 정보로 사용하지 마세요." : publication.status === "preview" ? "관리자 초안 미리보기 · 이 브라우저에서 수정한 가게·위치 정보" : "시연용 점포·이벤트 데이터 · 실제 영업 정보가 아닙니다."}</div>
        <div className="explore-toolbar">
          <label className="search-field"><Search size={19}/><input value={query} onChange={(event) => { setQuery(event.target.value); setShowDiscoveries(false); }} placeholder="가게 이름·업종·키워드 검색" aria-label="전체 가게 검색"/>{query && <button type="button" className="clear-search" onClick={() => setQuery("")} aria-label="검색어 지우기"><X size={15}/></button>}</label>
          <div className="filter-buttons" role="group" aria-label="가게 필터">
            {filters.map((item) => <button key={item} type="button" className={`filter-chip ${filter === item ? "selected" : ""} type-${item === "전체" ? "all" : item === "맛" ? "food" : item === "멋" ? "style" : "event"}`} onClick={() => { setFilter(item); setShowDiscoveries(item === "이벤트"); }} aria-pressed={filter === item}>
              {item === "맛" ? <Utensils size={15}/> : item === "멋" ? <Camera size={15}/> : item === "이벤트" ? <Zap size={15}/> : <Layers3 size={15}/>} {item}
            </button>)}
            <button type="button" className={`filter-chip saved-filter ${onlySaved ? "selected" : ""}`} onClick={() => { setOnlySaved((p) => !p); setShowDiscoveries(false); }} aria-pressed={onlySaved}><Heart size={15} fill={onlySaved ? "currentColor" : "none"}/> 저장한 가게 {favorites.length > 0 && <span className="saved-count">{favorites.length}</span>}</button>
          </div>
        </div>


        <div className="building-selector" role="group" aria-label="건물별 점포 보기">
          <div className="building-selector-label"><Store size={16}/><strong>건물별 보기</strong><small>등록된 건물 정보 기준</small></div>
          <div className="building-selector-options">
            {["전체", ...buildings].map(item => <button key={item} type="button" className={building===item ? "selected" : ""} onClick={() => { setBuilding(item); setSelectedStoreId(null); setRouteTargetId(null); }} aria-pressed={building===item}>{item === "전체" ? "전체 건물" : item} <span>{item === "전체" ? effectiveStores.length : effectiveStores.filter(store => store.building === item).length}</span></button>)}
          </div>
        </div>
        <div className="floor-selector" role="group" aria-label="층별 가게 보기">
          <div className="floor-selector-label"><Layers3 size={17}/><strong>층별 탐색</strong><span>선택한 층의 가게만 지도에 표시돼요</span></div>
          <div className="floor-selector-options">{(["전체",1,2,3] as const).map((n)=><button key={n} type="button" className={floor===n?"selected":""} onClick={()=>{setFloor(n);setSelectedStoreId(null);}} aria-pressed={floor===n}>{n==="전체"?"전체 층":`${n}층`} <span>{effectiveStores.filter(store => (building === "전체" || store.building === building) && (n === "전체" || store.floor === n)).length}</span></button>)}</div>
        </div>
        {routeTarget && <div className="route-guide" role="status" aria-live="polite">
          <div className="route-guide-top"><div><span className="route-guide-kicker"><Navigation size={15}/> 촬영 지점 연결 안내 · 실측 길찾기 아님</span>
            <strong>{routeTarget.name} <span>· {routeTarget.building} {routeTarget.floor}층 {routeTarget.unit || ""}</span></strong>
          </div><button type="button" className="route-stop" onClick={() => setRouteTargetId(null)} aria-label="촬영 지점 안내 종료"><X size={17}/> 종료</button></div>
          {!routePath ? <p>현재 지점에서 이 가게가 연결된 촬영 지점까지 이어지는 경로가 없어요. 관리자에서 촬영 지점 연결을 확인해야 합니다.</p>
            : routePath.length === 1 ? <p><Check size={15}/> 이 가게와 연결된 촬영 지점에 도착했어요. {routeTarget.floor > 1 ? `${routeTarget.floor}층의 실제 출입구와 이동 동선은 현장 확인이 필요합니다.` : "사진에서 외관과 위치를 확인해 주세요."}</p>
            : <><p>등록된 촬영 지점 기준 <strong>{routePath.length - 1}번 이동</strong> · {routePath.map(id => streetNodes.find(node=>node.id===id)?.number ?? "?").join(" → ")}번 지점 순서</p>
              <button type="button" className="route-next" onClick={moveAlongRoute}><Navigation size={16}/> 다음 {streetNodes.find(node=>node.id===routeNextId)?.number}번 촬영 지점 보기 <ArrowRight size={15}/></button></>}
          <small>사진 지점 간 연결만 안내합니다. 실제 도보 길이·시간·건물 출입구·계단/엘리베이터 접근성은 확인되지 않았습니다.</small>
        </div>}
        {showDiscoveries && <div className="discovery-banner"><Zap size={17}/><div><strong>오늘의 발견 · 시연용 이벤트</strong><span>등록된 홍보 문구를 지도에서 강조해 보여줘요. 실제 행사 진행 여부는 점포에 확인해야 합니다.</span></div><button type="button" onClick={() => { setShowDiscoveries(false); setFilter("전체"); }} aria-label="오늘의 발견 닫기"><X size={17}/></button></div>}

        <div className="explore-layout">
          <section className="map-panel" ref={mapRef} aria-label="구역 안내도">
            <div className="panel-header"><div><span className="panel-eyebrow">INTERACTIVE MAP</span><h3><Map size={19}/> 타임스페이스 전체 상권 안내</h3></div><span className="map-badge">지도 등록·측량 전</span></div>
            <p className="map-instruction">표시한 전체 구역을 기준으로 촬영 지점과 층별 가게를 연결합니다. 실제 좌표는 지도 편집기에서 정할 수 있어요.</p>
            <div className="district-map">
              <svg viewBox="0 0 500 374" className="map-svg" role="img" aria-label="상권 전체 구역과 촬영 지점 및 선택한 층의 시연 점포 안내도">
                <defs><pattern id="mapGrid" width="22" height="22" patternUnits="userSpaceOnUse"><path d="M 22 0 L 0 0 0 22" fill="none" stroke="#cdd8e5" strokeWidth="0.55"/></pattern></defs>
                {mapBackground && <image href={mapBackground} x="0" y="0" width="500" height="374" preserveAspectRatio="none"/>}
                {!mapBackground && <rect x="0" y="0" width="500" height="374" fill="#edf3f5"/>}
                {!mapBackground && <rect width="500" height="374" fill="url(#mapGrid)"/>}
                {!mapBackground && <path d="M-40 68L540 68M-40 340L540 340" stroke="#fff" strokeWidth="32"/>}
                {!mapBackground && <path d="M65 -40L65 420M442 -40L442 420" stroke="#fff" strokeWidth="36"/>}
                {!mapBackground && <path d="M113 290 L164 202 L310 165 L361 274" stroke="#fff" strokeWidth="24" strokeLinecap="round" strokeLinejoin="round"/>}
                {!mapBackground && <path d="M113 290 L164 202 L310 165 L361 274" stroke="#cbd8df" strokeWidth="1.4" strokeDasharray="6 7" fill="none"/>}
                {!mapBackground && <><rect x="84" y="94" width="83" height="66" rx="7" fill="#dbe4dc"/><rect x="223" y="92" width="83" height="46" rx="7" fill="#dbe4dc"/><rect x="316" y="210" width="78" height="45" rx="7" fill="#dbe4dc"/><rect x="180" y="247" width="87" height="53" rx="7" fill="#dbe4dc"/></>}
                {!mapBackground && <><text x="115" y="132" className="map-building">D동</text><text x="250" y="117" className="map-building">시범</text><text x="347" y="239" className="map-building">구역</text></>}
                {!mapBackground && <text x="249" y="46" className="map-road-label">시범 구역 안내 · 실제 지형과 다름</text>}
                {geometry.passages.map((path,i)=>path.length>=2?<polyline key={`passage${i}`} points={path.map(p=>`${p.x},${p.y}`).join(" ")} fill="none" stroke="#13a99e" strokeWidth="4" strokeDasharray="9 6" strokeLinecap="round" pointerEvents="none"/>:null)}
                {geometry.boundary.length >= 3 && <polygon points={geometry.boundary.map(p=>`${p.x},${p.y}`).join(" ")} fill="#f59e0b14" stroke="#ea580c" strokeWidth="3" strokeDasharray="9 6" pointerEvents="none"/>}
                {routePath && routePath.length > 1 && routePath.every(id => Boolean(geometry.nodes[id])) && <polyline className="photo-route-line" points={routePath.map(id => { const p=geometry.nodes[id]; return `${p.x},${p.y}`; }).join(" ")} fill="none" stroke="#2563eb" strokeWidth="5" strokeLinejoin="round" strokeLinecap="round" strokeDasharray="7 5" pointerEvents="none"/>}
                {streetNodes.map((node) => { const p = geometry.nodes[node.id]; return !p ? null : <g key={node.id} className={`map-node ${currentNodeId === node.id ? "is-active" : ""}`} onClick={() => focusNode(node.id)} role="button" tabIndex={0} aria-label={`${node.number}번 촬영 지점 보기`} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); focusNode(node.id); } }}>
                    <circle cx={p.x} cy={p.y} r={currentNodeId === node.id ? "23" : "19"} className="map-node-ring"/><circle cx={p.x} cy={p.y} r="16" className="map-node-circle"/><text x={p.x} y={p.y + 5.2} className="map-node-text">{node.number}</text>
                  </g>; })}
                {matchingStores.map((store) => { const nodeP = geometry.nodes[locateStoreNode(store.id, streetNodes)]; const point = geometry.stores[String(store.id)] || (publication.status === "published" ? null : nodeP); if (!point) return null; const x=point.x; const y=point.y; const active = selectedStoreId === store.id;
                  return <g key={store.id} className={`map-store-marker ${active ? "is-active" : ""}`} role="button" tabIndex={0} aria-label={`${store.name} · ${store.floor}층 선택`} onClick={() => focusStore(store.id)} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); focusStore(store.id); } }}>
                    <rect x={x - 22} y={y - 14} width="44" height="29" rx="13" className={`map-store-chip ${store.type === "맛" ? "food" : "style"}`}/><text x={x} y={y + 4.3} className="map-store-text">{store.floor}F · {store.id}</text>{store.event && <circle cx={x + 18} cy={y - 10} r="5" fill="#eab308" stroke="white" strokeWidth="2"/>}
                  </g>; })}
              </svg>
              <div className="map-legend"><span><i className="legend-node"/>촬영 지점</span><span><i className="legend-food"/>맛</span><span><i className="legend-style"/>멋</span><span><i className="legend-event"/>홍보 표시</span>{routePath && routePath.length > 1 && <span><i className="legend-photo-route"/>사진 지점 안내</span>}</div>
            </div>
            <p className="map-disclaimer"><Info size={14}/> 지도 배경·가게 좌표·층 정보는 관리자 검증 전에는 시연 데이터입니다. 길찾기 용도가 아닙니다. {currentSurface()==="legacy" && <a href={appUrl("editor","/map-editor")}> 전체 지도 편집 도구</a>}</p>
            <div className="node-quicklinks" role="group" aria-label="촬영 지점 선택">
              {streetNodes.map((node) => <button key={node.id} type="button" className={currentNodeId === node.id ? "active" : ""} onClick={() => focusNode(node.id)}><span>{node.number}</span>{node.name}{routePath?.includes(node.id) && <Navigation size={13}/>}{directions.some(d=>draftUrls[photoKey(node.id,d)] || node.views[d]) && <Camera size={13}/>}</button>)}
            </div>
          </section>

          <section className="street-panel" aria-label="실제 거리 사진">
            <div className="panel-header"><div><span className="panel-eyebrow">STREET PHOTO</span><h3><Eye size={19}/> {currentNode.name} · {directionName[currentView]} 방향</h3></div><span className={`photo-badge ${currentImage ? "is-ready" : ""}`}>{currentImage ? "촬영 사진" : "촬영 준비"}</span></div>
            <div className={`street-image ${currentImage ? "has-photo" : "is-placeholder"}`}>
              {currentImage ? <img src={currentImage} alt={`${currentNode.name}에서 바라본 ${directionName[currentView]} 방향 실제 거리 사진`} className="street-photo"/> : <div className="street-empty"><Camera size={42}/><strong>이 방향의 사진을 준비 중이에요</strong><span>촬영 후 사진을 등록하면 이곳에 표시됩니다.</span></div>}
              {currentImage && activeFacades.length > 0 && <svg className="facade-overlay" viewBox="0 0 100 100" preserveAspectRatio="none" aria-label="사진 속 가게 영역">
                {activeFacades.map((item) => <polygon key={`${item.nodeId}-${item.view}-${item.storeId}`} points={item.points.map((p) => `${p.x},${p.y}`).join(" ")} className={selectedStoreId === item.storeId ? "facade-polygon active" : "facade-polygon"} onClick={() => focusStore(item.storeId)}><title>{effectiveStores.find((s) => s.id === item.storeId)?.name || "가게"} 영역</title></polygon>)}
              </svg>}
              <span className="street-photo-caption"><MapPin size={13}/> {currentNode.subtitle}</span>
              {currentImage && <span className="street-photo-notice">일반 촬영 사진 · 360° 파노라마 아님</span>}
            </div>
            <div className="direction-controls"><span>보는 방향</span><div>{directions.map((direction) => <button key={direction} type="button" className={currentView === direction ? "active" : ""} onClick={() => setCurrentView(direction)} aria-pressed={currentView === direction}>{direction === "forward" ? <ArrowUp size={14}/> : direction === "back" ? <ChevronDown size={14}/> : direction === "left" ? <ArrowLeft size={14}/> : <ArrowRight size={14}/>} {directionName[direction]} {(draftUrls[photoKey(currentNodeId,direction)] || currentNode.views[direction]) ? <span className="direction-ready"/> : <span className="direction-pending"/>}</button>)}</div></div>
            <div className="street-footer"><div><Camera size={15}/><span>{currentNode.number}번 지점 · 사진 {directions.filter(d=>draftUrls[photoKey(currentNodeId,d)] || currentNode.views[d]).length}개 등록</span></div><div className="street-navigation">{routeNextId && <button className="route-navigation-next" type="button" onClick={moveAlongRoute}><Navigation size={14}/> 안내: 다음 {streetNodes.find(n=>n.id===routeNextId)?.number}번 지점 <ArrowRight size={14}/></button>}{currentNode.connections.map((connection) => <button key={`${connection.to}-${connection.direction}`} type="button" onClick={() => focusNode(connection.to, connection.arrivalView || connection.direction)}><Navigation size={14}/> {streetNodes.find((n) => n.id === connection.to)?.number}번 지점 <ArrowRight size={14}/></button>)}</div></div>
            {selectedStore && <div className="selected-store-strip"><span><Store size={15}/><strong>{selectedStore.name}</strong> · {selectedStore.building} {selectedStore.floor}층 {selectedStore.unit || ""} · {selectedStore.floor>1?"1층 외관/출입구 참고":"1층 거리 사진"} · {activeFacades.some((a) => a.storeId === selectedStore.id) ? "영역 표시됨" : "영역 미등록"}</span><button type="button" onClick={() => setDetailsOpen(true)}>가게 상세 보기 <ChevronRight size={15}/></button></div>}
            <p className="street-small-help">지도에서 가게를 선택하면 연결된 촬영 지점이 열립니다. 가게 외곽선 표시는 영역 데이터를 등록한 사진에서만 나타납니다.</p>
          </section>
        </div>

        <div className="store-section-heading"><div><span className="eyebrow">STORES & DISCOVERY</span><h3>{showDiscoveries ? "이벤트가 등록된 가게" : onlySaved ? "저장한 가게" : query ? "검색 결과" : "이 구역에서 발견할 가게"}</h3><p>{matchingStores.length}곳 표시 · 카드를 선택하면 촬영 지점과 연결됩니다.</p></div><button type="button" className="recommended-button" onClick={pickRecommended} disabled={!matchingStores.length}><Sparkles size={16}/> 추천 예시 보기</button></div>
        {matchingStores.length ? <div className="store-grid">{matchingStores.map((store) => <article key={store.id} className={`store-card ${selectedStoreId === store.id ? "is-selected" : ""}`}>
          <div className="store-card-top"><span className={`category-pill ${store.type === "맛" ? "food" : "style"}`}>{store.type === "맛" ? <Utensils size={13}/> : <Camera size={13}/>} {store.type} · {store.category}</span><button type="button" className={`favorite-button ${favorites.includes(store.id) ? "is-saved" : ""}`} onClick={() => toggleFavorite(store.id)} aria-label={`${store.name} ${favorites.includes(store.id) ? "저장 해제" : "저장"}`} aria-pressed={favorites.includes(store.id)}><Heart size={19} fill={favorites.includes(store.id) ? "currentColor" : "none"}/></button></div>
          <button type="button" className="store-card-main" onClick={() => focusStore(store.id, true)}><strong>{store.name}</strong><span>{store.description}</span></button>
          {store.event && <div className="store-event"><Zap size={14}/><span>{store.event}</span></div>}
          <div className="store-card-bottom"><span><MapPin size={14}/>{store.building} {store.floor}층 · {store.unit || "호수 확인 전"}</span><button type="button" onClick={() => focusStore(store.id, true)}>거리 사진 보기 <ChevronRight size={15}/></button></div>
          <button className="store-card-route" type="button" disabled={!streetNodes.some(node => node.stores.includes(store.id))} onClick={() => guideToStore(store.id)}><Navigation size={14}/> 현재 촬영 지점에서 찾아보기</button>
        </article>)}</div> : <div className="no-stores"><Search size={26}/><strong>조건에 맞는 가게가 없어요</strong><p>검색어 또는 필터를 변경해 보세요.</p><button type="button" onClick={() => { setQuery(""); setFilter("전체"); setOnlySaved(false); setShowDiscoveries(false); setFloor("전체"); setBuilding("전체"); }}>전체 가게 보기</button></div>}

        {featuredStores.length > 0 && !showDiscoveries && <div className="subtle-promo"><Zap size={18}/><span>등록된 이벤트 문구가 있는 가게 <strong>{featuredStores.length}곳</strong>을 모아볼 수 있어요.</span><button type="button" onClick={() => { setFilter("이벤트"); setShowDiscoveries(true); setOnlySaved(false); setQuery(""); jumpToExplorer(); }}>오늘의 발견 보기 <ArrowRight size={15}/></button></div>}
      </section>
      <footer className="customer-footer"><span>맛&멋 AI Street · 송도 타임스페이스 시범 프로젝트</span><span>{publication.status === "published" ? "관리자 게시 정보 · 실측 위치 및 영업 여부는 별도 확인 필요" : "테스트용 점포 정보 · 실측 지도 및 실시간 영업 정보 미연동"}</span>{currentSurface()==="legacy" && <><a href={appUrl("editor","/map-editor")}>전체 지도 편집 <ArrowRight size={13}/></a><a href={appUrl("editor","/street-editor")}>거리 사진 편집 <ArrowRight size={13}/></a></>}</footer>
    </main>

    {detailsOpen && selectedStore && <div className="modal-overlay" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setDetailsOpen(false); }}><section className="store-modal" role="dialog" aria-modal="true" aria-labelledby="store-modal-title">
      <button type="button" className="modal-close" onClick={() => setDetailsOpen(false)} aria-label="가게 정보 닫기"><X size={20}/></button>
      <div className="modal-visual"><span className={`category-pill ${selectedStore.type === "맛" ? "food" : "style"}`}>{selectedStore.type} · {selectedStore.category}</span><div><Store size={28}/><span>LOCAL STORE</span></div></div>
      <div className="modal-body"><span className="modal-overline">{selectedStore.building} · {selectedStore.floor}층 · {selectedStore.unit || "위치 확인 전"} · {publication.status === "published"?"등록 점포":"시범 점포"}</span><h2 id="store-modal-title">{selectedStore.name}</h2><p>{selectedStore.description}</p><div className="tag-row">{selectedStore.tags.map((tag) => <span key={tag}>#{tag}</span>)}</div>
        <div className="store-information"><div><span>대표 메뉴·서비스</span><strong>{selectedStore.menu}</strong></div><div><span>가격</span><strong>{selectedStore.price}</strong></div><div><span>추천 점수 예시</span><strong>{selectedStore.aiScore}점</strong></div></div>
        {selectedStore.event && <div className="event-card"><Zap size={19}/><div><small>등록된 홍보 문구 · 진행 여부 확인 필요</small><strong>{selectedStore.event}</strong></div></div>}
        <div className="modal-buttons"><button type="button" className={`save-button ${favorites.includes(selectedStore.id) ? "saved" : ""}`} onClick={() => toggleFavorite(selectedStore.id)}>{favorites.includes(selectedStore.id) ? <Check size={17}/> : <Bookmark size={17}/>} {favorites.includes(selectedStore.id) ? "저장됨" : "즐겨찾기"}</button><button type="button" className="route-button" disabled={!streetNodes.some(n=>n.stores.includes(selectedStore.id))} onClick={() => { focusNode(locateStoreNode(selectedStore.id, streetNodes)); setDetailsOpen(false); mapRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }); }}><LocateFixed size={17}/> 안내도에서 위치 보기</button></div>
        <button type="button" className="modal-guide-button" disabled={!streetNodes.some(n=>n.stores.includes(selectedStore.id))} onClick={() => guideToStore(selectedStore.id)}><Navigation size={16}/> 현재 지점부터 사진 연결 따라가기</button>
        <small className="modal-note"><Info size={13}/> {streetNodes.some(n=>n.stores.includes(selectedStore.id)) ? "상세 위치·영업 현황은 현장 확인이 필요합니다. 실측 길찾기는 제공하지 않습니다." : "이 가게는 촬영 지점과 아직 연결되지 않았습니다. 관리자 지도 편집이 필요합니다."}</small>
      </div></section></div>}
  </div>;
}
