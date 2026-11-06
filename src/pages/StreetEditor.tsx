import { useEffect, useState } from "react";
import type { MouseEvent } from "react";
import { ArrowLeft, ArrowDown, ArrowUp, Camera, Download, Info, Plus, RotateCcw, Save, Trash2, Upload } from "lucide-react";
import { saveStreetNodes, useStreetNodes } from "../data/streetNetwork";
import { storesForStreetView } from "../data/streetViewStores";
import { photoKey, useDraftPhotoUrls, listDraftPhotos, saveDraftPhoto, deleteDraftPhoto } from "../data/localStreetPhotos";
import { publicMediaUrl, setPhotoMediaPath, uploadStreetPhoto, useMediaDraft } from "../data/mediaStorage";
import { useAdminAuth } from "../auth/adminAuth";
import { useStoreDraft } from "../data/storeDraft";
import { FACADE_KEY, getFacadeAnnotations, type FacadeAnnotation, type Point } from "../data/facadeAnnotations";
import type { ViewDirection } from "../types/street";
import "../styles/StreetEditor.css";
import { appUrl, sameOriginPreview } from "../config/site";
import SiteBrand from "../components/SiteBrand";

const views: ViewDirection[] = ["forward", "back", "left", "right"];
const names: Record<ViewDirection, string> = { forward: "정면", back: "뒤", left: "왼쪽", right: "오른쪽" };

function readJsonAnnotations(input: unknown, nodeIds: string[], storeIds: number[]): FacadeAnnotation[] | null {
  if (!Array.isArray(input)) return null;
  const valid = input.every((item) => item && typeof item === "object" &&
    typeof item.nodeId === "string" && nodeIds.includes(item.nodeId) &&
    views.includes(item.view) && typeof item.storeId === "number" && storeIds.includes(item.storeId) &&
    Array.isArray(item.points) && item.points.length >= 3 && item.points.every((p: Point) =>
      typeof p.x === "number" && typeof p.y === "number" && p.x >= 0 && p.x <= 100 && p.y >= 0 && p.y <= 100));
  return valid ? input as FacadeAnnotation[] : null;
}

