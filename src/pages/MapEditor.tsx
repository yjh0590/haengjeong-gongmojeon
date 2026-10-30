import { useEffect, useRef, useState } from "react";
import type { MouseEvent } from "react";
import { ArrowLeft, Camera, Download, FileJson, Info, MapPinned, Plus, Save, Trash2, Upload } from "lucide-react";
import { streetNodes as defaultNodes } from "../data/streetNodes";
import { useStoreDraft } from "../data/storeDraft";
import { deleteDraftMap, saveDraftMap, useDraftPhotoUrls } from "../data/localStreetPhotos";
import { MAP_BG_KEY, readMapGeometry, saveMapGeometry, type MapGeometry, type XY } from "../data/mapGeometry";
import { readStreetNodes, saveStreetNodes } from "../data/streetNetwork";
import { inspectStreetNetwork } from "../data/routeGuide";
import type { StreetNode, ViewDirection } from "../types/street";
import "../styles/MapEditor.css";
import { appUrl, sameOriginPreview } from "../config/site";

const vw: ViewDirection[] = ["forward","back","left","right"];
const directionNames: Record<ViewDirection,string> = { forward:"앞",back:"뒤",left:"왼쪽",right:"오른쪽" };
type Mode = "boundary" | "passage" | "node" | "store";
function asXY(event: MouseEvent<SVGSVGElement>): XY {
  const svg = event.currentTarget;
  const transform = svg.getScreenCTM();
  if (!transform) return {x:250,y:187};
  // SVG viewBox may be letterboxed in responsive layouts; use screen-to-SVG mapping.
  const point = svg.createSVGPoint();
  point.x = event.clientX;
  point.y = event.clientY;
  const local = point.matrixTransform(transform.inverse());
  return {
    x: Math.max(0, Math.min(500, Math.round(local.x * 10) / 10)),
    y: Math.max(0, Math.min(374, Math.round(local.y * 10) / 10)),
  };
}
function downloadJSON(filename: string, data: unknown) {
  const blob = new Blob([JSON.stringify(data,null,2)], {type:"application/json"});
  const url = URL.createObjectURL(blob); const a=document.createElement("a");
  a.href=url; a.download=filename; a.click(); setTimeout(()=>URL.revokeObjectURL(url),1000);
}
function isPlainPoint(p: unknown): p is XY {
  return !!p && typeof p==="object" && Number.isFinite((p as XY).x) && Number.isFinite((p as XY).y) && (p as XY).x>=0 && (p as XY).x<=500 && (p as XY).y>=0 && (p as XY).y<=374;
}
export default function MapEditor() {
  const stores = useStoreDraft();
  const [geometry, setGeometry] = useState<MapGeometry>(readMapGeometry);
  const [nodes, setNodes] = useState<StreetNode[]>(readStreetNodes);
  const [mode, setMode] = useState<Mode>("boundary");
  const [activePassage,setActivePassage] = useState(0);
  const [selectedNode, setSelectedNode] = useState("point1");
  const [selectedStore, setSelectedStore] = useState(1);
  const [floor, setFloor] = useState<"전체" | 1 | 2 | 3>("전체");
  const [message, setMessage] = useState("지도 이미지를 등록한 뒤 표시한 구역 경계를 따라 점을 찍을 수 있어요.");
  const fileInput = useRef<HTMLInputElement>(null);
  const {urls} = useDraftPhotoUrls();
  const mapUrl = urls[MAP_BG_KEY];
  const selected = nodes.find(n=>n.id===selectedNode) || nodes[0];
  const networkWarnings = inspectStreetNetwork(nodes);
  const unmappedStores = stores.filter(store => !nodes.some(node => node.stores.includes(store.id)));
  const photosMissing = nodes.filter(node => !vw.some(direction => Boolean(node.views[direction] || urls[`${node.id}:${direction}`])));
  const missingCoordinates = nodes.filter(node => !geometry.nodes[node.id]);

  useEffect(()=>{document.title="전체 지도 편집 · 맛&멋 AI Street";},[]);
  const mapClick = (event: MouseEvent<SVGSVGElement>)=>{
    const p=asXY(event);
    if (mode==="boundary") setGeometry(g=>({...g,boundary:[...g.boundary,p]}));
    if (mode==="passage") setGeometry(g=>{
      const passages=g.passages.map(path=>[...path]);
      while(passages.length<=activePassage) passages.push([]);
      passages[activePassage].push(p);
      return {...g, passages};
    });
    if (mode==="node") setGeometry(g=>({...g,nodes:{...g.nodes,[selectedNode]:p}}));
    if (mode==="store") setGeometry(g=>({...g,stores:{...g.stores,[selectedStore]:p}}));
    setMessage("좌표를 조정했어요. 실제 소비자 페이지에 적용하려면 '변경사항 저장'을 눌러주세요.");
  };
  const saveAll=()=>{
    try {saveMapGeometry(geometry); saveStreetNodes(nodes); setMessage("이 브라우저에 지도·촬영 지점을 저장했어요. 소비자 페이지에서 확인할 수 있습니다.");}
    catch(error){setMessage(error instanceof Error?error.message:"저장 중 문제가 발생했어요.");}
  };
  const addNode=()=>{
    const max=Math.max(...nodes.map(n=>n.number),0)+1;
    const id=`point${max}`;
    const node:StreetNode={id,number:max,name:`${max}번 촬영 지점`,subtitle:"현장 위치 확인 전",views:{},stores:[],connections:[]};
    setNodes(prev=>[...prev,node]);
    setSelectedNode(id);
    setMode("node");
    setGeometry(g=>({...g,nodes:{...g.nodes,[id]:{x:250,y:187}}}));
    setMessage("새 촬영 지점이 추가됐어요. 지도에서 정확한 지점을 클릭하고 인접 지점 연결을 설정하세요.");
  };
  const updateNode=(patch: Partial<StreetNode>)=>setNodes(prev=>prev.map(n=>n.id===selectedNode?{...n,...patch}:n));
  const connectNode=(direction:ViewDirection,to:string)=>{
    if(to===selectedNode) return;
    const connections=selected.connections.filter(c=>c.direction!==direction);
    if(to) connections.push({direction,to,label:`${to} 이동`,arrivalView:direction});
    updateNode({connections});
  };
  const deleteNode=()=>{
    if(defaultNodes.some(n=>n.id===selectedNode)){setMessage("기존 촬영 지점은 삭제 대신 이름과 좌표를 수정해 주세요.");return;}
    if(!confirm(`${selected.name} 지점을 삭제할까요? 이 지점의 사진 임시 저장은 그대로 남습니다.`))return;
    setNodes(ns=>ns.filter(n=>n.id!==selectedNode).map(n=>({...n,connections:n.connections.filter(c=>c.to!==selectedNode)})));
    setGeometry(g=>{const next={...g.nodes};delete next[selectedNode];return {...g,nodes:next};});
    setSelectedNode("point1");
    setMessage("지점이 목록에서 삭제됐어요. 변경사항 저장 후 반영됩니다.");
  };
  const exportShootPlan = () => {
    const cells: string[][] = [["촬영 지점 번호", "지점 ID", "지점 이름", "위치 설명", "촬영 방향", "사진 상태", "인접 촬영 지점", "현장 메모"]];
    for (const node of nodes) {
      for (const direction of vw) {
        const next = node.connections.find(link => link.direction === direction);
        cells.push([
          String(node.number), node.id, node.name, node.subtitle, directionNames[direction],
          node.views[direction] || urls[`${node.id}:${direction}`] ? "등록됨" : "미등록",
          next ? `${nodes.find(other => other.id===next.to)?.number ?? "?"}번` : "연결 없음",
          "",
        ]);
      }
    }
    // UTF-8 BOM helps spreadsheet apps recognize Korean. Escape formula-like input.
    const safe = (v: string) => {
      const text = /^[=+@\-]/.test(v) ? `'${v}` : v;
      return `"${text.replace(/"/g, '""')}"`;
    };
    const csv = "\ufeff" + cells.map(row => row.map(safe).join(",")).join("\r\n");
    const url = URL.createObjectURL(new Blob([csv], {type:"text/csv;charset=utf-8"}));
    const link = document.createElement("a");
    link.href = url; link.download = "itda-street-shooting-checklist.csv";
    document.body.appendChild(link);link.click();link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    setMessage(`${nodes.length}개 촬영 지점의 방향별 사진 점검표를 내려받았어요. 실제 촬영할 위치와 방향은 현장에서 확인해 주세요.`);
  };
  const uploadMap=async(file?:File)=>{
    if(!file)return;
    try{await saveDraftMap(file);setMessage("지도 이미지를 이 브라우저에 등록했어요. 외부에 공개되거나 서버에 업로드되지는 않습니다.");}
    catch(e){setMessage(e instanceof Error?e.message:"지도 파일을 읽을 수 없습니다.");}
  };
  const importSetup=async(file?:File)=>{
    if(!file)return;
    try{
      const parsed:unknown=JSON.parse(await file.text());
      if(!parsed||typeof parsed!=="object") throw new Error("설정 형식을 확인해 주세요.");
      const v=parsed as {geometry?:MapGeometry,nodes?:StreetNode[]};
      if(!v.geometry||!Array.isArray(v.geometry.boundary)||!v.geometry.boundary.every(isPlainPoint)|| (v.geometry.passages!==undefined && (!Array.isArray(v.geometry.passages)||!v.geometry.passages.every(p=>Array.isArray(p)&&p.every(isPlainPoint)))) ||
         !v.geometry.nodes||!Object.values(v.geometry.nodes).every(isPlainPoint)||
         !v.geometry.stores||!Object.values(v.geometry.stores).every(isPlainPoint)||
         !Array.isArray(v.nodes)||!v.nodes.length||!v.nodes.every(n=>n&&typeof n.id==="string"&&Array.isArray(n.connections))) throw new Error("설정 항목이 누락됐습니다.");
      saveMapGeometry({...v.geometry,passages:v.geometry.passages||[]}); saveStreetNodes(v.nodes);
      setGeometry(readMapGeometry());setNodes(readStreetNodes());setSelectedNode(v.nodes[0].id);
      setMessage("설정 JSON을 가져왔어요. 지도 이미지·사진 파일은 별도로 등록해야 합니다.");
    }catch(e){setMessage(e instanceof Error?e.message:"JSON 파일을 가져오지 못했어요.");}
  };
  return <main className="map-editor-page">
    <header className="map-editor-top"><a href={sameOriginPreview()}><ArrowLeft size={16}/> 소비자 화면으로</a><strong>맛&멋 AI Street · 전체 상권 지도 편집</strong><a href={appUrl("editor","/street-editor")}><Camera size={16}/> 거리 사진 편집</a></header>
    <section className="map-editor-head"><span>AREA MAPPING · 현장 준비</span><h1>송도 타임스페이스 전체 지도</h1><p>선으로 둘러싼 상권 전체를 관리 범위로 설정하고, 건물·통로를 따라 촬영 지점과 가게 위치를 지정하는 도구입니다. 현재 기본 좌표는 시범용이며 실제 지형·거리·방향을 나타내지 않습니다.</p></section>
    <div className="map-editor-layout">
      <section className="map-editor-map-panel">
        <div className="map-editor-map-title"><h2><MapPinned size={18}/> 지도 위에서 위치 지정</h2><span>{mode==="boundary"?"상권 외곽선을 순서대로 클릭":mode==="passage"?"실제 보행 가능한 통로를 이어 클릭":mode==="node"?"선택한 촬영 지점의 위치를 클릭":"선택한 가게 위치를 클릭"}</span></div>
        <div className="map-editor-switch" role="group" aria-label="지도 편집 모드">
          <button className={mode==="boundary"?"selected":""} onClick={()=>setMode("boundary")}>① 상권 경계</button>
          <button className={mode==="passage"?"selected":""} onClick={()=>setMode("passage")}>② 보행 통로</button>
          <button className={mode==="node"?"selected":""} onClick={()=>setMode("node")}>③ 촬영 지점</button>
          <button className={mode==="store"?"selected":""} onClick={()=>setMode("store")}>④ 점포 위치</button>
        </div>
        <svg className="map-editor-svg" viewBox="0 0 500 374" role="img" aria-label="상권 지도 이미지에 경계와 촬영 지점, 가게 좌표를 배치하는 작업 화면" onClick={mapClick}>
          {mapUrl?<image href={mapUrl} x="0" y="0" width="500" height="374" preserveAspectRatio="none"/>:<><rect width="500" height="374" fill="#edf4f8"/><path d="M0 64H500M0 335H500M63 0V374M441 0V374" stroke="white" strokeWidth="25"/><path d="M113 290 L164 202 L310 165 L361 274" stroke="white" strokeWidth="24" fill="none" strokeLinecap="round"/><text x="250" y="45" fontSize="13" fill="#5c758b" textAnchor="middle">지도 배경 미등록 · 좌표는 임시 도식</text></>}
          {geometry.passages.map((path,i)=>path.length>=2?<polyline key={`path${i}`} points={path.map(p=>`${p.x},${p.y}`).join(" ")} fill="none" stroke="#17a398" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="8 5" pointerEvents="none"/>:null)}
          {geometry.passages.map((path,i)=>path.map((p,j)=><circle key={`path${i}-${j}`} cx={p.x} cy={p.y} r="3.5" fill="#0d9488" stroke="white" strokeWidth="1.5"/>))}
          {geometry.boundary.length>1&&<polyline points={geometry.boundary.map(p=>`${p.x},${p.y}`).join(" ")} fill="none" stroke="#fb923c" strokeWidth="3" strokeDasharray="8 5"/>}
          {geometry.boundary.length>=3&&<polygon points={geometry.boundary.map(p=>`${p.x},${p.y}`).join(" ")} fill="#f59e0b19" stroke="#f97316" strokeWidth="2"/>}
          {geometry.boundary.map((p,i)=><g key={`b${i}`}><circle cx={p.x} cy={p.y} r="5" fill="#ea580c" stroke="white" strokeWidth="2"/><text x={p.x+7} y={p.y-5} fontSize="9" fill="#9a3412">{i+1}</text></g>)}
          {nodes.map(n=>{const p=geometry.nodes[n.id];return p?<g key={n.id}><circle cx={p.x} cy={p.y} r={n.id===selectedNode?"15":"12"} fill={n.id===selectedNode?"#1d4ed8":"#4695ce"} stroke="white" strokeWidth="2"/><text x={p.x} y={p.y+4} fontSize="12" fontWeight="bold" textAnchor="middle" fill="white">{n.number}</text></g>:null;})}
          {stores.filter(s => floor === "전체" || s.floor === floor).map(s=>{const p=geometry.stores[String(s.id)];return p?<g key={s.id}><rect x={p.x-12} y={p.y-11} width="24" height="21" rx="7" fill={s.type==="맛"?"#246ec8":"#936440"} stroke="white" strokeWidth="1.5"/><text x={p.x} y={p.y+4} fontSize="10" textAnchor="middle" fill="white">{s.id}</text></g>:null;})}
        </svg>
        <div className="map-editor-floor-filter" role="group" aria-label="지도에서 표시할 점포 층 선택">
          <strong>지도에 표시할 층</strong>
          {(["전체",1,2,3] as const).map(item => <button key={item} type="button" className={floor===item?"active":""} aria-pressed={floor===item} onClick={()=>setFloor(item)}>{item==="전체"?"전체 층":`${item}층`} <small>{stores.filter(store => item==="전체" || store.floor===item).length}</small></button>)}
        </div>
        <div className="map-editor-legend"><span>🟠 상권 경계</span><span>🟢 보행 통로</span><span>🔵 촬영 지점</span><span>▣ 예시 점포</span></div>
        <div className="map-editor-map-actions"><label className="map-editor-file"><Upload size={15}/> 지도 이미지 등록<input ref={fileInput} type="file" accept="image/png,image/jpeg,image/webp" onChange={e=>{void uploadMap(e.target.files?.[0]);e.target.value="";}}/></label><button onClick={()=>{void deleteDraftMap();setMessage("브라우저에서 지도 이미지를 해제했어요.");}} disabled={!mapUrl}>지도 이미지 해제</button></div>
        <p className="map-editor-warning"><Info size={14}/> 네이버 지도 화면을 참고용으로 등록할 수는 있지만, 공개 홈페이지에 이미지를 배포하기 전 지도 서비스 이용약관과 이미지 사용 권한을 확인하세요. 지도 원본은 브라우저에만 저장됩니다.</p>
      </section>
      <aside className="map-editor-side">
        <h2>위치·동선 설정</h2>
        {mode==="boundary"&&<div className="map-editor-controls"><p>공모전 대상 구역을 표시한 선을 따라 꼭짓점을 순서대로 클릭하세요. 마지막 점은 첫 점과 자동으로 연결됩니다.</p><div className="map-editor-row"><button onClick={()=>setGeometry(g=>({...g,boundary:g.boundary.slice(0,-1)}))} disabled={!geometry.boundary.length}>마지막 점 취소</button><button onClick={()=>setGeometry(g=>({...g,boundary:[]}))} disabled={!geometry.boundary.length}>경계 다시 그리기</button></div><strong>경계점 {geometry.boundary.length}개</strong></div>}
        {mode==="passage"&&<div className="map-editor-controls"><p>실제 보행자가 지나다닐 수 있는 통로를 따라 차례로 점을 찍으세요. 건물이나 막힌 통로를 가로지르지 않게 표시해야 합니다.</p><label>편집할 통로<select value={activePassage} onChange={e=>setActivePassage(Number(e.target.value))}>{Array.from({length:Math.max(geometry.passages.length,1)},(_,i)=><option key={i} value={i}>{i+1}번 통로</option>)}</select></label><div className="map-editor-row"><button onClick={()=>{setGeometry(g=>({...g,passages:[...g.passages,[]]}));setActivePassage(geometry.passages.length);}}><Plus size={15}/> 새 통로</button><button onClick={()=>setGeometry(g=>({...g,passages:g.passages.map((p,i)=>i===activePassage?p.slice(0,-1):p)}))}>마지막 점 취소</button><button onClick={()=>{setGeometry(g=>({...g,passages:g.passages.filter((_,i)=>i!==activePassage)}));setActivePassage(0);}}>선택 통로 삭제</button></div><strong>등록된 통로 {geometry.passages.filter(p=>p.length>=2).length}개</strong></div>}
        {mode==="node"&&<div className="map-editor-controls"><label>촬영 지점<select value={selectedNode} onChange={e=>setSelectedNode(e.target.value)}>{nodes.map(n=><option key={n.id} value={n.id}>{n.number}번 · {n.name}</option>)}</select></label><label>지점 이름<input value={selected.name} onChange={e=>updateNode({name:e.target.value})}/></label><label>위치 설명<input value={selected.subtitle} onChange={e=>updateNode({subtitle:e.target.value})}/></label><div className="map-editor-row"><button onClick={addNode}><Plus size={15}/> 새 지점</button><button onClick={deleteNode} disabled={defaultNodes.some(n=>n.id===selectedNode)}><Trash2 size={15}/> 지점 삭제</button></div><div className="map-editor-divider"/><h3>인접 지점 연결</h3><p>거리 사진에서 이동 버튼을 누르면 연결된 지점으로 이동해요. 실제 통행 가능한 길에만 연결하세요.</p>{vw.map(d=><label key={d}>{directionNames[d]} 방향<select value={selected.connections.find(c=>c.direction===d)?.to||""} onChange={e=>connectNode(d,e.target.value)}><option value="">연결 없음</option>{nodes.filter(n=>n.id!==selectedNode).map(n=><option key={n.id} value={n.id}>{n.number}번 · {n.name}</option>)}</select></label>)}</div>}
        {mode==="store"&&<div className="map-editor-controls"><label>등록 가게<select value={selectedStore} onChange={e=>setSelectedStore(Number(e.target.value))}>{stores.map(s=><option value={s.id} key={s.id}>{s.name} · {s.building} {s.floor}층</option>)}</select></label><p>점포 아이콘의 좌표를 지정하고, 실제 가게가 보이는 촬영 지점을 선택하세요. 2·3층은 동일 건물의 1층 출입구 위치에 표시할 수도 있습니다.</p><label>가게와 연결할 지점<select value={nodes.find(n=>n.stores.includes(selectedStore))?.id||""} onChange={e=>setNodes(prev=>prev.map(n=>({...n,stores:n.id===e.target.value?[...new Set([...n.stores,selectedStore])]:n.stores.filter(id=>id!==selectedStore)})))}><option value="">미연결</option>{nodes.map(n=><option value={n.id} key={n.id}>{n.number}번 · {n.name}</option>)}</select></label><p>가게명과 층수는 <a href="/catalog">점포 등록·게시 관리</a>에서 수정할 수 있어요. 현재 좌표는 이 브라우저 초안에만 저장됩니다.</p></div>}
        <div className="map-editor-divider"/>
        <button className="map-editor-save" onClick={saveAll}><Save size={17}/> 변경사항 저장</button>
        <p className="map-editor-status" role="status">{message}</p>
        <div className="map-editor-divider"/>
        <div className="map-editor-audit" aria-label="현장 자료 및 지점 연결 점검">
          <h3>현장 자료·연결 점검</h3>
          <p>현재 편집 중인 데이터의 확인 필요 항목입니다. 실제 위치와 도보 동선은 현장에서 검증해야 합니다.</p>
          <div className="map-editor-audit-counts"><span>촬영 지점 <b>{nodes.length}</b></span><span>사진 없는 지점 <b>{photosMissing.length}</b></span><span>점포 연결 누락 <b>{unmappedStores.length}</b></span></div>
          {missingCoordinates.length > 0 && <p className="audit-warning">지도 좌표 누락: {missingCoordinates.map(node=>`${node.number}번`).join(", ")}</p>}
          {networkWarnings.length > 0 && <ul>{networkWarnings.map((warning,i)=><li key={i}>{warning}</li>)}</ul>}
          {unmappedStores.length > 0 && <p className="audit-warning">촬영 지점 미연결 가게: {unmappedStores.map(s=>s.name).join(", ")}</p>}
          {photosMissing.length > 0 && <p className="audit-warning">사진 미등록 지점: {photosMissing.map(n=>`${n.number}번`).join(", ")}</p>}
          {networkWarnings.length===0 && unmappedStores.length===0 && photosMissing.length===0 && missingCoordinates.length===0 && <p className="audit-ok">현재 데이터에서 자동 점검 경고가 없습니다. 실제 위치 검증은 별도로 필요합니다.</p>}
        </div>
        <button className="map-editor-data" type="button" onClick={exportShootPlan}><Download size={16}/> 촬영 계획표 CSV 내려받기</button>
        <h3>데이터 백업</h3><p className="map-editor-help">좌표·경계·연결 정보를 JSON으로 내려받아 보관하세요. 이미지는 JSON에 포함되지 않습니다.</p>
        <button className="map-editor-data" onClick={()=>downloadJSON("matmeot-map-setup.json",{version:2,geometry,nodes})}><Download size={16}/> 지도 설정 JSON 내보내기</button>
        <label className="map-editor-file full"><FileJson size={16}/> 설정 JSON 가져오기<input type="file" accept="application/json,.json" onChange={e=>{void importSetup(e.target.files?.[0]);e.target.value="";}}/></label>
        <p className="map-editor-help">편집 화면은 관리자 인증 뒤에 접근할 수 있습니다. 지도 초안은 이 브라우저에 저장되며, 공개하려면 점포 게시 화면에서 별도로 검토·게시해야 합니다. 지도 이미지는 서버에 게시되지 않습니다.</p>
      </aside>
    </div>
  </main>;
}
