import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { ArrowRight, ClipboardCheck, FileText, LogIn, LogOut, Send, ShieldCheck, Store } from 'lucide-react';
import '../styles/Owner.css';
import '../styles/ServiceUpgrade.css';
import { stores as exampleStores } from '../data/stores';
import { usePublicSite } from '../data/sitePublication';
import type { StoreData } from '../types/street';
import { fetchOwnerStoreIds, fetchPromotionRequests, getSavedOwnerSession, refreshOwnerSession, saveOwnerSession, signInOwner, signOutOwner, publishOwnerPromotion, fetchPromotionQuota, promotionStatusLabel, type PromotionQuota, type OwnerSession, type PromotionRequest } from '../data/promotionWorkflow';
import { koreanDate } from '../data/publicPromotions';
import { promotionDraftError, type PromotionDraft } from '../data/promotionDraft';
import { usePageTab } from '../hooks/usePageTab';
import { OwnerPortalHeader, OwnerPortalHome, OwnerPortalStores, OwnerPortalGuide, OwnerPortalFooter } from '../components/OwnerPortal';
import { ownerViews, type OwnerView } from '../data/ownerViews';
import { pageTitle } from '../config/brand';
import SceneBanner from '../components/SceneBanner';
import PromotionStudio from '../components/PromotionStudio';
function Owner() {
  const { tab, openTab } = usePageTab(ownerViews, "home");
  const publication = usePublicSite();
  const sharedStores: StoreData[] = publication.data?.stores || exampleStores;
  const [selectedStoreId, setSelectedStoreId] = useState(1);
  const [ownerSession,setOwnerSession] = useState<OwnerSession|null>(null);
  const [ownerStoreIds,setOwnerStoreIds] = useState<number[]>([]);
  const [loginEmail,setLoginEmail] = useState("");
  const [loginPassword,setLoginPassword] = useState("");
  const [ownerBusy,setOwnerBusy] = useState(false);
  const [ownerMessage,setOwnerMessage] = useState("담당 점포 계정으로 로그인하면 일일 한도 안에서 직접 게시할 수 있습니다.");
  const [ownerHistory,setOwnerHistory] = useState<PromotionRequest[]>([]);
  const [quota,setQuota] = useState<PromotionQuota | null>(null);
  const [quotaLoading,setQuotaLoading] = useState(false);
  const [quotaError,setQuotaError] = useState("");
  const publicationRequest = useRef<{fingerprint:string;key:string} | null>(null);
  const publicationInFlight = useRef(false);
  const assignedStores = useMemo(() => publication.status === "published" && ownerSession
    ? sharedStores.filter(store => ownerStoreIds.includes(store.id)) : [],
  [publication.status, ownerSession, sharedStores, ownerStoreIds]);
  const visibleStores = useMemo(() => ownerSession ? assignedStores : sharedStores,
    [ownerSession, assignedStores, sharedStores]);

  useEffect(()=>{
    let active=true;
    const saved = getSavedOwnerSession();
    if (!saved) return;
    refreshOwnerSession(saved).then(async next=>{
      const [ids, history] = await Promise.all([fetchOwnerStoreIds(next.token),fetchPromotionRequests(next.token)]);
      if (!active) return;
      saveOwnerSession(next);setOwnerSession(next);setOwnerStoreIds(ids);setOwnerHistory(history);setOwnerMessage("담당 매장이 연결됐어요. 게시 횟수와 종료일을 확인해 주세요.");
    }).catch(()=>{if(active){saveOwnerSession(null);setOwnerMessage("점주 로그인이 만료됐습니다. 다시 로그인해 주세요.");}});
    return ()=>{active=false};
  },[]);
  // Keep the selection on a visible store; adjusting during render avoids an extra effect pass.
  if (!visibleStores.some(s=>s.id===selectedStoreId) && visibleStores[0]) setSelectedStoreId(visibleStores[0].id);
  // Clear the previous store's quota as soon as the session, assignments or selection change.
  const quotaKey = `${ownerSession?.token ?? ""}|${ownerStoreIds.join(",")}|${selectedStoreId}`;
  const [quotaFor, setQuotaFor] = useState(quotaKey);
  if (quotaFor !== quotaKey) { setQuotaFor(quotaKey); setQuota(null); setQuotaError(""); setQuotaLoading(false); }
  useEffect(() => {
    if (!ownerSession || !ownerStoreIds.includes(selectedStoreId)) return;
    const saved = ownerSession;
    let active = true;
    let loading = false;
    const refresh = async () => {
      if (loading || document.visibilityState === "hidden") return;
      loading = true;setQuotaLoading(true);
      try {
        const current = await refreshOwnerSession(saved);
        if (!active) return;
        saveOwnerSession(current);
        if (current.token !== saved.token) setOwnerSession(current);
        const next = await fetchPromotionQuota(current.token, selectedStoreId);
        if (active) { setQuota(next);setQuotaError(""); }
      } catch(error) { if (active) { setQuota(null);setQuotaError(error instanceof Error ? error.message : "게시 횟수를 확인하지 못했습니다."); } }
      finally { loading = false;if (active) setQuotaLoading(false); }
    };
    void refresh();
    const timer = window.setInterval(() => void refresh(),15000);
    window.addEventListener("focus",refresh);
    document.addEventListener("visibilitychange",refresh);
    return () => {active=false;window.clearInterval(timer);window.removeEventListener("focus",refresh);document.removeEventListener("visibilitychange",refresh);};
  },[ownerSession,ownerStoreIds,selectedStoreId]);

  const ownerLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();setOwnerBusy(true);setOwnerMessage("");
    try {
      const logged = await signInOwner(loginEmail.trim(),loginPassword);
      const [ids,history] = await Promise.all([fetchOwnerStoreIds(logged.token),fetchPromotionRequests(logged.token)]);
      saveOwnerSession(logged);setOwnerSession(logged);setOwnerStoreIds(ids);setOwnerHistory(history);
      setLoginPassword("");setOwnerMessage("로그인됐어요. 담당 점포의 게시 한도를 확인해 주세요.");
    } catch(e){setOwnerMessage(e instanceof Error?e.message:"로그인 실패");}
    finally{setOwnerBusy(false);}
  };
  const ownerLogout = () => {
    const previous = ownerSession;
    setOwnerSession(null);setOwnerStoreIds([]);setOwnerHistory([]);
    void signOutOwner(previous);
    setOwnerMessage("로그아웃했습니다. 시연 기능은 계속 사용할 수 있습니다.");
  };
  const publishPromotion = async (draft: PromotionDraft): Promise<void> => {
    const validation=promotionDraftError(draft);if(validation)throw Error(validation);
    if(publicationInFlight.current)throw Error('게시가 진행 중이에요. 잠시 기다려 주세요.');
    if(!ownerSession)throw Error('담당 점주 계정으로 로그인해 주세요.');
    if(draft.storeId!==selectedStoreId||!ownerStoreIds.includes(draft.storeId))throw Error('이 가게의 게시 권한을 확인해 주세요.');
    if(publication.status!=='published'||!quota||quota.store_id!==draft.storeId||quotaLoading||!quota.enabled||quota.remaining<=0||quota.quota_date!==koreanDate())throw Error('오늘 게시 권한과 남은 횟수를 다시 확인해 주세요.');
    publicationInFlight.current=true;setOwnerBusy(true);setOwnerMessage('');
    try {
      const logged=await refreshOwnerSession(ownerSession);saveOwnerSession(logged);setOwnerSession(logged);
      const data={store_id:draft.storeId,title:draft.title.trim(),street_copy:draft.streetCopy.trim(),sns_copy:draft.snsCopy,short_script:draft.shortScript,ends_on:draft.endsOn};
      const fingerprint=JSON.stringify(data);
      if(publicationRequest.current?.fingerprint!==fingerprint)publicationRequest.current={fingerprint,key:crypto.randomUUID()};
      const posted=await publishOwnerPromotion(logged,data,publicationRequest.current.key);
      setQuotaError('');setQuota(previous=>previous?.store_id===posted.store_id?posted:previous);publicationRequest.current=null;
      setOwnerMessage(posted.status==='published'?`게시됐어요. 오늘 남은 게시 횟수는 ${posted.remaining}회입니다.`:'이 요청은 이전에 처리됐습니다. 게시 내역을 확인해 주세요.');
      window.dispatchEvent(new Event('itda-publication-changed'));
      try{setOwnerHistory(await fetchPromotionRequests(logged.token));}catch{setOwnerMessage('게시가 완료됐습니다. 게시 내역은 잠시 후 다시 확인해 주세요.');}
    } catch(error) {
      setOwnerMessage(error instanceof Error?error.message:'게시하지 못했어요.');
      void fetchPromotionQuota(ownerSession.token,draft.storeId).then(next=>setQuota(previous=>previous?.store_id===next.store_id?next:previous)).catch(()=>setQuota(null));
      throw error;
    } finally {publicationInFlight.current=false;setOwnerBusy(false);}
  };
  useEffect(() => {
    document.title = pageTitle("owner");
  }, []);


  const selectedStore=visibleStores.find(s=>s.id===selectedStoreId)||visibleStores[0];
  const quotaStatus=!ownerSession?'점주 로그인 후 게시 횟수를 확인할 수 있어요.':quotaError||(quotaLoading?'오늘 게시 가능 횟수를 확인하고 있어요.':!quota?'담당 매장의 게시 권한을 확인해 주세요.':!quota.enabled?'점주 직접 게시가 일시 중지됐어요.':quota.quota_date!==koreanDate()?'새 날짜의 게시 횟수를 확인해 주세요.':`오늘 ${quota.used}/${quota.daily_limit}회 사용 · 한국시간 자정 초기화`);
  const canPublish=Boolean(ownerSession&&selectedStore&&selectedStore.id===selectedStoreId&&ownerStoreIds.includes(selectedStoreId)&&publication.status==='published'&&quota?.store_id===selectedStoreId&&!quotaLoading&&quota.enabled&&quota.remaining>0&&quota.quota_date===koreanDate());
  const navigate=(next:OwnerView)=>{openTab(next);window.requestAnimationFrame(()=>document.getElementById('owner-page-main')?.focus({preventScroll:true}));};
  return <div className="owner-page owner-redesign service-owner"><OwnerPortalHeader view={tab} onNavigate={navigate}/><main className="owner-container" id="owner-page-main" tabIndex={-1}>
    {tab==='home'&&<><OwnerPortalHome onNavigate={navigate} onOpenTool={()=>navigate('marketing')}/>{ownerSession&&<section className="service-owner-summary"><div><Store size={22}/><span>담당 매장<strong>{assignedStores.length}곳</strong></span></div><div><Send size={22}/><span>오늘 게시 가능<strong>{quota?.remaining??'—'} / {quota?.daily_limit??'—'}회</strong></span></div><div><FileText size={22}/><span>게시 내역<strong>{ownerHistory.length}건</strong></span></div></section>}</>}
    {tab==='stores'&&<div className="owner-portal-workspace"><OwnerPortalStores stores={assignedStores} selectedId={selectedStoreId} published={publication.status==='published'} signedIn={Boolean(ownerSession)} onSelect={setSelectedStoreId} onNavigate={navigate} onPromote={id=>{setSelectedStoreId(id);navigate('marketing');}}/></div>}
    {tab==='guide'&&<div className="owner-portal-workspace"><OwnerPortalGuide onNavigate={navigate}/></div>}
        <div className="owner-portal-workspace" hidden={tab !== "account"}>
        <div className="owner-account-heading scene-context-banner scene-context-merchant"><SceneBanner scene="history" /><div><p className="owner-portal-eyebrow">MY ACTIVITY</p><h1>게시 내역</h1><p className="owner-portal-description">우리 가게가 전한 소식과 점주 계정을 확인하세요.</p></div></div>
        <section className="itda-owner-connect" aria-label="서버 연동 및 점주 인증">
          <div className="itda-owner-connect-head">
            <div><span>ITDA CONNECTED STORES</span><h2>담당 점포 · 직접 게시</h2>
              <p>{ownerSession ? `내 계정에 연결된 담당 매장 ${assignedStores.length}곳입니다.` : "관리자가 초대한 계정으로 로그인하면 담당 매장과 게시 내역을 확인할 수 있습니다."}</p>
            </div>
            {ownerSession && <button type="button" className="itda-owner-signout" disabled={ownerBusy} onClick={ownerLogout}><LogOut size={16}/> 점주 로그아웃</button>}
          </div>
          {!ownerSession ? <form className="itda-owner-login" onSubmit={event=>void ownerLogin(event)}>
            <label>점주 이메일<input type="email" value={loginEmail} onChange={event=>setLoginEmail(event.target.value)} placeholder="점주 계정 이메일" required/></label>
            <label>비밀번호<input type="password" autoComplete="current-password" value={loginPassword} onChange={event=>setLoginPassword(event.target.value)} placeholder="점주 계정 비밀번호" required/></label>
            <button type="submit" disabled={ownerBusy || publication.status!=="published"}><LogIn size={16}/>{ownerBusy?"확인 중…":"점주 로그인"}</button>
            <p className="itda-owner-login-note">점주 계정은 관리자가 Supabase에 초대하고 담당 점포를 지정해야 합니다. 계정이 없어도 예시 홍보안은 만들어 볼 수 있어요.</p>
          </form> : <p className="itda-owner-identity"><ShieldCheck size={17}/> {ownerSession.email} · 담당 점포 {visibleStores.length}곳 · 한도 내 직접 게시</p>}
          <p className="itda-owner-message" role="status">{ownerMessage}</p>
          {ownerSession && <div className="itda-owner-history"><strong>내 홍보 게시 내역</strong>
            {ownerHistory.length ? ownerHistory.slice(0,10).map(req=><div key={req.id}><span><strong>{req.title}</strong><small>{assignedStores.find(s=>s.id===req.store_id)?.name||`가게 #${req.store_id}`} · {new Date(req.created_at).toLocaleDateString("ko-KR", {timeZone: "Asia/Seoul"})} 게시 · {req.ends_on}까지</small></span><b className={`itda-owner-state-${req.status}`}>{promotionStatusLabel(req.status)}</b></div>) : <div className="owner-history-empty"><ClipboardCheck size={28} aria-hidden="true"/><span><strong>첫 소식을 기다리고 있어요</strong><small>홍보 문구를 확인하고 게시하면 여기에 기록됩니다.</small></span><button type="button" onClick={() => navigate("marketing")}>홍보하기</button></div>}
          </div>}
        </section>
        </div>

    {tab==='marketing'&&<div className="owner-portal-workspace">{selectedStore?<PromotionStudio key={selectedStore.id} stores={visibleStores} store={selectedStore} onSelectStore={setSelectedStoreId} signedIn={Boolean(ownerSession)} canPublish={canPublish} quotaStatus={quotaStatus} remaining={quota?.store_id===selectedStore.id?quota.remaining:null} dailyLimit={quota?.store_id===selectedStore.id?quota.daily_limit:null} busy={ownerBusy} onPublish={publishPromotion} onAccount={()=>navigate('account')}/>:<section className="service-empty"><Store size={30}/><h1>담당 매장 정보를 확인해 주세요.</h1><p>{ownerSession?'게시된 매장 정보와 계정 연결을 관리자에게 확인해 주세요.':'아직 공개된 매장 정보가 없어요.'}</p><button type="button" className="service-primary" onClick={()=>navigate('account')}>계정 확인 <ArrowRight size={16}/></button></section>}</div>}
  </main><OwnerPortalFooter/></div>;
}
export default Owner;
