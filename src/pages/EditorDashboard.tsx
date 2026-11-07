import "../styles/ServiceUpgrade.css";
import { useEffect, useRef, useState } from "react";
import { ArrowRight, Camera, CheckCircle2, ClipboardList, Clock3, Download, FileUp, MapPinned, Settings, Store } from "lucide-react";
import { appUrl } from "../config/site";
import { useAdminAuth } from "../auth/adminAuth";
import EditorShell from "../components/EditorShell";
import { readMapGeometry } from "../data/mapGeometry";
import { getFacadeAnnotations } from "../data/facadeAnnotations";
import { listDraftPhotos } from "../data/localStreetPhotos";
import { readStreetNodes } from "../data/streetNetwork";
import { downloadEditorBackup, importEditorBackup } from "../data/editorBackup";
import { useStoreDraft } from "../data/storeDraft";
import { usePublicSite } from "../data/sitePublication";
import { fetchPromotionPolicy, type PromotionPolicy } from "../data/promotionWorkflow";
import { useMediaDraft } from "../data/mediaStorage";
import { dataSources, researchFolders } from "../data/dataSources";

export default function EditorDashboard() {
  const { getSession } = useAdminAuth();
  const media = useMediaDraft();
  const drafts = useStoreDraft();
  const publication = usePublicSite();
  const stores = publication.data?.stores || drafts;
  const source = publication.data ? "서버 게시본" : "브라우저 초안";
  const [photoCount,setPhotoCount] = useState<number | null>(null);
  const [busy,setBusy] = useState(false);
  const [notice,setNotice] = useState("점포·지도·사진 작업은 초안에 저장됩니다. 점주 홍보 문구는 일일 한도 안에서 직접 게시됩니다.");
  const [policy,setPolicy] = useState<PromotionPolicy | null>(null);
  const [policyNotice,setPolicyNotice] = useState("");
  const input = useRef<HTMLInputElement>(null);
  const [metrics,setMetrics] = useState(() => ({nodes:readStreetNodes().length,facades:getFacadeAnnotations().length,boundary:readMapGeometry().boundary.length}));
  const refresh = () => {
    setMetrics({nodes:readStreetNodes().length,facades:getFacadeAnnotations().length,boundary:readMapGeometry().boundary.length});
    void listDraftPhotos().then(photos => setPhotoCount(photos.length)).catch(() => setPhotoCount(0));
  };
  useEffect(() => {
    document.title = "맛&멋 AI Street | 관리자";
    let active = true;
    // Metrics are read when state is created; only the photo count needs loading here.
    void listDraftPhotos().then(photos => { if(active) setPhotoCount(photos.length); }).catch(() => { if(active) setPhotoCount(0); });
    void getSession().then(current => fetchPromotionPolicy(current.token)).then(next => { if(active) setPolicy(next); }).catch(error => { if(active) setPolicyNotice(error instanceof Error ? error.message : "게시 정책을 불러오지 못했습니다."); });
    return () => {active=false;};
  },[getSession]);
  const backup = async () => {
    setBusy(true);
    try { const count=await downloadEditorBackup();setNotice(`점포·지도·외곽선·촬영 지점과 이미지 ${count}개를 포함한 백업을 다운로드했습니다.`); }
    catch(error) { setNotice(error instanceof Error ? error.message : "백업을 만들지 못했습니다."); }
    finally {setBusy(false);}
  };
  const restore = async (file?: File) => {
    if (!file || !window.confirm("현재 브라우저의 지도·사진·초안 정보를 백업 파일로 덮어쓸까요? 기존 초안을 먼저 백업해 주세요.")) return;
    setBusy(true);
    try {const count=await importEditorBackup(file);setNotice(`백업을 복원했습니다. 이미지 ${count}개를 포함한 설정이 이 브라우저에 저장됐습니다.`);refresh();}
    catch(error) {setNotice(error instanceof Error ? error.message : "백업을 복원하지 못했습니다.");}
    finally {setBusy(false);if(input.current)input.current.value="";}
  };
  const floors = [1,2,3].map(floor => ({floor,count:stores.filter(store => store.floor===floor).length}));
  const maximum = Math.max(1,...floors.map(item => item.count));
  return <EditorShell title="대시보드">
    <section className="editor-dashboard-metrics" aria-label="운영 현황">
      <article className="editor-dashboard-metric"><p>점포 수</p><strong>{stores.length}</strong><small>{source} 기준</small></article>
      <article className="editor-dashboard-metric"><p>촬영 지점</p><strong>{metrics.nodes}</strong><small>브라우저 편집 초안</small></article>
      <article className="editor-dashboard-metric"><p>임시 이미지</p><strong>{photoCount ?? "…"}</strong><small>현재 브라우저에 저장</small></article>
      <article className="editor-dashboard-metric"><p>점포당 게시 한도</p><strong>{policy ? `${policy.daily_limit}회` : "—"}</strong><small>{policy ? policy.enabled ? "하루 · 한국시간 자정 초기화" : "직접 게시 일시 중지" : "서버 설정 확인 필요"}</small></article>
    </section>
    {policyNotice && <p className="editor-notice" role="status">{policyNotice}</p>}
    <section className="editor-panel"><div className="editor-panel-heading"><h2>층별 점포 현황</h2><span>{source} · 총 {stores.length}곳</span></div>
      <div className="editor-dashboard-chart" role="img" aria-label={floors.map(item=>`${item.floor}층 ${item.count}곳`).join(", ")}>
        {floors.map(item => <div className="editor-dashboard-chart-row" key={item.floor}><span>{item.floor}층</span><div className="editor-dashboard-chart-track"><div className="editor-dashboard-chart-fill" style={{width:`${item.count/maximum*100}%`}} /></div><strong>{item.count}곳</strong></div>)}
      </div>
    </section>
    {/* Where the customer site's information comes from (src/data/dataSources.ts). Kept here, not on the customer screens. */}
    <section className="editor-panel editor-sources"><div className="editor-panel-heading"><h2>정보 출처</h2><span>{publication.data && publication.publishedAt ? `${new Date(publication.publishedAt).toLocaleDateString("ko-KR")} 게시본` : "기본 자료"} · 손님 화면에는 표시하지 않아요</span></div>
      <ul className="editor-source-list">
        {dataSources.map(item => <li key={item.topic}>
          <div className="editor-source-head"><strong>{item.topic}</strong><small>{item.asOf}</small></div>
          <p>{item.detail}</p>
          {item.links && <p className="editor-source-links">{item.links.map(link => <a key={link.url} href={link.url} target="_blank" rel="noreferrer">{link.label}</a>)}</p>}
        </li>)}
      </ul>
      <p className="editor-source-folders">원자료: {researchFolders.join(" · ")}</p>
    </section>
    <div className="editor-dashboard-bottom">
      <section className="editor-panel"><div className="editor-panel-heading"><h2>점포 목록</h2><a className="editor-more" href={appUrl("editor","/catalog")}>전체 관리 <ArrowRight size={15}/></a></div>
        {stores.slice(0,4).map(store => <a className="editor-dashboard-store" href={appUrl("editor","/catalog")} key={store.id}><span className="editor-dashboard-store-icon"><Store size={25}/></span><span><strong>{store.name}</strong><small>{store.category} · {store.building} {store.floor}층</small></span><ArrowRight size={18}/></a>)}
        {!stores.length && <p>아직 등록된 점포가 없습니다.</p>}
      </section>
      <section className="editor-panel"><div className="editor-panel-heading"><h2>운영 안내</h2><a className="editor-more" href={appUrl("editor","/promotions")}>게시 관리 <ArrowRight size={15}/></a></div>
        <a className="editor-dashboard-notice" href={`${appUrl("editor","/promotions")}#promotion-policy`}><Settings size={19}/><span>점주 직접 게시 · 점포당 하루 {policy?.daily_limit ?? 3}회 기본 한도</span></a>
        <a className="editor-dashboard-notice" href={appUrl("editor","/promotions")}><Clock3 size={19}/><span>게시 횟수는 한국시간 자정에 초기화됩니다.</span></a>
        <a className="editor-dashboard-notice" href={appUrl("editor","/promotions")}><ClipboardList size={19}/><span>매번 승인하지 않아도 됩니다. 필요할 때 게시 내역을 확인하고 중단하세요.</span></a>
      </section>
    </div>
    <section className="editor-panel"><div className="editor-panel-heading"><h2>편집 도구</h2><span>지도·사진·점포 게시 관리</span></div><div className="editor-dashboard-tools"><a className="editor-button" href={appUrl("editor","/catalog")}><Store size={17}/> 점포 등록·게시</a><a className="editor-button" href={appUrl("editor","/map-editor")}><MapPinned size={17}/> 지도 편집</a><a className="editor-button" href={appUrl("editor","/street-editor")}><Camera size={17}/> 거리 사진 편집</a><a className="editor-button" href={appUrl("editor","/promotions")}><ClipboardList size={17}/> 점주 게시 내역·한도</a></div><p>초안 외곽선 {metrics.facades}개 · 경계점 {metrics.boundary}개 · 서버 업로드 후 게시 대기 이미지 {Object.keys(media.photos).length+(media.map?1:0)}개</p></section>
    <section className="editor-panel" id="editor-backup"><div className="editor-panel-heading"><h2>작업 백업·복원</h2></div><p>점포와 지도·거리 사진을 JSON 파일로 내보내거나 다른 브라우저로 옮길 수 있습니다. 브라우저 초안은 서버 백업과 별개입니다.</p><div className="editor-dashboard-tools"><button className="editor-button" type="button" disabled={busy} onClick={()=>void backup()}><Download size={16}/> 사진 포함 전체 백업</button><label><FileUp size={16}/> 백업 가져오기<input ref={input} type="file" accept=".json,application/json" disabled={busy} onChange={event=>void restore(event.target.files?.[0])}/></label><button className="editor-button" type="button" onClick={refresh}><CheckCircle2 size={16}/> 현황 새로고침</button></div><p className="editor-notice" role="status">{notice}</p></section>
  </EditorShell>;
}
