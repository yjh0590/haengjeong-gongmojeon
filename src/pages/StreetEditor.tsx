import { useEffect, useMemo, useState } from "react";
import type { MouseEvent } from "react";
import { ArrowLeft, Camera, Download, Info, RotateCcw, Save, Trash2, Upload } from "lucide-react";
import { useStreetNodes } from "../data/streetNetwork";
import { photoKey, useDraftPhotoUrls, saveDraftPhoto, deleteDraftPhoto } from "../data/localStreetPhotos";
import { stores } from "../data/stores";
import { FACADE_KEY, getFacadeAnnotations, type FacadeAnnotation, type Point } from "../data/facadeAnnotations";
import type { ViewDirection } from "../types/street";
import "../styles/StreetEditor.css";
import { appUrl, sameOriginPreview } from "../config/site";

const views: ViewDirection[] = ["forward", "back", "left", "right"];
const names: Record<ViewDirection, string> = { forward: "정면", back: "뒤", left: "왼쪽", right: "오른쪽" };

function readJsonAnnotations(input: unknown, nodeIds: string[]): FacadeAnnotation[] | null {
  if (!Array.isArray(input)) return null;
  const valid = input.every((item) => item && typeof item === "object" &&
    typeof item.nodeId === "string" && nodeIds.includes(item.nodeId) &&
    views.includes(item.view) && typeof item.storeId === "number" && stores.some((s) => s.id === item.storeId) &&
    Array.isArray(item.points) && item.points.length >= 3 && item.points.every((p: Point) =>
      typeof p.x === "number" && typeof p.y === "number" && p.x >= 0 && p.x <= 100 && p.y >= 0 && p.y <= 100));
  return valid ? input as FacadeAnnotation[] : null;
}