export default function StreetEditor() {
  const stores = useStoreDraft();
  const streetNodes = useStreetNodes();
  const {urls:draftUrls} = useDraftPhotoUrls();
  const mediaDraft = useMediaDraft();
  const {getSession} = useAdminAuth();
  const [uploadBusy,setUploadBusy] = useState(false);
  const [nodeId, setNodeId] = useState("point1");
  const [view, setView] = useState<ViewDirection>("forward");
  const [storeId, setStoreId] = useState(1);
  const [annotations, setAnnotations] = useState<FacadeAnnotation[]>(getFacadeAnnotations);
  const [points, setPoints] = useState<Point[]>([]);
  const [message, setMessage] = useState("사진 위에서 가게 외곽선을 따라 꼭짓점을 순서대로 눌러주세요.");
  const node = streetNodes.find((n) => n.id === nodeId) || streetNodes[0];
  const draftImage = draftUrls[photoKey(nodeId,view)];
  const remotePath = mediaDraft.photos[photoKey(nodeId,view)];
  const image = draftImage || publicMediaUrl(remotePath) || node.views[view];
  const availableStores = stores;
  const directionStores = storesForStreetView(stores, annotations, nodeId, view, node.viewStores?.[view]);
  const existing = annotations.find((a) => a.nodeId === nodeId && a.view === view && a.storeId === storeId);

  const saveDirectionOrder = (ids: number[]) => {
    saveStreetNodes(streetNodes.map(item => item.id === node.id ? { ...item,
      stores: [...new Set([...item.stores, ...ids])], viewStores: { ...item.viewStores, [view]: ids },
    } : item));
  };
  const linkStore = () => {
    if (!stores.some(store => store.id === storeId)) return;
    try {
      saveDirectionOrder([...new Set([...directionStores.map(store => store.id), storeId])]);
      setMessage("이 방향에 가게 카드를 추가했어요. 가게 수 제한 없이 연결할 수 있으며 손님에게는 3개씩 보여요. 전체 게시 후 공개됩니다.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "연결을 저장하지 못했습니다."); }
  };
  const reorderStore = (index: number, offset: number) => {
    const ids = directionStores.map(store => store.id), next = index + offset;
    if (next < 0 || next >= ids.length) return;
    [ids[index], ids[next]] = [ids[next], ids[index]];
    saveDirectionOrder(ids);
    setMessage("가게 카드 순서를 저장했어요. 전체 게시 후 공개됩니다.");
  };
  const unlinkStore = (id: number) => {
    const outline = annotations.some(item => item.nodeId === nodeId && item.view === view && item.storeId === id);
    if (!window.confirm(`이 방향에서 가게 연결${outline ? "과 표시 영역" : ""}을 해제할까요? 매장 정보는 삭제되지 않습니다.`)) return;
    saveDirectionOrder(directionStores.filter(store => store.id !== id).map(store => store.id));
    const updated = annotations.filter(item => !(item.nodeId === nodeId && item.view === view && item.storeId === id));
    localStorage.setItem(FACADE_KEY, JSON.stringify(updated)); setAnnotations(updated);
    setMessage("이 방향의 가게 연결을 해제했어요. 전체 게시 후 공개 화면에 반영됩니다.");
  };

  useEffect(() => { document.title = "맛&멋 AI Street | 관리자"; }, []);
  // Reload the saved outline when the point, direction, store or saved outlines change.
  const [pointsFor, setPointsFor] = useState<{nodeId: string; view: ViewDirection; storeId: number; annotations: FacadeAnnotation[]} | null>(null);
  if (!pointsFor || pointsFor.nodeId !== nodeId || pointsFor.view !== view || pointsFor.storeId !== storeId || pointsFor.annotations !== annotations) {
    const found = annotations.find((a) => a.nodeId === nodeId && a.view === view && a.storeId === storeId);
    setPointsFor({nodeId, view, storeId, annotations});
    setPoints(found ? found.points : []);
  }

  const setNode = (id: string) => {
    const next = streetNodes.find((n) => n.id === id) || streetNodes[0];
    setNodeId(id);
    setStoreId(next.stores[0] ?? stores[0]?.id ?? 0);
    setView(views.find((v) => Boolean(next.views[v] || mediaDraft.photos[photoKey(id,v)] || draftUrls[photoKey(id,v)])) || "forward");
    setMessage("편집할 점포를 선택하고 사진의 꼭짓점을 누르세요.");
  };
  const addPoint = (event: MouseEvent<HTMLDivElement>) => {
    if (!image) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const x = Math.min(100, Math.max(0, ((event.clientX - rect.left) / rect.width) * 100));
    const y = Math.min(100, Math.max(0, ((event.clientY - rect.top) / rect.height) * 100));
    setPoints((prev) => [...prev, { x: Math.round(x * 100) / 100, y: Math.round(y * 100) / 100 }]);
    setMessage("꼭짓점을 최소 3개 지정한 뒤 ‘영역 저장’을 누르세요.");
  };
  const save = () => {
    if (points.length < 3) return;
    const entry: FacadeAnnotation = { nodeId, view, storeId, points };
    const updated = [...annotations.filter((a) => !(a.nodeId === nodeId && a.view === view && a.storeId === storeId)), entry];
    localStorage.setItem(FACADE_KEY, JSON.stringify(updated));
    setAnnotations(updated);
    setMessage("가게 영역을 이 브라우저 초안에 저장했어요. 손님에게 반영하려면 점포 관리에서 전체 게시해 주세요.");
  };
  const remove = () => {
    const updated = annotations.filter((a) => !(a.nodeId === nodeId && a.view === view && a.storeId === storeId));
    localStorage.setItem(FACADE_KEY, JSON.stringify(updated));
    setAnnotations(updated);
    setPoints([]);
    setMessage("선택한 점포의 저장된 영역을 삭제했어요.");
  };
  const exportJson = () => {
    const blob = new Blob([JSON.stringify(annotations, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "matmeot-facade-annotations.json"; a.click();
    URL.revokeObjectURL(url);
  };
  const uploadPhoto = async (file?: File) => {
    if (!file) return;
    try {
      const stale=annotations.filter(a=>a.nodeId===nodeId && a.view===view);
      const linked = node.viewStores?.[view] || [];
      if ((stale.length || linked.length) && !window.confirm(`이 방향에 가게 카드 ${linked.length}개와 영역 ${stale.length}개가 연결되어 있어요. 사진을 교체하면 기존 연결과 영역을 비우고 새로 지정해야 합니다. 교체할까요?`)) return;
      await saveDraftPhoto(nodeId,view,file);
      // A new local image invalidates an old server draft link for this direction;
      // an already published public image remains untouched until republishing.
      setPhotoMediaPath(nodeId,view,null);
      if (linked.length) saveDirectionOrder([]);
      if (stale.length) {
        const next=annotations.filter(a=>!(a.nodeId===nodeId && a.view===view));
        localStorage.setItem(FACADE_KEY,JSON.stringify(next));setAnnotations(next);
      }
      setPoints([]); setMessage("새 사진을 브라우저에 임시 등록했어요. 영역을 다시 지정하고, 서버 업로드 후 점포 관리에서 전체 게시해 주세요.");
    }
    catch(e) { setMessage(e instanceof Error?e.message:"사진을 저장하지 못했습니다."); }
  };
  const uploadRemote = async () => {
    if (uploadBusy) return;
    setUploadBusy(true);
    try {
      const photos = await listDraftPhotos();
      const photo = photos.find(item => item.key === photoKey(nodeId,view));
      if (!photo) throw new Error("먼저 이 방향에 사진을 임시 등록해 주세요.");
      const file = new File([photo.blob], photo.name || "photo.jpg", {type:photo.blob.type});
      await uploadStreetPhoto(file,nodeId,view,await getSession());
      setMessage("서버 사진 업로드 완료. 아직 손님에게 노출되지 않았어요. /catalog의 ‘관리자 승인 · 전체 게시’를 눌러야 반영됩니다. (파일 URL은 업로드 즉시 공개 가능)");
    } catch(e) { setMessage(e instanceof Error?e.message:"서버 사진 업로드 실패"); }
    finally {setUploadBusy(false);}
  };
  const disconnectRemote = () => {
    if (!window.confirm("게시용 서버 사진 연결을 해제할까요? 이미 공개된 사진은 새로 게시하기 전까지 유지돼요.")) return;
    setPhotoMediaPath(nodeId,view,null);
    setMessage("초안에서 서버 사진 연결을 해제했어요. Storage에 저장된 파일이나 기존 공개 게시본은 삭제되지 않았습니다.");
  };
  const clearPhoto = async () => {
    try { await deleteDraftPhoto(nodeId,view); setPoints([]); setMessage("임시 사진을 해제했어요. 프로젝트 기본 사진이 있다면 다시 표시됩니다."); }
    catch(e) { setMessage(e instanceof Error?e.message:"사진을 해제하지 못했습니다."); }
  };
  const importJson = async (file?: File) => {
    if (!file) return;
    try {
      const parsed = JSON.parse(await file.text());
      const valid = readJsonAnnotations(parsed, streetNodes.map(n=>n.id), stores.map(s=>s.id));
      if (!valid) { setMessage("파일 형식이 올바르지 않아요. 기존 데이터를 변경하지 않았습니다."); return; }
      localStorage.setItem(FACADE_KEY, JSON.stringify(valid));
      setAnnotations(valid);
      setMessage(`${valid.length}개 가게 영역을 가져왔어요. 동일 브라우저의 손님 페이지에 반영됩니다.`);
    } catch { setMessage("JSON 파일을 읽지 못했습니다."); }
  };

  return <main className="street-editor">
    <header className="editor-header"><a href={sameOriginPreview()}><ArrowLeft size={18}/> 손님용 거리 탐색</a><SiteBrand role="editor" /><a href={appUrl("editor","/map-editor")}>전체 지도 편집</a></header>
    <section className="editor-intro"><span><Camera size={16}/> PHOTO ANNOTATION</span><h1>거리 사진과 가게 연결하기</h1><p>촬영 지점과 방향을 고르고 가게 카드를 추가하세요. 사진 속 영역 표시는 선택 사항입니다. 저장한 초안은 전체 게시 후 손님에게 보여요.</p></section>
    <div className="editor-layout"><section className="editor-main"><div className="editor-subheader"><h2>{node.name} · {names[view]} 사진</h2><span>{image ? "클릭해서 꼭짓점 추가" : "사진 미등록"}</span></div>
      <div className={`editor-canvas ${image?"has-photo":""}`} onClick={addPoint} role="presentation">
        {image ? <img src={image} alt={`${node.name} ${names[view]} 방향`} draggable={false}/> : <div className="editor-empty"><Camera size={36}/><strong>등록된 사진이 없습니다</strong><span>오른쪽에서 JPG·PNG·WEBP 사진을 등록해 주세요.</span></div>}
        {image && <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="editor-overlay"><polygon points={points.map((p) => `${p.x},${p.y}`).join(" ")} fill="#facc1536" stroke="#fde047" strokeWidth=".45" vectorEffect="non-scaling-stroke"/>
          {points.map((p, i) => <g key={i}><circle cx={p.x} cy={p.y} r=".8" fill="#facc15" stroke="#111827" strokeWidth=".25"/><text x={p.x + 1} y={p.y - 1} fill="white" fontSize="2" stroke="#19202a" strokeWidth=".15" paintOrder="stroke">{i + 1}</text></g>)}
        </svg>}
      </div><div className="editor-toolbar"><button onClick={() => setPoints((p) => p.slice(0,-1))} disabled={!points.length}><RotateCcw size={16}/> 마지막 점 취소</button><button onClick={() => setPoints([])} disabled={!points.length}>다시 그리기</button><span>{points.length}개 꼭짓점</span></div>
      <div className="editor-message" role="status"><Info size={16}/>{message}</div>
    </section>
    <aside className="editor-sidebar"><h2>영역 설정</h2><label>촬영 지점<select value={nodeId} onChange={(event) => setNode(event.target.value)}>{streetNodes.map((item) => <option value={item.id} key={item.id}>{item.number}번 · {item.name}</option>)}</select></label>
      <label>보는 방향<select value={view} onChange={(event) => setView(event.target.value as ViewDirection)}>{views.map((item) => <option value={item} key={item}>{names[item]} {(draftUrls[photoKey(nodeId,item)] || mediaDraft.photos[photoKey(nodeId,item)] || node.views[item]) ? "· 사진 있음" : "· 미등록"}</option>)}</select></label>
      <label>가게<select value={stores.some(store => store.id === storeId)?storeId:""} onChange={(event) => setStoreId(Number(event.target.value))}><option value="" disabled>{availableStores.length?"가게 선택":"먼저 매장 관리에서 가게를 등록하세요"}</option>{availableStores.map((item) => <option value={item.id} key={item.id}>{item.name}</option>)}</select></label>
      <section className="editor-direction-stores" aria-labelledby="direction-stores-title"><h3 id="direction-stores-title">{names[view]} 방향 가게 · {directionStores.length}곳</h3><p>가게 카드를 원하는 만큼 연결해요. 손님용에서는 3개씩 넘겨 볼 수 있어요.</p><button className="editor-data editor-primary" type="button" onClick={linkStore} disabled={!stores.some(store => store.id === storeId) || directionStores.some(store => store.id === storeId)}><Plus size={16}/> 선택한 가게 추가하기</button><a className="editor-data" href={appUrl("editor", "/catalog")}><Plus size={16}/> 새 가게 등록 · 매장 관리</a><ol>{directionStores.map((store, index) => <li key={store.id}><button type="button" className="editor-direction-store-name" onClick={() => setStoreId(store.id)}>{index + 1}. {store.name}</button><div><button type="button" aria-label={`${store.name} 앞으로`} disabled={index === 0} onClick={() => reorderStore(index, -1)}><ArrowUp size={15}/></button><button type="button" aria-label={`${store.name} 뒤로`} disabled={index === directionStores.length - 1} onClick={() => reorderStore(index, 1)}><ArrowDown size={15}/></button><button type="button" aria-label={`${store.name} 연결 해제`} onClick={() => unlinkStore(store.id)}><Trash2 size={15}/></button></div></li>)}</ol>{!directionStores.length && <p>아직 연결한 가게가 없어요.</p>}</section>
      <div className="editor-divider"/><h3>사진 등록 · 나중에 교체 가능</h3><p>먼저 브라우저에 사진을 올리고 외곽선을 그린 뒤 서버 업로드를 진행해 주세요.</p>
      <label className="editor-upload"><Upload size={16}/> JPG·PNG·WEBP 사진 등록<input type="file" accept="image/jpeg,image/png,image/webp" onChange={event=>{void uploadPhoto(event.target.files?.[0]);event.target.value="";}}/></label>
      <button className="editor-data" onClick={()=>void clearPhoto()} disabled={!draftImage}><Trash2 size={16}/> 임시 사진 해제</button>
      <div className="editor-divider"/><h3>Supabase Storage · 서버 사진</h3>
      <p>현재 방향: <strong>{remotePath?"서버 업로드 완료 · 게시 대기":"서버 미등록"}</strong>. 파일 자체는 업로드 시 공개 URL이 생성됩니다. 사람 얼굴·번호판은 사전에 가리고 올려 주세요.</p>
      <button className="editor-primary editor-data" disabled={!draftImage || uploadBusy} type="button" onClick={()=>void uploadRemote()}><Upload size={16}/>{uploadBusy?"서버 업로드 중…":"현재 사진 서버 업로드"}</button>
      <button className="editor-data" type="button" disabled={!remotePath || uploadBusy} onClick={disconnectRemote}><Trash2 size={16}/> 서버 사진 연결 해제 (초안)</button>
      {remotePath && <a className="editor-data" href={publicMediaUrl(remotePath)} target="_blank" rel="noopener noreferrer">업로드한 사진 확인</a>}
      <p>서버 업로드만으로 손님용 화면이 바뀌지 않습니다. <a href="/catalog">점포 관리에서 ‘전체 게시’</a>를 완료해야 반영돼요.</p>
      <div className="editor-actions"><button className="editor-primary" onClick={save} disabled={points.length < 3 || !image || !node.stores.includes(storeId)}><Save size={16}/> 영역 저장</button><button onClick={remove} disabled={!existing}><Trash2 size={16}/> 저장 영역 삭제</button></div>
      <div className="editor-divider"/><h3>영역 데이터 관리</h3><p>현재 저장: <strong>{annotations.length}개</strong> · 같은 브라우저에만 반영됩니다.</p><button className="editor-data" onClick={exportJson}><Download size={16}/> JSON 내보내기</button>
      <label className="editor-upload"><Upload size={16}/> JSON 가져오기<input type="file" accept="application/json,.json" onChange={(event) => { void importJson(event.target.files?.[0]); event.target.value = ""; }}/></label>
      <p className="editor-warning">사진을 서버에 업로드하면 누구나 해당 파일 URL에 접근할 수 있습니다. 손님 페이지에는 전체 게시 이후부터 표시됩니다. 외곽선은 별도로 저장하고 전체 게시해야 반영됩니다.</p>
    </aside></div>
  </main>;
}
