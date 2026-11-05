import { useEffect, useMemo, useState, type FormEvent } from "react";
import { ClipboardList, PauseCircle, RefreshCw, Save, ShieldCheck } from "lucide-react";
import EditorShell from "../components/EditorShell";
import { useAdminAuth } from "../auth/AdminGate";
import { fetchPublication } from "../data/sitePublication";
import { fetchPromotionRequests, fetchActivePromotions, fetchPromotionPolicy, updatePromotionPolicy, withdrawPromotion, promotionStatusLabel, type PromotionPolicy, type PromotionRequest } from "../data/promotionWorkflow";
import { koreanDate } from "../data/publicPromotions";
import type { StoreData } from "../types/street";

export default function PromotionReview() {
  const { session,getSession } = useAdminAuth();
  const [requests,setRequests] = useState<PromotionRequest[]>([]);
  const [activeRequests,setActiveRequests] = useState<PromotionRequest[]>([]);
  const [stores,setStores] = useState<StoreData[]>([]);
  const [policy,setPolicy] = useState<PromotionPolicy | null>(null);
  const [dailyLimit,setDailyLimit] = useState(3);
  const [enabled,setEnabled] = useState(true);
  const [busy,setBusy] = useState(false);
  const [notice,setNotice] = useState("점주는 일일 한도 안에서 직접 게시합니다. 관리자는 필요할 때 게시를 중단하거나 한도를 조정할 수 있습니다.");
  const active = useMemo(()=>activeRequests.filter(item=>item.status==="published" && item.ends_on>=koreanDate()),[activeRequests]);
  const history = useMemo(()=>requests.filter(item=>item.status!=="published" || item.ends_on<koreanDate()),[requests]);
  const refresh = async () => {
    setBusy(true);
    try {
      const current=await getSession();
      const [items,published,settings,live] = await Promise.allSettled([fetchPromotionRequests(current.token),fetchPublication(),fetchPromotionPolicy(current.token),fetchActivePromotions(current.token)]);
      const errors:string[]=[];
      if(items.status==="fulfilled")setRequests(items.value);else errors.push(items.reason instanceof Error?items.reason.message:"게시 내역을 불러오지 못했습니다.");
      if(live.status==="fulfilled")setActiveRequests(live.value);else errors.push("현재 게시 목록을 불러오지 못했습니다.");
      if(published.status==="fulfilled")setStores(published.value?.data.stores||[]);else errors.push("점포 정보를 불러오지 못했습니다.");
      if(settings.status==="fulfilled"){setPolicy(settings.value);setDailyLimit(settings.value.daily_limit);setEnabled(settings.value.enabled);}else{setPolicy(null);errors.push(settings.reason instanceof Error?settings.reason.message:"게시 정책을 불러오지 못했습니다.");}
      setNotice(errors.length?errors.join(" "):"게시 내역과 일일 한도를 확인했습니다. 반복적인 승인 작업은 필요하지 않습니다.");
    } catch(error){setNotice(error instanceof Error?error.message:"정보를 불러오지 못했습니다.");}
    finally{setBusy(false);}
  };
  useEffect(()=>{document.title = "맛&멋 AI Street | 관리자";void refresh();},[]);
  const savePolicy = async(event:FormEvent) => {
    event.preventDefault();
    if(!policy || busy || !Number.isInteger(dailyLimit) || dailyLimit<1 || dailyLimit>30)return;
    setBusy(true);
    try{const current=await getSession();const next=await updatePromotionPolicy(current.token,dailyLimit,enabled);setPolicy(next);setNotice(`점포당 하루 ${next.daily_limit}회 · 직접 게시 ${next.enabled?"사용":"일시 중지"} 설정을 저장했습니다.`);}
    catch(error){setNotice(error instanceof Error?error.message:"게시 정책을 저장하지 못했습니다.");}
    finally{setBusy(false);}
  };
  const withdraw = async(item:PromotionRequest) => {
    if(!window.confirm(`'${item.title}' 게시를 중단할까요? 현재 공개 중인 이 게시만 숨겨지며, 이미 사용한 게시 횟수는 되돌아가지 않습니다.`))return;
    setBusy(true);
    try{const current=await getSession();await withdrawPromotion(current.token,item.id);const [recent,live]=await Promise.all([fetchPromotionRequests(current.token),fetchActivePromotions(current.token)]);setRequests(recent);setActiveRequests(live);setNotice("게시를 중단했습니다. 소비자 페이지에 반영됩니다.");window.dispatchEvent(new Event("itda-publication-changed"));}
    catch(error){setNotice(error instanceof Error?error.message:"게시를 중단하지 못했습니다.");}
    finally{setBusy(false);}
  };
  const storeName=(id:number)=>stores.find(store=>store.id===id)?.name||`점포 #${id}`;
  return <EditorShell title="점주 홍보 게시 관리" active="promotions">
    <section className="editor-panel" id="promotion-policy">
      <div className="editor-panel-heading"><h2>점포별 직접 게시 정책</h2><ShieldCheck size={22}/></div>
      <p>같은 점포의 모든 점주 계정이 일일 한도를 공유합니다. 문구 교체도 1회이며, 중단한 게시도 사용 횟수에 포함됩니다. 횟수는 한국시간 자정에 초기화됩니다.</p>
      <form className="editor-promotion-policy" onSubmit={event=>void savePolicy(event)}><label>점포당 하루 게시 한도<input type="number" min="1" max="30" step="1" value={dailyLimit} onChange={event=>setDailyLimit(Number(event.target.value))} disabled={busy||!policy} required/></label><label className="editor-promotion-checkbox"><input type="checkbox" checked={enabled} onChange={event=>setEnabled(event.target.checked)} disabled={busy||!policy}/> 점주 직접 게시 허용</label><button className="editor-button" type="submit" disabled={busy||!policy}><Save size={16}/> 정책 저장</button></form>
      {!policy && <p>직접 게시를 사용하려면 서버 설정을 먼저 완료해 주세요. 설정이 확인되기 전에는 게시와 정책 변경이 비활성화됩니다.</p>}
    </section>
    <section className="editor-panel"><div className="editor-panel-heading"><h2>게시 현황</h2><button className="editor-button" type="button" disabled={busy} onClick={()=>void refresh()}><RefreshCw size={16}/> {busy?"확인 중…":"새로고침"}</button></div><div className="editor-promotion-stats"><span>현재 게시 <b>{active.length}</b>건</span><span>최근 내역 <b>{requests.length}</b>건</span><span>{session.email}</span></div><p className="editor-notice" role="status">{notice}</p></section>
    <section className="editor-panel"><div className="editor-panel-heading"><h2>현재 게시 중인 홍보</h2><span>종료일이 지나지 않은 직접 게시</span></div>
      {!active.length && <p className="editor-promotion-empty"><ClipboardList size={24}/> 현재 게시 중인 직접 게시 내역이 없습니다.</p>}
      {active.map(item=><article className="editor-promotion-card" key={item.id}><div className="editor-panel-heading"><div><small>{storeName(item.store_id)} · {new Date(item.created_at).toLocaleString("ko-KR",{timeZone:"Asia/Seoul"})}</small><h3>{item.title}</h3></div><span className="editor-promotion-state">직접 게시</span></div><p className="editor-promotion-copy">{item.street_copy}</p><p>종료일 {item.ends_on} · 한국시간 기준</p><details><summary>SNS 문구·숏폼 대본</summary><p className="editor-promotion-copy">{item.sns_copy}</p><p className="editor-promotion-copy">{item.short_script}</p></details><button className="editor-button" type="button" disabled={busy||!policy} onClick={()=>void withdraw(item)}><PauseCircle size={16}/> 게시 중단</button></article>)}
    </section>
    <section className="editor-panel"><div className="editor-panel-heading"><h2>이전 게시·처리 내역</h2><span>최근 100건 기준</span></div>{history.length?history.map(item=><div className="editor-promotion-history" key={item.id}><span><strong>{storeName(item.store_id)}</strong> · {item.title}<small>{item.ends_on} 종료</small></span><span>{item.status==="published"?"기간 종료":promotionStatusLabel(item.status)}</span>{item.status==="pending"&&<button className="editor-button" type="button" disabled={busy||!policy} onClick={()=>void withdraw(item)}>이전 대기 요청 닫기</button>}</div>):<p>아직 이전 내역이 없습니다.</p>}</section>
  </EditorShell>;
}