export default function StreetEditor() {
  const streetNodes = useStreetNodes();
  const {urls:draftUrls} = useDraftPhotoUrls();
  const [nodeId, setNodeId] = useState("point1");
  const [view, setView] = useState<ViewDirection>("forward");
  const [storeId, setStoreId] = useState(1);
  const [annotations, setAnnotations] = useState<FacadeAnnotation[]>(getFacadeAnnotations);
  const [points, setPoints] = useState<Point[]>([]);
  const [message, setMessage] = useState("사진 위에서 가게 외곽선을 따라 꼭짓점을 순서대로 눌러주세요.");
  const node = streetNodes.find((n) => n.id === nodeId) || streetNodes[0];
  const draftImage = draftUrls[photoKey(nodeId,view)];
  const image = draftImage || node.views[view];
  const availableStores = useMemo(() => stores.filter((s) => node.stores.includes(s.id)), [node]);
  const existing = annotations.find((a) => a.nodeId === nodeId && a.view === view && a.storeId === storeId);

  useEffect(() => { document.title = "가게 영역 편집 · 맛&멋 AI Street"; }, []);
  useEffect(() => {
    const found = annotations.find((a) => a.nodeId === nodeId && a.view === view && a.storeId === storeId);
    setPoints(found ? found.points : []);
  }, [nodeId, view, storeId, annotations]);

  const setNode = (id: string) => {
    const next = streetNodes.find((n) => n.id === id) || streetNodes[0];
    setNodeId(id);
    setStoreId(next.stores[0] ?? stores[0].id);
    setView(views.find((v) => Boolean(next.views[v])) || "forward");
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
    setMessage("이 브라우저에 영역을 저장했어요. 다른 기기에서 사용하려면 JSON 파일로 내보내야 합니다.");
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
      if (stale.length && !window.confirm(`이 방향에 지정한 기존 가게 영역 ${stale.length}개가 있어요. 사진을 교체하면 좌표가 달라질 수 있습니다. 기존 영역을 삭제하고 사진을 등록할까요?`)) return;
      await saveDraftPhoto(nodeId,view,file);
      if (stale.length) {
        const next=annotations.filter(a=>!(a.nodeId===nodeId && a.view===view));
        localStorage.setItem(FACADE_KEY,JSON.stringify(next));setAnnotations(next);
      }
      setPoints([]); setMessage("사진을 이 브라우저에 임시 등록했어요. 가게 영역은 새 사진을 기준으로 다시 지정해 주세요.");
    }
    catch(e) { setMessage(e instanceof Error?e.message:"사진을 저장하지 못했습니다."); }
  };
  const clearPhoto = async () => {
    try { await deleteDraftPhoto(nodeId,view); setPoints([]); setMessage("임시 사진을 해제했어요. 프로젝트 기본 사진이 있다면 다시 표시됩니다."); }
    catch(e) { setMessage(e instanceof Error?e.message:"사진을 해제하지 못했습니다."); }
  };
  const importJson = async (file?: File) => {
    if (!file) return;
    try {
      const parsed = JSON.parse(await file.text());
      const valid = readJsonAnnotations(parsed, streetNodes.map(n=>n.id));
      if (!valid) { setMessage("파일 형식이 올바르지 않아요. 기존 데이터를 변경하지 않았습니다."); return; }
      localStorage.setItem(FACADE_KEY, JSON.stringify(valid));
      setAnnotations(valid);
      setMessage(`${valid.length}개 가게 영역을 가져왔어요. 동일 브라우저의 소비자 페이지에 반영됩니다.`);
    } catch { setMessage("JSON 파일을 읽지 못했습니다."); }
  };

  return <main className="street-editor">
    <header className="editor-header"><a href={sameOriginPreview()}><ArrowLeft size={18}/> 소비자용 거리 탐색</a><strong>맛&멋 AI Street · 거리 사진 편집 도구</strong><a href={appUrl("editor","/map-editor")}>전체 지도 편집</a></header>
    <section className="editor-intro"><span><Camera size={16}/> PHOTO ANNOTATION</span><h1>사진 속 가게 영역 지정하기</h1><p>촬영한 사진의 가게 외곽선을 직접 지정하면 소비자용 거리 탐색에서 그 영역을 강조할 수 있어요. 아직 자동 인식 AI나 서버 동기화 기능은 연결되지 않았습니다.</p></section>
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
      <label>보는 방향<select value={view} onChange={(event) => setView(event.target.value as ViewDirection)}>{views.map((item) => <option value={item} key={item}>{names[item]} {(draftUrls[photoKey(nodeId,item)] || node.views[item]) ? "· 사진 있음" : "· 미등록"}</option>)}</select></label>
      <label>가게<select value={node.stores.includes(storeId)?storeId:""} onChange={(event) => setStoreId(Number(event.target.value))}><option value="" disabled>{availableStores.length?"가게 선택":"지도 편집기에서 점포를 연결하세요"}</option>{availableStores.map((item) => <option value={item.id} key={item.id}>{item.name}</option>)}</select></label>
      <div className="editor-divider"/><h3>사진 등록 · 나중에 교체 가능</h3><p>선택한 지점과 방향에 촬영 사진을 올려 보세요. 지금은 이 브라우저에서만 보이는 임시 등록이에요.</p>
      <label className="editor-upload"><Upload size={16}/> JPG·PNG·WEBP 사진 등록<input type="file" accept="image/jpeg,image/png,image/webp" onChange={event=>{void uploadPhoto(event.target.files?.[0]);event.target.value="";}}/></label>
      <button className="editor-data" onClick={()=>void clearPhoto()} disabled={!draftImage}><Trash2 size={16}/> 임시 사진 해제</button>
      <div className="editor-actions"><button className="editor-primary" onClick={save} disabled={points.length < 3 || !image || !node.stores.includes(storeId)}><Save size={16}/> 영역 저장</button><button onClick={remove} disabled={!existing}><Trash2 size={16}/> 저장 영역 삭제</button></div>
      <div className="editor-divider"/><h3>영역 데이터 관리</h3><p>현재 저장: <strong>{annotations.length}개</strong> · 같은 브라우저에만 반영됩니다.</p><button className="editor-data" onClick={exportJson}><Download size={16}/> JSON 내보내기</button>
      <label className="editor-upload"><Upload size={16}/> JSON 가져오기<input type="file" accept="application/json,.json" onChange={(event) => { void importJson(event.target.files?.[0]); event.target.value = ""; }}/></label>
      <p className="editor-warning">사진 임시 등록은 서버에 전송되지 않으며 JSON 내보내기에 사진이 포함되지 않습니다. 공개 배포하려면 실제 사진을 public/street 폴더에 추가하고 촬영 지점 파일에 경로를 연결해야 합니다.</p><p className="editor-warning">공용 서비스에서 사용하려면 내려받은 JSON을 프로젝트 데이터에 포함하거나 서버에 저장하도록 개발해야 합니다. 이 페이지에는 로그인 보호가 없으므로 시범 도구로만 사용하세요.</p>
    </aside></div>
  </main>;
}
