import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, CheckCircle2, ClipboardCheck, RefreshCw, ShieldCheck, XCircle } from "lucide-react";
import { appUrl } from "../config/site";
import { useAdminAuth } from "../auth/AdminGate";
import { fetchPublication } from "../data/sitePublication";
import { fetchPromotionRequests, reviewPromotion, type PromotionRequest } from "../data/promotionWorkflow";
import type { StoreData } from "../types/street";
import "../styles/PromotionReview.css";

export default function PromotionReview() {
  const { session, getSession } = useAdminAuth();
  const [requests,setRequests] = useState<PromotionRequest[]>([]);
  const [stores,setStores] = useState<StoreData[]>([]);
  const [busy,setBusy] = useState(false);
  const [notice,setNotice] = useState("점주가 제출한 홍보안을 검토하고, 승인 시 소비자 홈페이지에 게시합니다.");
  const pending = useMemo(()=>requests.filter(r=>r.status==="pending"),[requests]);
  const completed = useMemo(()=>requests.filter(r=>r.status!=="pending"),[requests]);

  const refresh = async () => {
    setBusy(true);
    try {
      const current = await getSession();
      const [items, published] = await Promise.all([
        fetchPromotionRequests(current.token),fetchPublication(),
      ]);
      setRequests(items);setStores(published?.data.stores || []);
      setNotice(`요청 ${items.length}건 중 검토 대기 ${items.filter(item=>item.status==="pending").length}건을 확인했어요.`);
    } catch(e){setNotice(e instanceof Error?e.message:"요청 목록을 불러오지 못했어요.");}
    finally{setBusy(false);}
  };
  useEffect(()=>{document.title="ITDA · 점주 홍보안 검토";void refresh();},[]); // only initial mount

  const review = async (request: PromotionRequest, approve:boolean) => {
    const store = stores.find(s=>s.id===request.store_id);
    const action = approve?"승인하고 소비자용에 즉시 게시":"반려";
    if (!window.confirm(`${store?.name||`가게 #${request.store_id}`}의 '${request.title}' 홍보안을 ${action}할까요?\n\n승인하면 해당 점포의 현재 공개 이벤트 문구가 바뀝니다.`)) return;
    setBusy(true);setNotice("");
    try {
      const current = await getSession();
      await reviewPromotion(current.token,request.id,approve);
      const [items,published] = await Promise.all([fetchPromotionRequests(current.token),fetchPublication()]);
      setRequests(items);setStores(published?.data.stores||[]);
      setNotice(approve ? "승인했습니다. 소비자용에 갱신된 이벤트 문구가 게시됐어요." : "반려했습니다. 소비자에게 표시되지 않습니다.");
    } catch(e){setNotice(e instanceof Error?e.message:"검토 결과를 저장하지 못했어요.");}
    finally{setBusy(false);}
  };
  const storeName = (id:number) => stores.find(s=>s.id===id)?.name || `점포 #${id}`;
  return <main className="itda-review-page"><div className="itda-review-container">
    <header className="itda-review-top"><a href={appUrl("editor","/editor")}><ArrowLeft size={16}/> 관리자 대시보드</a><strong>ITDA · 점주 홍보안 검토</strong><a href={appUrl("customer")}>소비자용 보기</a></header>
    <section className="itda-review-intro"><span>OWNER SUBMISSIONS · APPROVAL</span><h1>점주 홍보안을 검토하세요.</h1>
      <p>담당 점포로 인증한 점주가 제안한 홍보안만 접수됩니다. 관리자가 승인하면 공개 점포 정보의 이벤트가 바로 변경됩니다. 아직 홍보 문구 생성 자체는 AI가 아닌 예시 기반입니다.</p>
      <div className="itda-review-stats"><span><b>{pending.length}</b> 검토 대기</span><span><b>{completed.length}</b> 처리 완료</span><span><ShieldCheck size={16}/> {session.email}</span></div>
      <button className="itda-review-refresh" type="button" disabled={busy} onClick={()=>void refresh()}><RefreshCw size={16}/> {busy?"확인 중…":"목록 새로고침"}</button>
      <p className="itda-review-notice" role="status">{notice}</p>
    </section>
    <section className="itda-review-section"><h2>검토 대기 · {pending.length}건</h2>
      {!pending.length && <div className="itda-review-empty"><ClipboardCheck size={24}/><p>현재 검토할 요청이 없습니다. 먼저 점주 계정을 점포에 배정하고 홍보안을 제출해야 합니다.</p></div>}
      {pending.map(item=><article className="itda-review-card" key={item.id}>
        <div className="itda-review-card-head"><div><small>{storeName(item.store_id)} · {new Date(item.created_at).toLocaleString("ko-KR")}</small><h3>{item.title}</h3></div><span className="itda-review-pill">승인 대기</span></div>
        <div className="itda-review-copy"><strong>소비자 거리 노출 문구</strong><p>{item.street_copy}</p></div>
        <div className="itda-review-details"><div><b>종료일</b><span>{item.ends_on}</span></div><div><b>SNS 예시</b><p>{item.sns_copy}</p></div><div><b>숏폼 대본</b><p>{item.short_script}</p></div></div>
        <div className="itda-review-actions"><button type="button" className="itda-review-approve" disabled={busy || item.ends_on < new Date().toISOString().slice(0,10)} onClick={()=>void review(item,true)}><CheckCircle2 size={17}/> 승인 · 소비자 게시</button><button type="button" disabled={busy} onClick={()=>void review(item,false)}><XCircle size={17}/> 반려</button></div>
      </article>)}
    </section>
    <section className="itda-review-section"><h2>처리 완료 · 최근 {completed.length}건</h2>
      <div className="itda-review-history">{completed.length ? completed.slice(0,20).map(item=><div key={item.id}><span>{storeName(item.store_id)} · {item.title}</span><b className={item.status==="approved"?"approved":"rejected"}>{item.status==="approved"?"승인":"반려"}</b></div>) : <p>아직 처리 내역이 없습니다.</p>}</div>
    </section>
    <p className="itda-review-footnote">※ 동일 가게에 여러 홍보안이 승인되면 마지막 승인된 문구가 공개됩니다. 홍보 종료일 이후에는 소비자 화면에서 해당 이벤트가 숨겨집니다. 계정과 점포 연결은 Supabase의 itda_owner_stores 테이블에서 관리합니다.</p>
  </div></main>;
}
