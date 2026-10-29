import { useEffect, useMemo, useRef, useState } from "react";
import type { FormEvent } from "react";
import { ArrowLeft, CheckCircle2, CloudUpload, Download, FileUp, Layers, LockKeyhole, MapPinned, Plus, RefreshCcw, Save, ShieldCheck, Store, Trash2, UploadCloud } from "lucide-react";
import { appUrl } from "../config/site";
import { publicationConfigured, fetchPublication, preparePublication, publishSite, signInAdmin, type AdminSession, type PublishedResponse } from "../data/sitePublication";
import { readStoreDraft, saveStoreDraft, validStores } from "../data/storeDraft";
import { saveMapGeometry } from "../data/mapGeometry";
import { saveStreetNodes } from "../data/streetNetwork";
import { FACADE_KEY } from "../data/facadeAnnotations";
import type { StoreData, StoreType } from "../types/street";
import "../styles/CatalogEditor.css";

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
  const [session, setSession] = useState<AdminSession | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const upload = useRef<HTMLInputElement>(null);
  useEffect(() => { document.title = "ITDA · 점포 등록·게시 관리"; }, []);
  useEffect(() => {
    if (!publicationConfigured) return;
    let active = true;
    fetchPublication().then(value => { if (active) setRemote(value); })
      .catch(() => { if (active) setNotice("현재 공개 게시본을 불러오지 못했습니다. Supabase 연결을 확인하세요."); });
    return () => {active = false;};
  }, []);
  const current = rows.find(s => s.id === selected) || null;
  useEffect(() => { setTagsText(rows.find(s=>s.id===selected)?.tags.join(", ") || ""); }, [selected]);
  const filtered = useMemo(() => rows.filter(s => `${s.name} ${s.category} ${s.building} ${s.unit || ""}`.toLowerCase().includes(search.toLowerCase())), [rows,search]);
  const update = (newRows: StoreData[]) => {
    try { saveStoreDraft(newRows); setRows(newRows); setNotice("변경사항을 브라우저 임시 초안에 저장했어요. 아직 공개되지 않았습니다."); }
    catch (e) { setNotice(e instanceof Error ? e.message : "저장 실패"); }
  };
  const patch = (value: Partial<StoreData>) => update(rows.map(s => s.id === selected ? { ...s, ...value } : s));
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
  const login = async (event: FormEvent) => {
    event.preventDefault(); setLoading(true);
    try {
      const value = await signInAdmin(email.trim(), password);setSession(value);setPassword("");
      setNotice(`${value.email} 계정으로 관리 권한을 확인했어요. 게시 전 지도·점포 위치를 확인하세요.`);
    } catch(e) { setSession(null);setNotice(e instanceof Error ? e.message : "관리자 로그인을 확인하지 못했습니다."); }
    finally {setLoading(false);}
  };
  const loadPublished = () => {
    if (!remote) return;
    if (!confirm("현재 브라우저의 가게·지도·촬영 지점·외곽선 초안을 온라인 게시본으로 덮어쓸까요? 사진 파일은 바뀌지 않습니다.")) return;
    try {applyRemote(remote);setRows(readStoreDraft());setSelected(remote.data.stores[0]?.id ?? 0);setTagsText(remote.data.stores[0]?.tags.join(", ") || "");setNotice("온라인 게시본을 브라우저 초안으로 불러왔어요.");}
    catch(e){setNotice(e instanceof Error ? e.message : "복원 실패");}
  };
  const publish = async () => {
    if (!session) return;
    setLoading(true);
    try {
      const snapshot = preparePublication();
      if (!confirm(`가게 ${snapshot.stores.length}곳, 촬영 지점 ${snapshot.nodes.length}개, 외곽선 ${snapshot.facades.length}개, 지도 좌표를 전체 소비자에게 게시할까요?\n\n주의: 임시 사진 파일과 지도 배경 이미지는 게시되지 않습니다.`)) return;
      const date = await publishSite(snapshot, session);
      setRemote({data:snapshot,publishedAt:date});
      setNotice(`전체 게시가 완료됐어요 (${new Date(date).toLocaleString("ko-KR")}). customer.itda.ink에서 새로고침해 확인하세요.`);
    } catch(e) { setNotice(e instanceof Error ? e.message : "게시 중 오류가 발생했어요."); }
    finally {setLoading(false);}
  };
  const refresh = async () => {
    setLoading(true);
    try {const latest = await fetchPublication();setRemote(latest);setNotice(latest ? "서버 게시본을 확인했어요." : "아직 서버에 게시본이 없습니다.");}
    catch(e){setNotice(e instanceof Error ? e.message : "서버 연결 실패");}
    finally{setLoading(false);}
  };
  return <main className="catalog-page">
    <header className="catalog-header"><a href={appUrl("editor", "/editor")}><ArrowLeft size={17}/> 관리자 대시보드</a><strong>ITDA · 점포 데이터 관리</strong><a href={appUrl("editor", "/map-editor")}><MapPinned size={17}/> 지도 편집</a></header>
    <section className="catalog-heading"><span>STORE DATA & PUBLICATION</span><h1>가게를 등록하고, 검토한 뒤 게시하세요.</h1><p>이름·동·층·호수·홍보 정보는 여기서 수정하고, 실제 위치와 촬영 지점은 지도 편집기에서 지정합니다. 모든 변경은 게시하기 전까지 임시 초안입니다.</p></section>
    <div className="catalog-stats">
      <div><b>{rows.length}</b><small>브라우저 초안 가게</small></div><div><b>{remote ? remote.data.stores.length : "—"}</b><small>온라인 게시 가게</small></div><div><b>{remote ? new Date(remote.publishedAt).toLocaleDateString("ko-KR") : "미게시"}</b><small>마지막 온라인 게시</small></div>
    </div>
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
          <label>대표 상품·메뉴<input value={current.menu} onChange={e=>patch({menu:e.target.value})} maxLength={100}/></label>
          <label>가격 정보<input value={current.price} onChange={e=>patch({price:e.target.value})} maxLength={100}/></label>
          <label className="wide">이벤트·홍보 (선택)<textarea rows={2} value={current.event || ""} placeholder="행사 기간과 내용이 확인된 경우만 입력" onChange={e=>patch({event:e.target.value || undefined})} maxLength={1000}/></label>
          <label className="wide">검색 태그 (쉼표로 구분)<input value={tagsText} onChange={e=>{setTagsText(e.target.value);patch({tags:e.target.value.split(",").map(t=>t.trim()).filter(Boolean).slice(0,30)});}} placeholder="데이트, 조용한, 학생추천"/></label>
          <label>이동 안내 (실측 전 확인 필요)<input value={current.walking} onChange={e=>patch({walking:e.target.value})} maxLength={100}/></label>
          <label>추천 점수 (0~100, 시연용)<input type="number" min={0} max={100} value={current.aiScore} onChange={e=>patch({aiScore:Math.min(100,Math.max(0,Number(e.target.value)||0))})}/></label>
        </div>
        <p className="catalog-auto"><Save size={15}/> 입력 내용은 즉시 브라우저 초안에 저장돼요. <b>온라인 게시와는 별개</b>입니다.</p>
      </>}</section>
    </section>
    <section className="catalog-publish"><div className="catalog-publish-head"><div><span>PUBLICATION CONTROL</span><h2><CloudUpload size={20}/> 전체 데이터 게시</h2></div><span className={publicationConfigured?"catalog-cloud-ready":"catalog-cloud-off"}>{publicationConfigured?"Supabase 설정 감지됨":"서버 연결 전 · 시연 모드"}</span></div>
      <p>게시 범위: <b>점포 목록 + 층수 + 지도 좌표·통로 + 촬영 지점 + 가게 외곽선</b>. 실제 사진 파일과 지도 배경 이미지는 포함되지 않으며, 별도 파일 저장소 연결이 필요해요.</p>
      {publicationConfigured ? <>
        {session ? <div className="catalog-signed"><ShieldCheck size={19}/><span>관리자: <strong>{session.email}</strong> · {new Date(session.expiresAt).toLocaleTimeString("ko-KR")}까지 로그인 유효</span><button type="button" onClick={()=>setSession(null)}>로그아웃</button></div> :
          <form className="catalog-login" onSubmit={e=>void login(e)}><div><LockKeyhole size={17}/><strong>관리자 로그인</strong><small>Supabase Auth 계정이며 관리자 목록에 등록돼 있어야 합니다.</small></div><input type="email" autoComplete="username" placeholder="관리자 이메일" value={email} onChange={e=>setEmail(e.target.value)} required/><input type="password" autoComplete="current-password" placeholder="비밀번호" value={password} onChange={e=>setPassword(e.target.value)} required/><button type="submit" disabled={loading}>권한 확인</button><a className="catalog-reset-link" href="/reset-password">비밀번호를 만든 적이 없거나 잊으셨나요?</a></form>}
      </>:<p className="catalog-hint">Vercel 환경변수와 Supabase SQL 설정을 끝내면 관리자 로그인과 게시 버튼이 활성화돼요. 지금은 브라우저 초안으로 기능을 테스트할 수 있어요.</p>}
      <div className="catalog-actions"><button className="catalog-primary" type="button" disabled={!publicationConfigured || !session || loading} onClick={()=>void publish()}><UploadCloud size={17}/> {loading?"처리 중…":"관리자 승인 · 전체 게시"}</button><button type="button" disabled={!publicationConfigured || loading} onClick={()=>void refresh()}><RefreshCcw size={16}/> 게시본 확인</button><button type="button" disabled={!remote || loading} onClick={loadPublished}><Layers size={16}/> 공개본을 초안으로 가져오기</button></div>
      <p className="catalog-notice" role="status"><CheckCircle2 size={16}/>{notice}</p>
      <p className="catalog-caution">※ `editor.itda.ink` 주소 자체는 보안 장치가 아니에요. 게시 권한은 Supabase Auth와 데이터베이스 RLS로 검증합니다. 지도·사진의 로컬 편집 기능에는 별도의 접근 보호를 추가해야 합니다.</p>
    </section>
  </main>;
}
