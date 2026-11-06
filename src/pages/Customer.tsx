import { lazy, Suspense, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import {
  ArrowLeft, ArrowRight, ArrowUp, ArrowDown, Bookmark, Camera, Check,
  ChevronRight, Eye, Heart, Info, Layers3, LocateFixed, Map as MapIcon,
  MapPin, Navigation, Search, Sparkles, Store, Utensils, X, Zap, Footprints,
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
import { publicMediaUrl, useMediaDraft } from "../data/mediaStorage";
import { getFacadeAnnotations, type FacadeAnnotation } from "../data/facadeAnnotations";
import CustomerBanner from "../components/CustomerBanner";
import { koreanDate } from "../data/publicPromotions";
import { storesForStreetView, streetStorePage, streetSideView } from "../data/streetViewStores";
import { usePageTab } from "../hooks/usePageTab";
import SiteBrand from "../components/SiteBrand";
import { pageTitle } from "../config/brand";
import SceneBanner from "../components/SceneBanner";
import NextStopCards from "../components/NextStopCards";
import "../styles/ServiceUpgrade.css";
import { cStreetTour, timespaceSite } from "../data/cStreetTour";
import StoreName from "../components/StoreName";
import { splitStoreName } from "../data/storeName";
import { validStorefrontImage } from "../data/storefrontImage";
import "../styles/StreetTour.css";
import { storeMenuItems } from "../data/storeMenuItems";

const filters: FilterType[] = ["전체", "맛", "멋", "이벤트"];
const mapFloors = [1, 2, 3] as const;
const directions: ViewDirection[] = ["forward", "right", "back", "left"];
const directionName: Record<ViewDirection, string> = { forward: "앞", back: "뒤", left: "왼쪽", right: "오른쪽" };
const FAVORITES_KEY = "matmeot-favorites-v1";
const APPROVAL_KEY = "matmeot-approved-promotion";
const StorefrontDirectory = lazy(() => import('../components/StorefrontDirectory'));
const customerViews = ["map", "street", "list"] as const;

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

/** One colour per block, used everywhere a block is shown (map badge, floor list, building buttons). */
const blockColors: Record<string, string> = { "A동": "#2f6fdb", "B동": "#0e9f6e", "C동": "#e8730c", "D동": "#8b5cf6" };
const blockColor = (block: string) => blockColors[block] || "#64748b";
/** Centre of each block's building on timespace-schematic.svg, used when a block has no stores on a floor. */
const blockAnchors: Record<string, {x: number; y: number}> = { "A동": {x: 145, y: 264}, "B동": {x: 185, y: 209}, "C동": {x: 226, y: 155}, "D동": {x: 270, y: 100} };

/** A search typed on the main page arrives as ?q=. */
function readArrivalQuery(): string {
  return new URLSearchParams(window.location.search).get("q")?.trim().slice(0, 50) ?? "";
}

export default function Customer({demoTour = false}: {demoTour?: boolean}) {
  const { tab, openTab } = usePageTab(customerViews, "map");
  const localNodes = useStreetNodes();
  const localGeometry = useMapGeometry();
  const draftStores = useStoreDraft();
  const onlinePublication = usePublicSite(!demoTour);
  const publication = demoTour ? {data:cStreetTour,status:"preview" as const,publishedAt:null} : onlinePublication;
  const sourceNodes = publication.data?.nodes || localNodes;
  const sourceGeometry = publication.data?.geometry || localGeometry;
  const sourceCatalog = publication.data?.stores || (publication.status === "preview" ? draftStores : examples);
  // Until an admin publishes the C-block points, the older publication is test data (sample stores and
  // test photos). Show the photographed C-block stores and street, the same data as /street-demo.
  const usesCStreet = !demoTour && !sourceNodes.some(node => node.id === "c-entry");
  const streetNodes = usesCStreet ? cStreetTour.nodes : sourceNodes;
  const geometry = usesCStreet ? timespaceSite.geometry : sourceGeometry;
  const catalog = usesCStreet ? timespaceSite.stores : sourceCatalog;
  const {urls: draftUrls} = useDraftPhotoUrls();
  const mediaDraft = useMediaDraft();
  const media = demoTour ? undefined : publication.status === "published" ? publication.data?.media : mediaDraft;
  const mapBackground = demoTour ? "" : publication.status === "published"
    ? publicMediaUrl(media?.map)
    : (draftUrls[MAP_BG_KEY] || publicMediaUrl(media?.map));
  const photoFor = (nodeId: string, view: ViewDirection) => {
    if (demoTour) return "";
    const key = photoKey(nodeId, view);
    const remote = publicMediaUrl(media?.photos[key]);
    return publication.status === "published" ? remote : (draftUrls[key] || remote);
  };
  const hasPhoto = (nodeId: string, view: ViewDirection) => Boolean(photoFor(nodeId,view) || streetNodes.find(n => n.id===nodeId)?.views[view]);
  const [floor, setFloor] = useState<1 | 2 | 3>(1);
  const [listFloor, setListFloor] = useState<"전체" | 1 | 2 | 3>("전체");
  // On phones the map zooms into the shopping area so badges stay readable.
  const [narrowMap, setNarrowMap] = useState(() => window.matchMedia("(max-width: 600px)").matches);
  useEffect(() => {
    const query = window.matchMedia("(max-width: 600px)");
    const update = () => setNarrowMap(query.matches);
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);
  const [building, setBuilding] = useState("전체");
  const [routeTargetId, setRouteTargetId] = useState<number | null>(null);
  const [approvedPromotion, setApprovedPromotion] = useState<ApprovedPromotionData | null>(readApproved);
  const [favorites, setFavorites] = useState<number[]>(readFavorites);
  const [currentNodeId, setCurrentNodeId] = useState("c-entry");
  const [currentView, setCurrentView] = useState<ViewDirection>("forward");
  const [lookSide, setLookSide] = useState<"left" | "right" | null>(null);
  const [streetCatalogOpen, setStreetCatalogOpen] = useState(false);
  const [photoSize, setPhotoSize] = useState<{src: string; width: number; height: number} | null>(null);
  const [storePaging, setStorePaging] = useState({ context: "", page: 0 });
  const [photoTravel, setPhotoTravel] = useState<{ previous: string; kind: "forward" | "left" | "right"; stamp: number } | null>(null);
  const travelTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const travelSerial = useRef(0);
  const arrivalSearch = useRef(readArrivalQuery());
  const [filter, setFilter] = useState<FilterType>("전체");
  const [query, setQuery] = useState(readArrivalQuery);
  const [onlySaved, setOnlySaved] = useState(false);
  const [selectedStoreId, setSelectedStoreId] = useState<number | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [showDiscoveries, setShowDiscoveries] = useState(false);
  const [mapVisualMode, setMapVisualMode] = useState<"schematic" | "uploaded">("schematic");
  const [draftFacades, setDraftFacades] = useState<FacadeAnnotation[]>(getFacadeAnnotations);
  const facades: FacadeAnnotation[] = usesCStreet ? cStreetTour.facades : publication.data?.facades || draftFacades;
  const explorerRef = useRef<HTMLElement>(null);
  const mapRef = useRef<HTMLElement>(null);
  const modalRef = useRef<HTMLElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const streetStoresRef = useRef<HTMLDivElement>(null);
  const lastSideRef = useRef<"left" | "right">("left");

  useEffect(() => { document.title = pageTitle("customer"); }, []);
  useEffect(() => () => { if (travelTimer.current) clearTimeout(travelTimer.current); }, []);
  useEffect(() => {
    if (!detailsOpen) return;
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const oldOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    modalRef.current?.querySelector<HTMLButtonElement>('.modal-close')?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { setDetailsOpen(false); return; }
      if (event.key !== 'Tab') return;
      const controls = Array.from(modalRef.current?.querySelectorAll<HTMLElement>('button:not([disabled]), a[href], [tabindex="0"]') || []).filter(el => el.getClientRects().length);
      const first=controls[0],last=controls[controls.length-1];
      if(event.shiftKey&&document.activeElement===first){event.preventDefault();last?.focus();}
      else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus();}
    };
    document.addEventListener('keydown',onKey);
    return()=>{document.body.style.overflow=oldOverflow;document.removeEventListener('keydown',onKey);if(previous?.isConnected)previous.focus();else document.querySelector<HTMLButtonElement>('.desktop-nav button[aria-current="page"]')?.focus();};
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
    const localDate = koreanDate();
    const current = store.eventUntil && store.eventUntil < localDate ? {...store,event:undefined} : store;
    if (publication.data || approvedPromotion?.storeId !== store.id) return current;
    return { ...current, event: approvedPromotion.promotion.streetCopy };
  }), [catalog, approvedPromotion, publication.data]);
  // Timespace always has blocks A-D; keep them visible even before stores are registered there.
  const buildings = useMemo(() => [...new Set(["A동", "B동", "C동", "D동", ...effectiveStores.map(store => store.building.trim()).filter(Boolean)])].sort((a,b) => a.localeCompare(b, "ko")), [effectiveStores]);
  const selectedStore = effectiveStores.find((store) => store.id === selectedStoreId) || null;
  const routeTarget = effectiveStores.find(store => store.id === routeTargetId) || null;
  const routePath = useMemo(() => routeTarget ? findStorePhotoRoute(currentNodeId, routeTarget.id, streetNodes) : null,
    [routeTarget, currentNodeId, streetNodes]);
  const routeNextId = routePath && routePath.length > 1 ? routePath[1] : null;
  const routeNextConnection = streetNodes.find(node => node.id === currentNodeId)?.connections.find(link => link.to === routeNextId);
  const currentNode = streetNodes.find((node) => node.id === currentNodeId) || streetNodes[0];
  const currentImage = photoFor(currentNodeId, currentView) || currentNode.views[currentView];
  const nextPhotoLink = currentNode.connections.find(link => link.direction === currentView);
  const matchingStores = useMemo(() => effectiveStores.filter((store) =>
    matchStore(store, filter, query) && store.floor === floor && (building === "전체" || store.building === building) && (!onlySaved || favorites.includes(store.id))),
  [effectiveStores, filter, query, onlySaved, favorites, floor, building]);
  // The map follows the selected floor, but the results list covers every floor so nothing looks missing.
  const allFloorResults = useMemo(() => effectiveStores
    .filter((store) => matchStore(store, filter, query) && (building === "전체" || store.building === building) && (!onlySaved || favorites.includes(store.id)))
    .sort((a, b) => a.floor - b.floor || a.building.localeCompare(b.building, "ko") || a.id - b.id),
  [effectiveStores, filter, query, onlySaved, favorites, building]);
  // The list can be narrowed to one floor; "전체" shows every floor under its own heading.
  const resultStores = useMemo(() => allFloorResults.filter(store => listFloor === "전체" || store.floor === listFloor), [allFloorResults, listFloor]);
  const resultFloors = [...new Set(resultStores.map(store => store.floor))];
  // Stores on the selected floor/block (used to decide which photo points to show).
  const floorStores = useMemo(() => effectiveStores
    .filter(store => store.floor === floor && (building === "전체" || store.building === building))
    .sort((a,b) => a.id - b.id), [effectiveStores, floor, building]);
  // Data source note: shown at the top of the list/street tabs and inside the map's single note.
  const siteDataNote = demoTour ? "직접 촬영한 C동 거리 · 메뉴·가격·영업 여부는 현장 확인 필요 · 지도 좌표는 임시 배치" : usesCStreet ? "직접 촬영한 C동 거리와 간판 사진·공개 주소로 확인한 A~D동 1~3층 가게 · 메뉴·가격·영업 여부는 현장 확인 필요 · 지도 위치는 개념도 배치" :publication.status === "published" ? `게시된 점포 데이터 · ${publication.publishedAt ? new Date(publication.publishedAt).toLocaleDateString("ko-KR") : ""} 갱신 · 영업 현황은 점포 확인 필요` : publication.status === "loading" ? "게시된 점포 정보를 불러오는 중입니다. 현재 시연 데이터가 표시될 수 있어요." : publication.status === "offline" ? "서버 연결에 실패해 시연용 점포 정보를 표시하고 있습니다. 실제 영업 정보로 사용하지 마세요." : publication.status === "preview" ? "관리자 초안 미리보기 · 이 브라우저에서 수정한 가게·위치 정보" : "시연용 점포·이벤트 데이터 · 실제 영업 정보가 아닙니다.";
  const storePoint = (store: StoreData) => geometry.stores[String(store.id)] ||
    (publication.status === "published" ? null : geometry.nodes[locateStoreNode(store.id, streetNodes)]) || null;
  // Map badges: one per block on this floor, at the centre of its stores, ignoring the block filter
  // so other blocks stay reachable from the map.
  const blockBadges = (() => {
    const groups = new Map<string, {count: number; x: number; y: number; event: boolean}>();
    for (const store of effectiveStores) {
      if (store.floor !== floor || !matchStore(store, filter, query) || (onlySaved && !favorites.includes(store.id))) continue;
      const point = storePoint(store);
      if (!point) continue;
      const group = groups.get(store.building) || {count: 0, x: 0, y: 0, event: false};
      groups.set(store.building, {count: group.count + 1, x: group.x + point.x, y: group.y + point.y, event: group.event || Boolean(store.event)});
    }
    const badges = [...groups].map(([name, group]) => ({building: name, count: group.count, x: Math.round(group.x / group.count), y: Math.round(group.y / group.count), event: group.event}));
    // Every block keeps a (muted) badge so the map always names A~D, even on floors without its stores.
    for (const [name, anchor] of Object.entries(blockAnchors)) if (!groups.has(name)) badges.push({building: name, count: 0, ...anchor, event: false});
    return badges;
  })();
  // Photo nodes have no floor field in the current data model. Show a shared photo node
  // only when it is linked to at least one store on the selected floor.
  const floorPhotoNodes = useMemo(() => streetNodes.filter(node =>
    node.stores.some(id => floorStores.some(store => store.id === id))), [streetNodes, floorStores]);
  // Photographed street points on the map (street photos are taken at ground level, so they show on every floor).
  const mappedPhotoNodes = streetNodes.filter(node => directions.some(view => hasPhoto(node.id, view)) && Boolean(geometry.nodes[node.id]));
  // The street view always starts at the first photographed point (today: C동 거리 입구).
  const streetStartNode = mappedPhotoNodes[0] || streetNodes.find(node => directions.some(view => hasPhoto(node.id, view)));
  // Map band along each photographed connection, e.g. C동 거리 입구 -> C동 거리.
  // The last point's forward photo looks further down the street, so the band continues past it.
  const photoStreetSegments = mappedPhotoNodes.flatMap(node => node.connections
    .filter(connection => mappedPhotoNodes.some(other => other.id === connection.to))
    .map(connection => {
      const a = geometry.nodes[node.id], b = geometry.nodes[connection.to];
      const continues = mappedPhotoNodes.find(other => other.id === connection.to)?.connections.some(next => mappedPhotoNodes.some(other => other.id === next.to));
      const end = continues ? b : {x: Math.round(b.x + (b.x - a.x) * 0.9), y: Math.round(b.y + (b.y - a.y) * 0.9)};
      return [a, end];
    }));
  const featuredStores = useMemo(() => effectiveStores.filter((store) => Boolean(store.event)), [effectiveStores]);
  const activeFacades = facades.filter((a) => a.nodeId === currentNodeId && a.view === currentView &&
    effectiveStores.some((s) => s.id === a.storeId));
  const storeView = lookSide ? streetSideView(currentView, lookSide) : currentView;
  const showSideControls = currentImage && (hasPhoto(currentNodeId, "back") || ["left", "right"].some(side => currentNode.viewStores?.[side as ViewDirection] !== undefined));
  const spotlightStores = useMemo(() =>
    storesForStreetView(matchingStores, facades, currentNodeId, storeView, currentNode.viewStores?.[storeView]),
  [matchingStores, facades, currentNodeId, storeView, currentNode.viewStores]);
  const pagingContext = `${currentNodeId}:${currentView}:${lookSide || "straight"}:${spotlightStores.map(store => store.id).join(",")}`;
  const storePage = streetStorePage(spotlightStores, storePaging.context === pagingContext ? storePaging.page : 0);
  const openStreetSide = (side: "left" | "right") => {
    setStreetCatalogOpen(false);
    lastSideRef.current = side;
    setLookSide(side);
    setSelectedStoreId(null);
    window.requestAnimationFrame(() => streetStoresRef.current?.focus({preventScroll:true}));
  };
  const openStreetCatalog = () => {
    setStreetCatalogOpen(true);
    setLookSide(null);
    setSelectedStoreId(null);
    window.requestAnimationFrame(() => streetStoresRef.current?.focus({preventScroll:true}));
  };
  const returnToStreetPhoto = () => {
    setStreetCatalogOpen(false);
    setLookSide(null);
    window.requestAnimationFrame(() => (document.querySelector<HTMLButtonElement>(`.street-side-actions button[data-side="${lastSideRef.current}"]`) || document.querySelector<HTMLButtonElement>(".street-catalog-entry"))?.focus({preventScroll:true}));
  };
  const turnStorePage = (page: number) => setStorePaging({ context: pagingContext, page });
  const hasStoreFilter = tab === "list" || Boolean(query.trim() || onlySaved || filter !== "전체" || showDiscoveries);

  const jumpToExplorer = () => explorerRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  const animatePhoto = (kind: "forward" | "left" | "right") => {
    if (travelTimer.current) clearTimeout(travelTimer.current);
    if (!currentImage || window.matchMedia("(prefers-reduced-motion: reduce)").matches) { setPhotoTravel(null); return; }
    setPhotoTravel({ previous: currentImage, kind, stamp: ++travelSerial.current });
    travelTimer.current = setTimeout(() => setPhotoTravel(null), 420);
  };
  const focusNode = (nodeId: string, preferred: ViewDirection = "forward", showStreet = true) => {
    if (nodeId !== currentNodeId && showStreet) animatePhoto("forward");
    setStreetCatalogOpen(false);
    setCurrentNodeId(nodeId);
    setLookSide(null);
    setSelectedStoreId(null);
    if (showStreet) openTab("street");
    if (hasPhoto(nodeId,preferred)) { setCurrentView(preferred); return; }
    const next=directions.find(d=>hasPhoto(nodeId,d));
    setCurrentView(next || firstAvailableView(nodeId, streetNodes, preferred));
  };
  const openStreetView = () => {
    if (!streetStartNode) return;
    focusNode(streetStartNode.id, "forward");
    window.requestAnimationFrame(() => document.querySelector(".street-panel")?.scrollIntoView({behavior: "smooth", block: "start"}));
  };
  const changeView = (direction: ViewDirection) => {
    if (!hasPhoto(currentNodeId,direction)) return;
    const turn = (directions.indexOf(direction) - directions.indexOf(currentView) + 4) % 4;
    if (turn) animatePhoto(turn === 3 ? "left" : "right");
    setCurrentView(direction); setSelectedStoreId(null);
  };
  const focusStore = (storeId: number, openDetails = false) => {
    const visibleFacade = facades.find(item => item.storeId === storeId && item.nodeId === currentNodeId && item.view === currentView);
    const linked = (visibleFacade && streetNodes.find(node => node.id === visibleFacade.nodeId)) ||
      streetNodes.find(node => Object.values(node.viewStores || {}).some(ids => ids.includes(storeId))) ||
      streetNodes.find(node => node.stores.includes(storeId));
    if (linked) openTab("street");
    if (linked && !visibleFacade && !spotlightStores.some(store => store.id === storeId) && !(linked.id === currentNodeId && currentNode.viewStores?.[currentView]?.includes(storeId))) {
      const annotation = facades.find(item => item.storeId === storeId && item.nodeId === linked.id);
      const cardView = directions.find(view => linked.viewStores?.[view]?.includes(storeId));
      const preferred = annotation?.view || cardView || "forward";
      const heading = hasPhoto(linked.id, preferred) ? preferred : directions.find(view => hasPhoto(linked.id, view)) || "forward";
      focusNode(linked.id, heading);
      if (cardView && cardView !== heading) setLookSide((["left", "right"] as const).find(side => streetSideView(heading, side) === cardView) || null);
    }
    setSelectedStoreId(storeId);
    const chosen = effectiveStores.find((s) => s.id === storeId);
    if (chosen) { setFloor(chosen.floor); setBuilding(previous => previous === "전체" ? "전체" : chosen.building); }
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
  const chooseFloor = (nextFloor: 1 | 2 | 3) => {
    setFloor(nextFloor);
    setSelectedStoreId(null);
    setRouteTargetId(null);
    setDetailsOpen(false);
    // Select a photo point linked with the chosen floor when possible.
    // Higher floors may still reference a ground-level exterior photo.
    const storesOnFloor = effectiveStores.filter(store => store.floor === nextFloor &&
      (building === "전체" || store.building === building));
    const linkedNodes = streetNodes.filter(node => node.stores.some(id => storesOnFloor.some(store => store.id === id)));
    if (linkedNodes.length && !linkedNodes.some(node => node.id === currentNodeId)) focusNode(linkedNodes[0].id, "forward", false);
  };
  const toggleFavorite = (storeId: number) => {
    setFavorites((previous) => {
      const updated = previous.includes(storeId) ? previous.filter((id) => id !== storeId) : [...previous, storeId];
      localStorage.setItem(FAVORITES_KEY, JSON.stringify(updated));
      return updated;
    });
  };
  const pickRecommended = () => {
    const candidate = resultStores.find(store => store.event) || resultStores[0];
    if (candidate) focusStore(candidate.id, true);
  };
  const searchFromBanner = (nextFilter: FilterType, nextQuery: string) => {
    openTab("list");
    const searchUrl = new URL(window.location.href);
    if (nextQuery.trim()) searchUrl.searchParams.set("q", nextQuery.trim()); else searchUrl.searchParams.delete("q");
    window.history.replaceState({}, "", searchUrl);
    const results = effectiveStores.filter(store => matchStore(store, nextFilter, nextQuery));
    setFilter(nextFilter);
    setQuery(nextQuery);
    setOnlySaved(false);
    setShowDiscoveries(false);
    setBuilding("전체");
    setSelectedStoreId(null);
    setRouteTargetId(null);
    setDetailsOpen(false);
    // Start on a floor with results so a cafe/shop on another floor is visible.
    const result = results.find(store => store.floor === floor) || results[0];
    if (result) chooseFloor(result.floor);
    jumpToExplorer();
  };
  // Runs once, after published stores load, so the floor is chosen from the real results.
  useEffect(() => {
    if (!arrivalSearch.current || publication.status === "loading") return;
    const arrivalQuery = arrivalSearch.current;
    arrivalSearch.current = "";
    searchFromBanner("전체", arrivalQuery);
    resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  });
  const openBannerStore = (storeId: number) => {
    setFilter("전체");
    setQuery("");
    setOnlySaved(false);
    setShowDiscoveries(false);
    setBuilding("전체");
    setRouteTargetId(null);
    focusStore(storeId, true);
  };

  return <div className="app-shell">
    <header className="top-navigation">
      <button className="brand" type="button" onClick={() => { setShowDiscoveries(false); openTab("map"); window.scrollTo({ top: 0, behavior: "smooth" }); }} aria-label="맛앤멋 AI Street 처음으로">
        <SiteBrand role="customer" />
      </button>
      <nav className="desktop-nav" aria-label="주요 메뉴">
        <button className={`nav-item ${tab === "map" ? "active" : ""}`} type="button" aria-current={tab === "map" ? "page" : undefined} onClick={() => openTab("map")}>거리 탐색</button>
        <button className={`nav-item ${tab === "street" ? "active" : ""}`} type="button" aria-current={tab === "street" ? "page" : undefined} onClick={() => openTab("street")}>거리 사진</button>
        <button className={`nav-item ${tab === "list" ? "active" : ""}`} type="button" aria-current={tab === "list" ? "page" : undefined} onClick={() => openTab("list")}>가게 목록</button>
      </nav>
      <span className="location-pill"><MapPin size={15} /> 송도 타임스페이스 <span className="demo-dot">시범 구역</span></span>
    </header>

    <main className="page">
      {demoTour && <div className="street-tour-preview-note"><Camera size={18}/><div><strong>C동 실제 촬영 미리보기</strong><span>거리뷰 보기를 켜고 지도 발자국을 눌러 보세요. 지도 위치는 임시 배치이며 운영 데이터는 변경하지 않습니다.</span></div><button type="button" onClick={()=>{setFloor(1);setBuilding("전체");focusNode("c-entry");}}>입구부터 둘러보기 <ArrowRight size={16}/></button></div>}
      {tab === "map" && !demoTour && <CustomerBanner
        stores={effectiveStores.filter(store => matchStore(store, filter, query))}
        published={publication.status === "published"} filter={filter} query={query}
        onQueryChange={value => { setQuery(value); setShowDiscoveries(false); }}
        onSearch={searchFromBanner} onSelectStore={openBannerStore}
      />}

      {tab === "street" && !demoTour && <div className="customer-photo-heading scene-context-banner scene-context-customer"><SceneBanner scene="photo" /><div><span className="eyebrow">STREET PHOTO</span><h1>사진으로 걷는 우리 동네</h1><p>방향을 돌려 가게를 찾고, 다음 사진으로 걸어가 보세요.</p></div></div>}

      {tab === "list" && <header className="service-directory-heading"><span className="service-kicker">ONE NEIGHBORHOOD, MANY DISCOVERIES</span><h1>오늘은 어떤 가게를 만나볼까요?</h1><p>층을 넘나들며, 나에게 맞는 맛과 멋을 찾아보세요.</p></header>}
      <section className="explore-section" ref={explorerRef} id="explore" aria-label="가게 및 거리 탐색">
        {tab !== "map" && <div className="site-data-status" role="status">{siteDataNote}</div>}
        <div className="explore-toolbar">
          <label className="search-field"><Search size={19}/><input value={query} onChange={(event) => { setQuery(event.target.value); setShowDiscoveries(false); }} placeholder="가게 이름·업종·키워드 검색" aria-label="전체 가게 검색"/>{query && <button type="button" className="clear-search" onClick={() => setQuery("")} aria-label="검색어 지우기"><X size={15}/></button>}</label>
          <div className="filter-buttons" role="group" aria-label="가게 필터">
            {filters.map((item) => <button key={item} type="button" className={`filter-chip ${filter === item ? "selected" : ""} type-${item === "전체" ? "all" : item === "맛" ? "food" : item === "멋" ? "style" : "event"}`} onClick={() => { setFilter(item); setShowDiscoveries(item === "이벤트"); }} aria-pressed={filter === item}>
              {item === "맛" ? <Utensils size={15}/> : item === "멋" ? <Camera size={15}/> : item === "이벤트" ? <Zap size={15}/> : <Layers3 size={15}/>} {item}
            </button>)}
            <button type="button" className={`filter-chip saved-filter ${onlySaved ? "selected" : ""}`} onClick={() => { setOnlySaved((p) => !p); setShowDiscoveries(false); }} aria-pressed={onlySaved}><Heart size={15} fill={onlySaved ? "currentColor" : "none"}/> 저장한 가게 {favorites.length > 0 && <span className="saved-count">{favorites.length}</span>}</button>
          </div>
        </div>


        {tab !== "map" && <div className="building-selector" role="group" aria-label="건물별 점포 보기">
          <div className="building-selector-label"><Store size={16}/><strong>건물별 보기</strong><small>등록된 건물 정보 기준</small></div>
          <div className="building-selector-options">
            {["전체", ...buildings].map(item => <button key={item} type="button" className={building===item ? "selected" : ""} onClick={() => { setBuilding(item); setSelectedStoreId(null); setRouteTargetId(null); }} aria-pressed={building===item} style={item === "전체" ? undefined : {"--block-color": blockColor(item)} as CSSProperties}>{item !== "전체" && <i className="block-dot" aria-hidden="true"/>}{item === "전체" ? "전체 건물" : item} <span>{item === "전체" ? effectiveStores.length : effectiveStores.filter(store => store.building === item).length}</span></button>)}
          </div>
        </div>}
        {routeTarget && <div className="route-guide" role="status" aria-live="polite">
          <div className="route-guide-top"><div><span className="route-guide-kicker"><Navigation size={15}/> 촬영 지점 연결 안내 · 실측 길찾기 아님</span>
            <strong>{routeTarget.name} <span>· {routeTarget.building} {routeTarget.floor}층 {routeTarget.unit || ""}</span></strong>
          </div><button type="button" className="route-stop" onClick={() => setRouteTargetId(null)} aria-label="촬영 지점 안내 종료"><X size={17}/> 종료</button></div>
          {!routePath ? <p>현재 지점에서 이 가게가 연결된 촬영 지점까지 이어지는 경로가 없어요. 관리자에서 촬영 지점 연결을 확인해야 합니다.</p>
            : routePath.length === 1 ? <p><Check size={15}/> 이 가게와 연결된 촬영 지점에 도착했어요. {routeTarget.floor > 1 ? `${routeTarget.floor}층의 실제 출입구와 이동 동선은 현장 확인이 필요합니다.` : "사진에서 외관과 위치를 확인해 주세요."}</p>
            : <><p>등록된 촬영 지점 기준 <strong>{routePath.length - 1}번 이동</strong> · {routePath.map(id => streetNodes.find(node=>node.id===id)?.name ?? "?").join(" → ")}</p>
              <button type="button" className="route-next" onClick={moveAlongRoute}><Navigation size={16}/> 다음 촬영 지점 · {streetNodes.find(node=>node.id===routeNextId)?.name} 보기 <ArrowRight size={15}/></button></>}
          <small>사진 지점 간 연결만 안내합니다. 실제 도보 길이·시간·건물 출입구·계단/엘리베이터 접근성은 확인되지 않았습니다.</small>
        </div>}
        {showDiscoveries && <div className="discovery-banner"><Zap size={17}/><div><strong>오늘의 발견 · 시연용 이벤트</strong><span>등록된 홍보 문구를 지도에서 강조해 보여줘요. 실제 행사 진행 여부는 점포에 확인해야 합니다.</span></div><button type="button" onClick={() => { setShowDiscoveries(false); setFilter("전체"); }} aria-label="오늘의 발견 닫기"><X size={17}/></button></div>}

        <div className="explore-layout">
          <section className="map-panel" ref={mapRef} aria-label="구역 안내도" hidden={tab !== "map"}>
            <div className="panel-header"><div><span className="panel-eyebrow">INTERACTIVE MAP</span><h3><MapIcon size={19}/> 타임스페이스 {floor}층 상권 안내</h3></div></div>
            {mapBackground && <div className="map-visual-switch" role="group" aria-label="지도 배경 선택">
              <button type="button" className={mapVisualMode === "schematic" ? "selected" : ""} aria-pressed={mapVisualMode === "schematic"} onClick={() => setMapVisualMode("schematic")}>간편 안내도</button>
              <button type="button" className={mapVisualMode === "uploaded" ? "selected" : ""} aria-pressed={mapVisualMode === "uploaded"} onClick={() => setMapVisualMode("uploaded")}>관리자 등록 지도</button>
            </div>}
            <div className="map-floor-layout">
              <div className="district-map district-map-concept">
              <svg viewBox={narrowMap ? "78 30 344 344" : "0 0 500 374"} className="map-svg" role="group" aria-label={`송도 타임스페이스 ${floor}층 상권 개념도, 클릭 가능한 촬영 지점과 ${floor}층 점포 표시`}>
                <image href={mapVisualMode === "uploaded" && mapBackground ? mapBackground : "/brand/timespace-schematic.svg"} x="0" y="0" width="500" height="374" preserveAspectRatio="none"/>
                {geometry.passages.map((path,i)=>path.length>=2?<polyline key={`passage${i}`} points={path.map(p=>`${p.x},${p.y}`).join(" ")} fill="none" stroke="#13a99e" strokeWidth="4" strokeDasharray="9 6" strokeLinecap="round" pointerEvents="none"/>:null)}
                {geometry.boundary.length >= 3 && <polygon points={geometry.boundary.map(p=>`${p.x},${p.y}`).join(" ")} fill="#f59e0b14" stroke="#ea580c" strokeWidth="3" strokeDasharray="9 6" pointerEvents="none"/>}
                {routePath && routePath.length > 1 && routePath.every(id => Boolean(geometry.nodes[id])) && <polyline className="photo-route-line" points={routePath.map(id => { const p=geometry.nodes[id]; return `${p.x},${p.y}`; }).join(" ")} fill="none" stroke="#2563eb" strokeWidth="5" strokeLinejoin="round" strokeLinecap="round" strokeDasharray="7 5" pointerEvents="none"/>}
                {photoStreetSegments.length > 0 && <g className="map-photo-street" role="button" tabIndex={0} aria-label={`거리 사진이 있는 길 · ${streetStartNode?.name || ""}부터 거리뷰 보기`} onClick={openStreetView} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); openStreetView(); } }}>
                  {photoStreetSegments.map(([a, b], i) => <line key={i} x1={a.x} y1={a.y} x2={b.x} y2={b.y} className="map-photo-street-halo"/>)}
                  {photoStreetSegments.map(([a, b], i) => <line key={`s${i}`} x1={a.x} y1={a.y} x2={b.x} y2={b.y} className="map-photo-street-line"/>)}
                </g>}
                {/* Footprints only mark where street photos were taken; the 거리뷰 보기 button and the green street open them. */}
                {mappedPhotoNodes.map((node) => { const p = geometry.nodes[node.id]; return <g key={node.id} className={`map-node ${currentNodeId === node.id ? "is-active" : ""}`} aria-hidden="true">
                    <circle cx={p.x} cy={p.y} r={currentNodeId === node.id ? "8" : "6.5"} className="map-node-dot"/>
                  </g>; })}
                {/* One badge per block instead of a numbered pin per store; the block's stores are listed on the right. */}
                {blockBadges.filter(badge => !(selectedStore && selectedStore.floor === floor && selectedStore.building === badge.building && storePoint(selectedStore))).map(badge => { const active = building === badge.building; const toggle = () => { setBuilding(active ? "전체" : badge.building); setSelectedStoreId(null); setRouteTargetId(null); };
                  if (!badge.count) return <g key={badge.building} className="map-block-badge is-empty" aria-hidden="true"><rect x={badge.x - 22} y={badge.y - 11} width="44" height="22" rx="11" className="map-block-badge-chip" style={{stroke: blockColor(badge.building)}}/><text x={badge.x} y={badge.y + 4} className="map-block-badge-text" style={{fill: blockColor(badge.building)}}>{badge.building}</text></g>;
                  return <g key={badge.building} className={`map-block-badge ${active ? "is-active" : ""}`} role="button" tabIndex={0} aria-pressed={active} aria-label={`${badge.building} ${floor}층 가게 ${badge.count}곳 ${active ? "전체 보기로 돌아가기" : "만 보기"}`} onClick={toggle} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); toggle(); } }}>
                    <rect x={badge.x - 30} y={badge.y - 12} width="60" height="24" rx="12" className="map-block-badge-chip" style={{fill: blockColor(badge.building)}}/><text x={badge.x} y={badge.y + 4} className="map-block-badge-text">{badge.building} {badge.count}곳</text>{badge.event && <circle cx={badge.x + 27} cy={badge.y - 10} r="5" fill="#eab308" stroke="white" strokeWidth="2"/>}
                  </g>; })}
                {selectedStore && selectedStore.floor === floor && (() => { const point = storePoint(selectedStore); if (!point) return null; const [pinName] = splitStoreName(selectedStore.name); const label = pinName.length > 13 ? `${pinName.slice(0, 12)}…` : pinName; const width = Math.max(56, label.length * 10 + 22);
                  return <g className="map-store-marker is-active" role="button" tabIndex={0} aria-label={`${selectedStore.name} 상세 보기`} onClick={() => focusStore(selectedStore.id, true)} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); focusStore(selectedStore.id, true); } }}>
                    <path d={`M${point.x} ${point.y} l-6 -9 h12 z`} className={`map-store-chip ${selectedStore.type === "맛" ? "food" : "style"}`}/><rect x={point.x - width / 2} y={point.y - 33} width={width} height="24" rx="12" className={`map-store-chip ${selectedStore.type === "맛" ? "food" : "style"}`}/><text x={point.x} y={point.y - 17} className="map-store-text map-store-name">{label}</text>
                  </g>; })()}
              </svg>
              <div className="map-legend"><span><i className="legend-photo-street"/>초록 길 · 거리 사진 (누르면 보기)</span><span><i className="legend-block"/>동별 가게 · 누르면 그 동만</span>{routePath && routePath.length > 1 && <span><i className="legend-photo-route"/>사진 지점 안내</span>}</div>
              </div>
              <aside className="map-floor-sidebar" aria-label="층 및 점포 지점 선택">
                <div className="map-floor-heading"><Layers3 size={16}/><strong>층 선택</strong></div>
                <div className="map-floor-buttons" role="group" aria-label="층별 안내도 선택">
                  {mapFloors.map(n => <button key={n} type="button" className={floor === n ? "selected" : ""} aria-pressed={floor === n} onClick={() => chooseFloor(n)}>
                    <strong>{n}층</strong><small>{effectiveStores.filter(store => store.floor === n && (building === "전체" || store.building === building)).length}곳</small>
                  </button>)}
                </div>
                <div className="map-street-view-box"><button type="button" onClick={openStreetView} disabled={!streetStartNode}><Footprints size={26}/><span><strong>거리뷰 보기</strong>{streetStartNode && <small>{streetStartNode.name}부터 시작</small>}</span></button></div>
                <div className="map-floor-point-heading"><strong>{floor}층 가게</strong><span>{matchingStores.length}곳</span></div>
                <div className="map-floor-points">
                  {matchingStores.length ? [...new Set(matchingStores.map(store => store.building))].sort((a, b) => a.localeCompare(b, "ko")).map(block => <div key={block} className="map-floor-group">
                    <p className="map-floor-group-title"><b><i className="block-dot" style={{background: blockColor(block)}} aria-hidden="true"/>{block}</b><span>{matchingStores.filter(store => store.building === block).length}곳</span></p>
                    {matchingStores.filter(store => store.building === block).map(store => <button key={store.id} type="button" className={selectedStoreId === store.id ? "active" : ""} onClick={() => focusStore(store.id)} aria-label={`${store.name} · ${store.type} · ${block} ${floor}층 ${store.unit || ""}`}>
                      <span className={`map-floor-type ${store.type === "맛" ? "food" : "style"}`} aria-hidden="true">{store.type === "맛" ? <Utensils size={13}/> : <Camera size={13}/>}</span><span className="map-floor-store-name"><StoreName name={store.name}/></span>{store.unit && <small className="map-floor-unit">{store.unit}</small>}
                    </button>)}
                  </div>) : <p className="map-floor-empty">이 층에 표시할 점포가 없어요.</p>}
                </div>
              </aside>
            </div>
            <details className="map-disclaimer"><summary><Info size={14}/> 지도는 개념도예요 · 메뉴·가격·영업은 현장에서 확인해 주세요</summary><p>{siteDataNote} {floor}층 점포만 표시합니다. 촬영 지점은 연결된 건물 외관 사진일 수 있으며 실제 층별 실내 촬영 위치와 다를 수 있습니다. 간편 안내도의 건물 형태·구역명 및 점포·촬영 지점 좌표는 시연용입니다. 관리자 등록 지도와 배치가 다를 수 있으며 실측 길찾기 용도가 아닙니다. {currentSurface()==="legacy" && <a href={appUrl("editor","/map-editor")}> 전체 지도 편집 도구</a>}</p></details>
          </section>

          <section className="street-panel" aria-label="실제 거리 사진" hidden={tab !== "street"}>
            <div className="panel-header"><div><span className="panel-eyebrow">STREET PHOTO</span><h3><Eye size={19}/> {currentNode.name} · {directionName[currentView]} 방향</h3></div><span className={`photo-badge ${currentImage ? "is-ready" : ""}`}>{currentImage ? "촬영 사진" : "촬영 준비"}</span></div>
            <div className="node-quicklinks street-photo-points" role="group" aria-label="거리 사진 촬영 지점 선택">{floorPhotoNodes.map(node => <button key={node.id} type="button" className={currentNodeId === node.id ? "active" : ""} aria-pressed={currentNodeId === node.id} onClick={() => focusNode(node.id)}><span aria-hidden="true"><Footprints size={13}/></span>{node.name}</button>)}</div>
            <div className={`street-view-layout ${lookSide || streetCatalogOpen ? "is-showing-stores" : ""}`}><div className="street-view-photo" hidden={lookSide !== null || streetCatalogOpen}>
            <div className={`street-image ${currentImage ? "has-photo" : "is-placeholder"} ${photoTravel ? "is-travelling" : ""}`} style={{"--street-photo-ratio": photoSize && photoSize.src === currentImage ? photoSize.width / photoSize.height : 3 / 4} as CSSProperties}>
              {currentImage ? <img src={currentImage} alt={`${currentNode.name}에서 바라본 ${directionName[currentView]} 방향 실제 거리 사진`} className="street-photo" onLoad={event=>{const image=event.currentTarget;if(image.naturalWidth&&image.naturalHeight)setPhotoSize({src:currentImage,width:image.naturalWidth,height:image.naturalHeight});}}/> : <div className="street-empty"><Camera size={42}/><strong>이 방향의 사진을 준비 중이에요</strong><span>촬영 후 사진을 등록하면 이곳에 표시됩니다.</span></div>}
              {currentImage && activeFacades.length > 0 && <svg className="facade-overlay" viewBox="0 0 100 100" preserveAspectRatio="none" aria-label="사진 속 가게 영역">
                {activeFacades.map((item) => <polygon key={`${item.nodeId}-${item.view}-${item.storeId}`} points={item.points.map((p) => `${p.x},${p.y}`).join(" ")} className={selectedStoreId === item.storeId ? "facade-polygon active" : "facade-polygon"} onClick={() => focusStore(item.storeId)}><title>{effectiveStores.find((s) => s.id === item.storeId)?.name || "가게"} 영역</title></polygon>)}
              </svg>}
              {photoTravel && <img key={photoTravel.stamp} src={photoTravel.previous} className={`street-travel-layer travel-${photoTravel.kind}`} alt="" aria-hidden="true"/>}
              {nextPhotoLink && <button className="street-step-next" type="button" onClick={() => focusNode(nextPhotoLink.to, nextPhotoLink.arrivalView || nextPhotoLink.direction)}><ArrowUp size={22}/><span>{nextPhotoLink.label || "다음 사진으로 이동"}</span></button>}
              {showSideControls && <div className="street-side-actions" role="group" aria-label="거리 양쪽 가게 보기">{(["left", "right"] as const).map(side => <button key={side} type="button" data-side={side} aria-pressed={lookSide === side} aria-controls="street-visible-stores" onClick={() => openStreetSide(side)}>{side === "left" && <ArrowLeft size={20}/>}<span>{directionName[side]} 가게 보기</span>{side === "right" && <ArrowRight size={20}/>}</button>)}</div>}
              <span className="street-photo-caption"><MapPin size={13}/> {currentNode.subtitle}</span>
            </div>
            <button type="button" className="street-catalog-entry" onClick={openStreetCatalog}><Store size={18}/> A·B·C·D동 가게 둘러보기 <ArrowRight size={17}/></button>
            <div className="direction-controls"><span>보는 방향</span><div>{(["forward", "back"] as const).map(direction => <button key={direction} type="button" className={currentView === direction ? "active" : ""} disabled={!hasPhoto(currentNodeId,direction)} onClick={() => changeView(direction)} aria-label={`${directionName[direction]} 방향 보기`} title={`${directionName[direction]} 방향 보기`} aria-pressed={currentView === direction}>{direction === "forward" ? <ArrowUp size={22}/> : <ArrowDown size={22}/>}</button>)}</div></div>
            <div className="street-footer"><div><Camera size={15}/><span>{currentNode.name} · 사진 {directions.filter(d=>hasPhoto(currentNodeId,d)).length}장</span></div><div className="street-navigation">{routeNextId && <button className="route-navigation-next" type="button" onClick={moveAlongRoute}><Navigation size={14}/> 안내: 다음 {streetNodes.find(n=>n.id===routeNextId)?.name} <ArrowRight size={14}/></button>}{currentNode.connections.filter(connection => connection !== nextPhotoLink).map((connection) => <button key={`${connection.to}-${connection.direction}`} type="button" onClick={() => focusNode(connection.to, connection.arrivalView || connection.direction)} aria-label={`${directionName[connection.direction]}으로 이동 · ${streetNodes.find(n => n.id === connection.to)?.name || connection.to}`}><Navigation size={14}/> {directionName[connection.direction]}으로 이동 · {streetNodes.find((n) => n.id === connection.to)?.name} <ArrowRight size={14}/></button>)}</div></div>
            {selectedStore && <div className="selected-store-strip"><span><Store size={15}/><strong>{selectedStore.name}</strong> · {selectedStore.building} {selectedStore.floor}층 {selectedStore.unit || ""} · {selectedStore.floor>1?"1층 외관/출입구 참고":"1층 거리 사진"} · {activeFacades.some((a) => a.storeId === selectedStore.id) ? "영역 표시됨" : "영역 미등록"}</span><button type="button" onClick={() => setDetailsOpen(true)}>가게 상세 보기 <ChevronRight size={15}/></button></div>}
            <p className="street-small-help">지도에서 가게를 선택하면 연결된 촬영 지점이 열립니다. 가게 외곽선 표시는 영역 데이터를 등록한 사진에서만 나타납니다.</p>

            </div>
            {(lookSide !== null || streetCatalogOpen) && <div className="street-store-showcase" id="street-visible-stores" ref={streetStoresRef} tabIndex={-1} aria-label="현재 방향에 연결된 가게" aria-live="polite">
              <button type="button" className="street-return-photo" onClick={returnToStreetPhoto}><ArrowLeft size={18}/> 거리 사진으로 돌아가기</button>
              {showSideControls && <div className="street-store-mode-tabs" role="group" aria-label="거리 가게 보기 방식"><button type="button" aria-pressed={!streetCatalogOpen} onClick={() => openStreetSide(lastSideRef.current)}>사진 속 가게</button><button type="button" aria-pressed={streetCatalogOpen} onClick={openStreetCatalog}>동·층별 가게 사진</button></div>}
              {streetCatalogOpen ? <><div className="street-store-showcase-head"><div><span className="panel-eyebrow">STORES IN VIEW</span><h4>동·층별로 둘러보는 가게</h4><p>간판과 주소를 대조한 가게 사진입니다. 사진 속 좌우 위치가 확인된 가게는 ‘사진 속 가게’에서 볼 수 있어요.</p></div></div><Suspense fallback={<p role="status">가게 사진을 불러오고 있어요.</p>}><StorefrontDirectory embedded/></Suspense></> : lookSide && <>
              <div className="street-store-showcase-head">
                <div>
                  <span className="panel-eyebrow">STORES IN VIEW</span>
                  <h4>{directionName[lookSide]} 면에서 만나는 가게</h4>
                  <p>{currentNode.name} · {directionName[currentView]}을 보는 중 · {directionName[lookSide]} 면 {spotlightStores.length}곳{spotlightStores.length > 0 ? " · 가게 카드를 3개씩 둘러보세요." : " · 다른 면을 선택하거나 거리 사진으로 돌아가 보세요."}</p>
                </div>
                {showSideControls && <div className="street-store-side-tabs" role="group" aria-label="가게 면 선택">{(["left", "right"] as const).map(side => <button key={side} type="button" aria-pressed={lookSide === side} onClick={() => openStreetSide(side)}>{side === "left" ? <ArrowLeft size={17}/> : <ArrowRight size={17}/>} {directionName[side]} 면</button>)}</div>}
              </div>
              {storePage.pageCount > 0 && <div className="street-store-pagination"><button type="button" disabled={storePage.page === 0} onClick={() => turnStorePage(storePage.page - 1)} aria-label="이전 가게 3곳"><ArrowLeft size={18}/> 이전 가게</button><span role="status">{storePage.page * 3 + 1}–{Math.min(spotlightStores.length, storePage.page * 3 + 3)} / {spotlightStores.length}곳</span><button type="button" disabled={storePage.page + 1 >= storePage.pageCount} onClick={() => turnStorePage(storePage.page + 1)} aria-label="다음 가게 3곳">다음 가게 <ArrowRight size={18}/></button></div>}
              <div className="street-store-grid" key={`${pagingContext}:${storePage.page}`}>
                {storePage.stores.map((store) => {
                  return <article key={`spotlight-${store.id}`} className={`street-store-card ${store.storefrontImage ? "has-storefront" : ""} ${selectedStoreId === store.id ? "is-selected" : ""}`}>
                    <button type="button" className="street-store-card-visual" onClick={() => focusStore(store.id, true)} aria-label={`${store.name} 가게 정보 열기`}>
                      {validStorefrontImage(store.storefrontImage) ? <img src={store.storefrontImage} alt={`${store.name} 실제 외관`} loading="lazy"/> : <div className={`street-store-card-placeholder ${store.type === "맛" ? "food" : "style"}`}><span>매장 사진 준비 중</span><strong><StoreName name={store.name}/></strong></div>}
                    </button>
                    <div className="street-store-card-body">
                      <div className="street-store-card-top">
                        <span className={`category-pill ${store.type === "맛" ? "food" : "style"}`}>{store.type} · {store.category}</span>
                      </div>
                      <button type="button" className="street-store-card-title" onClick={() => focusStore(store.id, true)}><strong><StoreName name={store.name}/></strong><span>{store.description}</span></button>
                      <ul className="street-store-card-meta">
                        <li><MapPin size={14}/> {store.building} {store.floor}층 · {store.unit || "호수 확인 전"}</li>
                        <li><Utensils size={14}/> 대표 정보 · {store.menu}</li>
                        <li><Sparkles size={14}/> 특징 · {store.tags.slice(0, 2).join(" · ")}</li>
                      </ul>
                    </div>
                  </article>;
                })}
              </div>
              {!spotlightStores.length && <div className="street-store-empty"><Store size={24} aria-hidden="true" /><strong>{!lookSide && showSideControls ? "보고 싶은 쪽을 골라보세요" : hasStoreFilter ? "조건에 맞는 가게가 이쪽에 없어요" : `${lookSide ? directionName[lookSide] + " 면에" : "이 방향에"} 연결된 가게가 아직 없어요`}</strong><p>{!lookSide && showSideControls ? "왼쪽·오른쪽을 선택하면 해당 면의 가게 카드가 나와요." : "다른 쪽을 선택하거나 검색·필터 조건을 바꿔 보세요."}</p></div>}
              </>}
            </div>}
            </div>
          </section>
        </div>

        {hasStoreFilter && <><div className="store-section-heading" ref={resultsRef}><div><span className="eyebrow">SEARCH RESULTS</span><h3>{showDiscoveries ? "이벤트가 등록된 가게" : onlySaved ? "저장한 가게" : query ? "검색 결과" : tab === "list" ? "동네 가게 전체" : "필터 결과"}</h3><p>{resultStores.length ? `${resultFloors.join("·")}층에서 ${resultStores.length}곳 · 카드를 선택하면 촬영 지점과 연결됩니다.` : "모든 층에서 찾아봤지만 맞는 가게가 없어요."}</p></div><button type="button" className="recommended-button" onClick={pickRecommended} disabled={!resultStores.length}><Sparkles size={16}/> 가게 하나 둘러보기</button></div>
        {allFloorResults.length > 0 && <div className="list-floor-tabs" role="group" aria-label="가게 목록 층 선택">{(["전체", 1, 2, 3] as const).map(item => <button key={item} type="button" aria-pressed={listFloor === item} onClick={() => setListFloor(item)}>{item === "전체" ? "전체 층" : `${item}층`}<span>{item === "전체" ? allFloorResults.length : allFloorResults.filter(store => store.floor === item).length}</span></button>)}</div>}
        {resultStores.length ? resultFloors.map(storeFloor => <section key={storeFloor} className="store-floor-section" aria-label={`${storeFloor}층 가게`}>
          <h4 className="store-floor-heading">{storeFloor}층<span>{resultStores.filter(store => store.floor === storeFloor).length}곳</span></h4>
          <div className="store-grid">{resultStores.filter(store => store.floor === storeFloor).map((store) => <article key={store.id} className={`store-card ${selectedStoreId === store.id ? "is-selected" : ""}`}>
          <div className="store-card-top"><span className={`category-pill ${store.type === "맛" ? "food" : "style"}`}>{store.type === "맛" ? <Utensils size={13}/> : <Camera size={13}/>} {store.type} · {store.category}</span><button type="button" className={`favorite-button ${favorites.includes(store.id) ? "is-saved" : ""}`} onClick={() => toggleFavorite(store.id)} aria-label={`${store.name} ${favorites.includes(store.id) ? "저장 해제" : "저장"}`} aria-pressed={favorites.includes(store.id)}><Heart size={19} fill={favorites.includes(store.id) ? "currentColor" : "none"}/></button></div>
          <button type="button" className="store-card-main" onClick={() => focusStore(store.id, true)}>{validStorefrontImage(store.storefrontImage) && <img className="catalog-storefront-image" src={store.storefrontImage} alt={`${store.name} 실제 외관`} loading="lazy"/>}<strong><StoreName name={store.name}/></strong><span>{store.description}</span></button>
          {store.event && <div className="store-event"><Zap size={14}/><span>{store.event}</span></div>}
          <div className="store-card-bottom"><span><MapPin size={14}/>{store.building} {store.floor}층 · {store.unit || "호수 확인 전"}</span></div>
          <button className="store-card-route" type="button" disabled={!streetNodes.some(node => node.stores.includes(store.id))} onClick={() => guideToStore(store.id)}><Navigation size={14}/> 현재 촬영 지점에서 찾아보기</button>
        </article>)}</div>
        </section>) : <div className="no-stores"><Search size={26}/><strong>조건에 맞는 가게가 없어요</strong><p>검색어 또는 필터를 변경해 보세요.</p><button type="button" onClick={() => { setQuery(""); setFilter("전체"); setOnlySaved(false); setShowDiscoveries(false); setFloor(1); setBuilding("전체"); setListFloor("전체"); }}>전체 가게 보기</button></div>}</>}

        {featuredStores.length > 0 && !showDiscoveries && <div className="subtle-promo"><Zap size={18}/><span>등록된 이벤트 문구가 있는 가게 <strong>{featuredStores.length}곳</strong>을 모아볼 수 있어요.</span><button type="button" onClick={() => { setFilter("이벤트"); setShowDiscoveries(true); setOnlySaved(false); setQuery(""); jumpToExplorer(); }}>오늘의 발견 보기 <ArrowRight size={15}/></button></div>}
      </section>
      <footer className="customer-footer"><span>맛&멋 AI Street · 송도 타임스페이스 시범 프로젝트</span>{currentSurface()==="legacy" && <><a href={appUrl("editor","/map-editor")}>전체 지도 편집 <ArrowRight size={13}/></a><a href={appUrl("editor","/street-editor")}>거리 사진 편집 <ArrowRight size={13}/></a></>}</footer>
    </main>

    {detailsOpen && selectedStore && <div className="modal-overlay" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setDetailsOpen(false); }}><section className="store-modal" ref={modalRef} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby="store-modal-title">
      <button type="button" className="modal-close" onClick={() => setDetailsOpen(false)} aria-label="가게 정보 닫기"><X size={20}/></button>
      {validStorefrontImage(selectedStore.storefrontImage) ? <div className="catalog-storefront-detail"><img src={selectedStore.storefrontImage} alt={`${selectedStore.name} 간판과 외관`}/></div> : <div className="modal-visual"><span className={`category-pill ${selectedStore.type === "맛" ? "food" : "style"}`}>{selectedStore.type} · {selectedStore.category}</span><div><Store size={28}/><span>LOCAL STORE</span></div></div>}
      <div className="modal-body"><span className="modal-overline">{selectedStore.building} · {selectedStore.floor}층 · {selectedStore.unit || "위치 확인 전"} · {publication.status === "published"?"등록 점포":"시범 점포"}</span><h2 id="store-modal-title"><StoreName name={selectedStore.name}/></h2><p>{selectedStore.description}</p><div className="tag-row">{selectedStore.tags.map((tag) => <span key={tag}>#{tag}</span>)}</div>
        <div className="store-information"><div><span>대표 메뉴·서비스</span><strong>{selectedStore.menu}</strong></div><div><span>가격</span><strong>{selectedStore.price}</strong></div><div><span>둘러볼 위치</span><strong>{selectedStore.building} {selectedStore.floor}층</strong></div></div>
        <section className="customer-menu-list" aria-label="메뉴와 가격"><h3>메뉴·서비스와 가격</h3><dl>{storeMenuItems(selectedStore).map((item, index) => <div key={index}><dt>{item.name || "메뉴 확인 중"}</dt><dd>{item.price || "가격 문의"}</dd></div>)}</dl></section>
        {selectedStore.event && <div className="event-card"><Zap size={19}/><div><small>등록된 홍보 문구 · 진행 여부 확인 필요</small><strong>{selectedStore.event}</strong></div></div>}
        <NextStopCards current={selectedStore} stores={effectiveStores} onSelect={id=>{focusStore(id,true);window.requestAnimationFrame(()=>{modalRef.current?.scrollTo({top:0,behavior:"instant"});modalRef.current?.querySelector<HTMLButtonElement>(".modal-close")?.focus();});}}/>
        <div className="modal-buttons"><button type="button" className={`save-button ${favorites.includes(selectedStore.id) ? "saved" : ""}`} onClick={() => toggleFavorite(selectedStore.id)}>{favorites.includes(selectedStore.id) ? <Check size={17}/> : <Bookmark size={17}/>} {favorites.includes(selectedStore.id) ? "저장됨" : "즐겨찾기"}</button><button type="button" className="route-button" disabled={!streetNodes.some(n=>n.stores.includes(selectedStore.id))} onClick={() => { focusNode(locateStoreNode(selectedStore.id, streetNodes), "forward", false); openTab("map"); setDetailsOpen(false); mapRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }); }}><LocateFixed size={17}/> 안내도에서 위치 보기</button></div>
        <button type="button" className="modal-guide-button" disabled={!streetNodes.some(n=>n.stores.includes(selectedStore.id))} onClick={() => guideToStore(selectedStore.id)}><Navigation size={16}/> 현재 지점부터 사진 연결 따라가기</button>
        <small className="modal-note"><Info size={13}/> {streetNodes.some(n=>n.stores.includes(selectedStore.id)) ? "상세 위치·영업 현황은 현장 확인이 필요합니다. 실측 길찾기는 제공하지 않습니다." : "이 가게는 촬영 지점과 아직 연결되지 않았습니다. 관리자 지도 편집이 필요합니다."}</small>
      </div></section></div>}
  </div>;
}
