import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, CheckCircle2, CloudUpload, Download, FileUp, Layers, MapPinned, Plus, RefreshCcw, Save, ShieldCheck, Store, Trash2, UploadCloud, X, FileCheck2 } from "lucide-react";
import { appUrl } from "../config/site";
import { publicationConfigured, fetchPublication, preparePublication, publishSite, type PublishedResponse, type SitePublication } from "../data/sitePublication";
import { useAdminAuth } from "../auth/adminAuth";
import { readStoreDraft, saveStoreDraft, validStores } from "../data/storeDraft";
import { saveMapGeometry } from "../data/mapGeometry";
import { saveStreetNodes } from "../data/streetNetwork";
import { FACADE_KEY } from "../data/facadeAnnotations";
import { saveMediaDraft, useMediaDraft } from "../data/mediaStorage";
import type { StoreData, StoreType } from "../types/street";
import "../styles/CatalogEditor.css";
import "../styles/ServiceUpgrade.css";
import { storeMenuItems } from "../data/storeMenuItems";
import SiteBrand from "../components/SiteBrand";
import { appendCStreetTour, cStreetTour, replaceWithCStreetTour } from "../data/cStreetTour";
import { validStorefrontImage } from "../data/storefrontImage";
import "../styles/StreetTour.css";

function downloadJson(filename: string, value: unknown) {
  const blob = new Blob([JSON.stringify(value, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a"); a.href = url; a.download = filename; a.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 2000);
}
const example = (id: number): StoreData => ({
  id, name: "새 점포", type: "맛", category: "업종 미확인", floor: 1, building: "동 확인 필요", unit: "",
  description: "현장 확인 후 소개를 등록하세요.", menu: "확인 필요", price: "가격 확인 필요",
  tags: [], walking: "위치 확인 필요", aiScore: 0,
});
function applyRemote(remote: PublishedResponse) {
  saveStoreDraft(remote.data.stores);
  saveMapGeometry(remote.data.geometry);
  saveStreetNodes(remote.data.nodes);
  localStorage.setItem(FACADE_KEY, JSON.stringify(remote.data.facades));
  saveMediaDraft(remote.data.media || {photos:{}});
  window.dispatchEvent(new Event("matmeot-facades-changed"));
}
export default function CatalogEditor() {
  const [rows, setRows] = useState<StoreData[]>(readStoreDraft);
  const [selected, setSelected] = useState(rows[0]?.id ?? 0);
  const [search, setSearch] = useState("");
  const [tagsText, setTagsText] = useState(() => rows[0]?.tags.join(", ") || "");
  const [notice, setNotice] = useState("가게 수정 내용은 현재 브라우저의 임시 초안으로 저장됩니다. '전체 게시' 전까지 방문자에게 반영되지 않습니다.");
  const [remote, setRemote] = useState<PublishedResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const { session, getSession, demo } = useAdminAuth();
  const mediaDraft = useMediaDraft();
  const upload = useRef<HTMLInputElement>(null);
  const review = useRef<HTMLDialogElement>(null);
  const publicationInFlight = useRef(false);
  const [reviewSnapshot,setReviewSnapshot]=useState<SitePublication|null>(null);
  const [reviewConfirmed,setReviewConfirmed]=useState(false);
  useEffect(() => { document.title = "맛&멋 AI Street | 관리자"; }, []);
  useEffect(() => {
    if (!publicationConfigured) return;
    let active = true;
    fetchPublication().then(value => { if (active) setRemote(value); })
      .catch(() => { if (active) setNotice("현재 공개 게시본을 불러오지 못했습니다. Supabase 연결을 확인하세요."); });
    return () => {active = false;};
  }, []);
  const current = rows.find(s => s.id === selected) || null;
  // Load the tag text when the selected store changes (not on every edit to that store).
  const [tagsFor, setTagsFor] = useState(selected);
  if (tagsFor !== selected) { setTagsFor(selected); setTagsText(current?.tags.join(", ") || ""); }
  const filtered = useMemo(() => rows.filter(s => `${s.name} ${s.category} ${s.building} ${s.unit || ""}`.toLowerCase().includes(search.toLowerCase())), [rows,search]);
  const update = (newRows: StoreData[]) => {
    try { saveStoreDraft(newRows); setRows(newRows); setNotice("변경사항을 브라우저 임시 초안에 저장했어요. 아직 공개되지 않았습니다."); }
    catch (e) { setNotice(e instanceof Error ? e.message : "저장 실패"); }
  };
  const patch = (value: Partial<StoreData>) => update(rows.map(s => s.id === selected ? { ...s, ...value } : s));
  const importCStreet = () => {
    if (!confirm("C동 실제 촬영 자료(가게 3곳·사진 지점 2곳)를 기존 초안에 추가할까요? 기존 자료는 유지되며 전체 게시 전까지 공개되지 않습니다. 지도 위치는 임시 배치입니다.")) return;
    try {
      const next = appendCStreetTour(preparePublication());
      applyRemote({data:next,publishedAt:""});
      setRows(next.stores);setSelected(cStreetTour.stores[0].id);
      setNotice("C동 촬영 자료를 초안에 추가했어요. 거리 사진 편집에서 방향별 카드와 순서를 확인하고, 지도 편집에서 정확한 위치를 지정해 주세요. 아직 공개되지 않았습니다.");
    } catch(error) {setNotice(error instanceof Error?error.message:"촬영 자료를 불러오지 못했어요.");}
  };
  const replaceWithCStreet = () => {
    try {
      const base = remote?.data || preparePublication();
      const oldNodes = base.nodes.map(node => node.name).join(", ") || "없음";
      const oldStores = base.stores.filter(store => !cStreetTour.stores.some(item => item.id === store.id)).map(store => store.name).join(", ") || "없음";
      const oldPhotos = Object.keys(base.media?.photos || {}).length;
      if (!confirm(`${remote ? "온라인 게시본" : "현재 초안"}의 시험 자료를 C동 실제 촬영 자료(/street-demo와 같은 내용)로 바꿀까요?\n\n지워지는 가게: ${oldStores}\n지워지는 촬영 지점: ${oldNodes}\n연결이 끊기는 업로드 사진: ${oldPhotos}장 · 가게 외곽선과 지도 동선도 지워집니다.\n\n지도 배경은 유지됩니다. 브라우저 초안만 바뀌며, '전체 게시'를 눌러야 손님 화면에 반영됩니다.`)) return;
      const next = replaceWithCStreetTour(base);
      applyRemote({data:next,publishedAt:""});
      setRows(next.stores);setSelected(cStreetTour.stores[0].id);
      setNotice("촬영 지점을 C동 거리로 바꾼 초안을 만들었어요. 지도 편집에서 C동 지점 위치를 확인한 뒤 '전체 게시'를 눌러 주세요. 아직 공개되지 않았습니다.");
    } catch(error) {setNotice(error instanceof Error?error.message:"촬영 지점을 바꾸지 못했어요.");}
  };
  const add = () => { const id = Math.max(0, ...rows.map(s => s.id)) + 1; update([...rows, example(id)]); setSelected(id); };
  const remove = () => {
    if (!current || !confirm(`${current.name}을(를) 목록에서 삭제할까요? 실제 공개본은 '전체 게시' 전까지 유지됩니다.`)) return;
    const next = rows.filter(s => s.id !== current.id); update(next); setSelected(next[0]?.id ?? 0);
  };
  const importJson = async (file?: File) => {
    if (!file) return;
    try {
      if (file.size > 2_000_000) throw new Error("2MB 이하 점포 JSON만 가져올 수 있어요.");
      const candidate: unknown = JSON.parse(await file.text());
      if (!validStores(candidate)) throw new Error("점포 JSON 구조가 올바르지 않아요.");
      if (!confirm("현재 점포 초안 전체를 가져온 목록으로 바꿀까요?")) return;
      update(candidate);setSelected(candidate[0]?.id ?? 0);setTagsText(candidate[0]?.tags.join(", ") || "");
      setNotice(`${candidate.length}개 점포를 초안으로 가져왔어요. 아직 공개되지 않았습니다.`);
    } catch(e) { setNotice(e instanceof Error ? e.message : "파일을 가져오지 못했습니다."); }
    finally { if (upload.current) upload.current.value = ""; }
  };
  const loadPublished = () => {
    if (!remote) return;
    if (!confirm("현재 브라우저의 가게·지도·촬영 지점·외곽선·서버 사진 연결 초안을 온라인 게시본으로 덮어쓸까요? 브라우저에 저장한 원본 파일은 변경되지 않습니다.")) return;
    try {applyRemote(remote);setRows(readStoreDraft());setSelected(remote.data.stores[0]?.id ?? 0);setTagsText(remote.data.stores[0]?.tags.join(", ") || "");setNotice("온라인 게시본을 브라우저 초안으로 불러왔어요.");}
    catch(e){setNotice(e instanceof Error ? e.message : "복원 실패");}
  };
  const openReview = () => {
    try{setReviewSnapshot(preparePublication());setReviewConfirmed(false);setNotice('가게와 사진 연결 정보, 공개 범위를 확인해 주세요.');review.current?.showModal();}
    catch(error){setNotice(error instanceof Error?error.message:"게시할 초안을 확인해 주세요.");}
  };
  const publish = async () => {
    if (!session || !reviewSnapshot || !reviewConfirmed || publicationInFlight.current) return;
    publicationInFlight.current = true;
    setLoading(true);
    try {
      const snapshot = reviewSnapshot;
      // A promotion approved in another tab may change the publication since
      // this editor loaded it. Do not silently revert those public updates.
      const newest = await fetchPublication();
      if (newest && newest.publishedAt !== remote?.publishedAt) {
        setRemote(newest);
        setReviewConfirmed(false);
        setReviewSnapshot(null);
        review.current?.close();
        setNotice("온라인 게시본이 새로 갱신됐어요. 공개본을 확인하고 초안과 비교한 후 다시 검토해 주세요.");
        return;
      }
      const date = await publishSite(snapshot, await getSession());
      setRemote({data:snapshot,publishedAt:date});
      review.current?.close();
      setNotice(`전체 게시 완료 (${new Date(date).toLocaleString("ko-KR")}). 서버 사진 ${Object.keys(snapshot.media?.photos||{}).length}장 연결됨. customer.itda.ink에서 새로고침해 확인하세요.`);
    } catch(e) { setNotice(e instanceof Error ? e.message : "게시 중 오류가 발생했어요."); }
      finally {publicationInFlight.current = false;setLoading(false);}
  };
  const refresh = async () => {
    setLoading(true);
    try {const latest = await fetchPublication();setRemote(latest);setNotice(latest ? "서버 게시본을 확인했어요." : "아직 서버에 게시본이 없습니다.");}
    catch(e){setNotice(e instanceof Error ? e.message : "서버 연결 실패");}
    finally{setLoading(false);}
  };
  const changedStores=reviewSnapshot?.stores.filter(store=>JSON.stringify(store)!==JSON.stringify(remote?.data.stores.find(item=>item.id===store.id)))||[];
  const removedStores=remote?.data.stores.filter(store=>!reviewSnapshot?.stores.some(item=>item.id===store.id))||[];
  return <main className="catalog-page service-catalog">
    <header className="catalog-header"><a href={appUrl("editor", "/editor")}><ArrowLeft size={17}/> 관리자 대시보드</a><SiteBrand role="editor" /><a href={appUrl("editor", "/map-editor")}><MapPinned size={17}/> 지도 편집</a></header>
    <section className="catalog-heading"><span>STORE DATA & PUBLICATION</span><h1>가게를 등록하고, 검토한 뒤 게시하세요.</h1><p>이름·동·층·호수·홍보 정보는 여기서 수정하고, 실제 위치와 촬영 지점은 지도 편집기에서 지정합니다. 모든 변경은 게시하기 전까지 임시 초안입니다.</p></section>
    <div className="catalog-stats">
      <div><b>{rows.length}</b><small>브라우저 초안 가게</small></div><div><b>{remote ? remote.data.stores.length : "—"}</b><small>온라인 게시 가게</small></div><div><b>{remote ? new Date(remote.publishedAt).toLocaleDateString("ko-KR") : "미게시"}</b><small>마지막 온라인 게시</small></div>
    </div>
      <section className="catalog-tour-import"><div><strong>C동 실제 촬영 자료</strong><p>오락실·오봉집·세븐일레븐의 사진과 거리 입구·앞·뒤 사진을 초안에 추가합니다. 방향별 카드 추가·삭제·순서는 거리 사진 편집에서 관리해요.</p></div><a href="/street-demo" target="_blank" rel="noopener noreferrer">촬영 미리보기 ↗</a><button type="button" disabled={rows.some(store=>cStreetTour.stores.some(item=>item.id===store.id))} onClick={importCStreet}>{rows.some(store=>cStreetTour.stores.some(item=>item.id===store.id))?"초안에 추가됨":"촬영 자료 불러오기"}</button><button type="button" onClick={replaceWithCStreet}>시험 자료를 C동 실제 자료로 교체</button></section>
    <section className="catalog-management">
      <aside className="catalog-list"><div className="catalog-list-title"><h2>점포 목록</h2><button type="button" onClick={add}><Plus size={16}/> 추가</button></div><input aria-label="점포 찾기" placeholder="점포명·동·업종 검색" value={search} onChange={e=>setSearch(e.target.value)}/><div className="catalog-list-items">
        {filtered.map(s=><button type="button" key={s.id} className={selected===s.id?"active":""} onClick={()=>setSelected(s.id)}><span className={`catalog-indicator ${s.type==="맛"?"taste":"style"}`}>{s.floor}F</span><span><strong>{s.name}</strong><small>{s.building} {s.unit || ""} · {s.category}</small></span></button>)}
        {!filtered.length && <p>일치하는 점포가 없습니다.</p>}
      </div><div className="catalog-list-footer"><button type="button" onClick={()=>downloadJson(`itda-store-draft-${new Date().toISOString().slice(0,10)}.json`,rows)}><Download size={15}/> 초안 내보내기</button><label><FileUp size={15}/> 초안 가져오기<input ref={upload} type="file" accept=".json,application/json" onChange={e=>void importJson(e.target.files?.[0])}/></label></div></aside>
      <section className="catalog-form">{!current ? <div className="catalog-empty"><Store size={30}/><h2>등록된 점포가 없습니다</h2><p>점포를 새로 추가하거나 JSON 초안을 가져오세요.</p></div> : <>
        <div className="catalog-form-title"><div><span>STORE #{current.id}</span><h2>{current.name}</h2></div><button className="catalog-delete" type="button" onClick={remove}><Trash2 size={15}/> 삭제</button></div>
        <div className="catalog-fields">
          <label>가게 이름<input value={current.name} onChange={e=>patch({name:e.target.value})} maxLength={100}/></label>
          <label>구분<select value={current.type} onChange={e=>patch({type:e.target.value as StoreType})}><option value="맛">맛 · 음식·카페</option><option value="멋">멋 · 문화·서비스</option></select></label>
          <label>건물·동<input value={current.building} onChange={e=>patch({building:e.target.value})} maxLength={80}/></label>
          <label>층<select value={current.floor} onChange={e=>patch({floor:Number(e.target.value) as 1|2|3})}><option value={1}>1층</option><option value={2}>2층</option><option value={3}>3층</option></select></label>
          <label>호수<input value={current.unit || ""} onChange={e=>patch({unit:e.target.value})} placeholder="예: 201호" maxLength={100}/></label>
          <label>업종<input value={current.category} onChange={e=>patch({category:e.target.value})} placeholder="예: 한식 · 덮밥" maxLength={100}/></label>
          <label className="wide">소개<textarea rows={3} value={current.description} onChange={e=>patch({description:e.target.value})} maxLength={1000}/></label>
          <label className="wide">가게 카드 사진 주소 (선택)<input key={`photo-${current.id}-${current.storefrontImage||""}`} defaultValue={current.storefrontImage||""} placeholder="https://… 또는 /street/…jpg" maxLength={1000} onBlur={e=>{const value=e.target.value.trim();if(value&&!validStorefrontImage(value)){setNotice("사진은 HTTPS 주소 또는 /street/ 안의 JPG·PNG·WEBP 경로로 입력해 주세요.");e.target.value=current.storefrontImage||"";return;}patch({storefrontImage:value||undefined});}}/></label>
          {current.storefrontImage&&<div className="catalog-store-photo wide"><img src={current.storefrontImage} alt={`${current.name} 카드 사진`}/><p>손님 거리뷰의 가게 카드에 표시되는 실제 외관 사진입니다. 사진 주소는 입력을 마친 뒤 저장되며, 전체 게시 후 공개됩니다.</p></div>}
          <label>대표 상품·메뉴<input value={current.menu} onChange={e=>patch({menu:e.target.value})} maxLength={100}/></label>
          <label>가격 정보<input value={current.price} onChange={e=>patch({price:e.target.value})} maxLength={100}/></label>
          <fieldset className="catalog-menu-items wide"><legend>메뉴·서비스별 가격</legend><p>점주 매장 정보와 손님 상세 화면에 표시됩니다. 대표 메뉴·가격은 위 입력란에서 관리합니다.</p>
            {(current.menuItems || []).map((item, index) => <div className="catalog-menu-row" key={index}>
              <label>메뉴·서비스 {index + 1}<input aria-label={`메뉴·서비스 ${index + 1}`} value={item.name} maxLength={150} onChange={e => patch({menuItems: current.menuItems!.map((entry, i) => i === index ? {...entry, name: e.target.value} : entry)})}/></label>
              <label>가격<input aria-label={`메뉴 ${index + 1} 가격`} value={item.price} maxLength={150} onChange={e => patch({menuItems: current.menuItems!.map((entry, i) => i === index ? {...entry, price: e.target.value} : entry)})}/></label>
              <button type="button" aria-label={`메뉴 ${index + 1} 삭제`} onClick={() => patch({menuItems: current.menuItems!.filter((_, i) => i !== index)})}><Trash2 size={16}/></button>
            </div>)}
            <button type="button" disabled={(current.menuItems?.length || 0) >= 50} onClick={() => patch({menuItems: [...(current.menuItems || storeMenuItems(current)), {name: "", price: ""}].slice(0, 50)})}><Plus size={16}/> 메뉴·서비스 추가</button>
          </fieldset>
          <label className="wide">이벤트·홍보 (선택)<textarea rows={2} value={current.event || ""} placeholder="행사 기간과 내용이 확인된 경우만 입력" onChange={e=>patch({event:e.target.value || undefined})} maxLength={1000}/></label>
          <label>이벤트 종료일 (선택)<input type="date" value={current.eventUntil || ""} onChange={e=>patch({eventUntil:e.target.value || undefined})}/></label>
          <label className="wide">검색 태그 (쉼표로 구분)<input value={tagsText} onChange={e=>{setTagsText(e.target.value);patch({tags:e.target.value.split(",").map(t=>t.trim()).filter(Boolean).slice(0,30)});}} placeholder="데이트, 조용한, 학생추천"/></label>
          <label>이동 안내 (실측 전 확인 필요)<input value={current.walking} onChange={e=>patch({walking:e.target.value})} maxLength={100}/></label>
          <label>추천 점수 (0~100, 시연용)<input type="number" min={0} max={100} value={current.aiScore} onChange={e=>patch({aiScore:Math.min(100,Math.max(0,Number(e.target.value)||0))})}/></label>
        </div>
        <p className="catalog-auto"><Save size={15}/> 입력 내용은 즉시 브라우저 초안에 저장돼요. <b>온라인 게시와는 별개</b>입니다.</p>
      </>}</section>
    </section>
    <section className="catalog-publish"><div className="catalog-publish-head"><div><span>PUBLICATION CONTROL</span><h2><CloudUpload size={20}/> 전체 데이터 게시</h2></div><span className={publicationConfigured?"catalog-cloud-ready":"catalog-cloud-off"}>{publicationConfigured?"Supabase 설정 감지됨":"서버 연결 전 · 시연 모드"}</span></div>
      <p>게시 범위: <b>점포·층수·지도 좌표·촬영 지점·외곽선 + Supabase Storage에 업로드한 사진·지도 연결 정보</b>. 사진 원본은 Storage에 저장되고 이 게시본에는 해당 파일의 경로만 포함돼요.</p>
      <p>현재 게시 대기: <strong>서버 사진 {Object.keys(mediaDraft.photos).length}장 · 서버 지도 {mediaDraft.map?"1장":"없음"}</strong>. 브라우저 임시 이미지는 포함되지 않습니다. <a href="/street-editor">거리 사진 업로드</a> · <a href="/map-editor">지도 이미지 업로드</a></p>
      <div className="catalog-signed"><ShieldCheck size={19}/><span>{demo ? <><strong>발표용 둘러보기</strong> · 서버 게시는 관리자 로그인 후 가능</> : <>관리자: <strong>{session.email}</strong> · 서버 게시 권한 확인됨</>}</span></div>
      <div className="catalog-actions"><button className="catalog-primary" type="button" disabled={!publicationConfigured || !session || loading} onClick={openReview}><FileCheck2 size={17}/> {loading?"처리 중…":"검토하고 전체 게시"}</button><button type="button" disabled={!publicationConfigured || loading} onClick={()=>void refresh()}><RefreshCcw size={16}/> 게시본 확인</button><button type="button" disabled={!remote || loading} onClick={loadPublished}><Layers size={16}/> 공개본을 초안으로 가져오기</button></div>
      <p className="catalog-notice" role="status"><CheckCircle2 size={16}/>{notice}</p>
      <p className="catalog-caution">관리자 편집 화면은 로그인 후에 열립니다. 온라인 게시 권한은 Supabase Auth와 데이터베이스 RLS가 검증합니다. 다른 관리자 작업이 공개됐다면 최신 공개본을 먼저 확인하세요.</p>
    </section>
    <dialog ref={review} className="service-review-dialog" aria-labelledby="catalog-review-title"><header className="service-dialog-heading"><div><span className="service-kicker">READY TO SHARE</span><h2 id="catalog-review-title">검토한 정보를 공개할까요?</h2></div><button type="button" aria-label="게시 검토 닫기" disabled={loading} onClick={()=>review.current?.close()}><X size={22}/></button></header>{reviewSnapshot&&<><div className="service-review-summary"><div><strong>{reviewSnapshot.stores.length}곳</strong><span>전체 가게</span></div><div><strong>{changedStores.length}곳</strong><span>새 정보 · 변경</span></div><div><strong>{removedStores.length}곳</strong><span>삭제 예정</span></div></div><ul className="service-review-list">{changedStores.slice(0,6).map(store=><li key={store.id}><Store size={16}/>{store.name}<span>{store.building} {store.floor}층</span></li>)}</ul><p className="service-input-note">촬영 지점 {reviewSnapshot.nodes.length}개 · 방향별 가게 연결 {reviewSnapshot.nodes.reduce((count,node)=>count+Object.values(node.viewStores||{}).reduce((sum,ids)=>sum+ids.length,0),0)}개 · 서버 사진 {Object.keys(reviewSnapshot.media?.photos||{}).length}장</p><p className="service-input-note">이 게시본은 손님용에 공개됩니다. 브라우저에만 임시 저장한 사진은 공개되지 않습니다. 게시 전 백업을 확인해 주세요.</p><label className="service-confirm"><input type="checkbox" checked={reviewConfirmed} onChange={e=>setReviewConfirmed(e.target.checked)} disabled={loading}/><span>가게·메뉴·가격과 사진 연결을 확인했어요.<br/>현재 검토한 초안을 전체 게시합니다.</span></label><p className="service-notice" role="status">{notice}</p><div className="service-editor-actions"><button type="button" className="service-secondary" disabled={loading} onClick={()=>review.current?.close()}>더 검토하기</button><button type="button" className="service-primary" disabled={!reviewConfirmed||loading||!publicationConfigured} onClick={()=>void publish()}><UploadCloud size={16}/>{loading?"게시 중…":"전체 게시하기"}</button></div></>}</dialog>
  </main>;
}
