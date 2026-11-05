import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import {
  Bot,
  Check,
  ChevronRight,
  Clock,
  Copy,
  Image,
  Megaphone,
  MessageSquareText,
  RefreshCw,
  Send,
  ShieldCheck,
  Sparkles,
  Store,
  Target,
  Users,
  Video,
  WandSparkles,
  Zap,
  LogIn, LogOut, CalendarDays, ClipboardCheck,
} from "lucide-react";

import "../styles/Owner.css";
import { sameOriginPreview } from "../config/site";
import { stores as exampleStores } from "../data/stores";
import { usePublicSite } from "../data/sitePublication";
import type { StoreData } from "../types/street";
import { fetchOwnerStoreIds, fetchPromotionRequests, getSavedOwnerSession, refreshOwnerSession,
  saveOwnerSession, signInOwner, signOutOwner, publishOwnerPromotion, fetchPromotionQuota, promotionStatusLabel, type PromotionQuota, type OwnerSession, type PromotionRequest } from "../data/promotionWorkflow";
import { koreanDate } from "../data/publicPromotions";
import { usePageTab } from "../hooks/usePageTab";
import { ownerViews, OwnerPortalHeader, OwnerPortalHome, OwnerPortalStores, OwnerPortalGuide, OwnerPortalFooter, type OwnerView } from "../components/OwnerPortal";
import { pageTitle } from "../config/brand";
import CharacterAccent from "../components/CharacterAccent";
import SceneBanner from "../components/SceneBanner";

type Promotion = {
  id: number;
  title: string;
  summary: string;
  badge: string;
  streetCopy: string;
  snsCopy: string;
  shortScript: string;
};

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
  const [endOn,setEndOn] = useState(koreanDate);
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
  useEffect(()=>{
    if (!visibleStores.some(s=>s.id===selectedStoreId) && visibleStores[0]) setSelectedStoreId(visibleStores[0].id);
  },[visibleStores,selectedStoreId]);
  useEffect(() => {
    setQuota(null);setQuotaError("");
    if (!ownerSession || !ownerStoreIds.includes(selectedStoreId)) { setQuotaLoading(false); return; }
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
  },[ownerSession?.token,ownerStoreIds,selectedStoreId]);

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
    setOwnerSession(null);setOwnerStoreIds([]);setOwnerHistory([]);setApproved(false);
    void signOutOwner(previous);
    setOwnerMessage("로그아웃했습니다. 시연 기능은 계속 사용할 수 있습니다.");
  };
  const publishPromotion = async () => {
    if (publicationInFlight.current || !selectedPromotion || !ownerSession || !ownerStoreIds.includes(selectedStoreId) || !quota || quotaLoading || !quota.enabled || quota.remaining<=0 || quota.quota_date!==koreanDate()) return;
    publicationInFlight.current = true;
    setOwnerBusy(true);setOwnerMessage("");
    try {
      const logged = await refreshOwnerSession(ownerSession);
      saveOwnerSession(logged);setOwnerSession(logged);
      const data = {
        store_id:selectedStoreId,title:selectedPromotion.title,street_copy:selectedPromotion.streetCopy,
        sns_copy:selectedPromotion.snsCopy,short_script:selectedPromotion.shortScript,ends_on:endOn,
      };
      const fingerprint = JSON.stringify(data);
      if (publicationRequest.current?.fingerprint !== fingerprint) publicationRequest.current = {fingerprint,key:crypto.randomUUID()};
      const posted = await publishOwnerPromotion(logged,data,publicationRequest.current.key);
      setQuotaError("");
      setQuota(previous => previous?.store_id===posted.store_id ? posted : previous);
      setOwnerMessage(posted.status==="published" ? `게시됐어요. 오늘 남은 게시 횟수는 ${posted.remaining}회입니다.` : "이 요청은 이전에 처리된 게시입니다. 게시 내역을 확인해 주세요.");
      publicationRequest.current=null;
      window.dispatchEvent(new Event("itda-publication-changed"));
      try { setOwnerHistory(await fetchPromotionRequests(logged.token)); } catch { setOwnerMessage("게시가 완료됐습니다. 게시 내역은 잠시 후 다시 확인해 주세요."); }
    } catch(e){
      setOwnerMessage(e instanceof Error?e.message:"홍보안을 게시하지 못했습니다.");
      void fetchPromotionQuota(ownerSession.token,selectedStoreId).then(next=>{setQuotaError("");setQuota(previous=>previous?.store_id===next.store_id?next:previous);}).catch(()=>setQuota(null));
    }
    finally {publicationInFlight.current=false;setOwnerBusy(false);}
  };
  useEffect(() => {
    document.title = pageTitle("owner");
  }, []);

  const [goal, setGoal] = useState(
    "오늘 저녁 인천대 학생 손님을 늘리고 싶어요."
  );

  const [constraint, setConstraint] =
    useState(
      "가격 할인보다는 음료나 작은 서비스를 제공하고 싶어요."
    );

  const [promotions, setPromotions] =
    useState<Promotion[]>([]);

  const [selectedPromotionId, setSelectedPromotionId] =
    useState<number | null>(null);

  const [isGenerating, setIsGenerating] =
    useState(false);

  const [approved, setApproved] =
    useState(false);

  const selectedStore = useMemo(
    () =>
      visibleStores.find(
        (store) =>
          store.id === selectedStoreId
      ) ?? visibleStores[0] ?? exampleStores[0],
    [selectedStoreId, visibleStores]
  );

  const selectedPromotion =
    promotions.find(
      (promotion) =>
        promotion.id ===
        selectedPromotionId
    ) ?? null;

  const generatePromotions = () => {
    setIsGenerating(true);
    setApproved(false);
    setSelectedPromotionId(null);

    window.setTimeout(() => {
      const generated: Promotion[] = [
        {
          id: 1,
          badge: "학생 유입",
          title: "학생 인증 서비스 이벤트",
          summary:
            "저녁 시간대 학생 방문을 유도하면서 가격 할인 부담은 줄이는 방식이에요.",
          streetCopy: `오늘 ${selectedStore.name}에서 인천대 학생 인증 시 작은 서비스를 제공해요.`,
          snsCopy: `오늘 저녁 어디서 먹지? 👀\n${selectedStore.name}에서 인천대 학생 인증 시 작은 서비스를 준비했어요.\n공강 끝나고 가볍게 들러보세요!`,
          shortScript: `[0~3초] 오늘 저녁 뭐 먹지?\n[3~7초] ${selectedStore.name} 발견\n[7~11초] 학생 인증 시 오늘만 특별 서비스\n[11~15초] 타임스페이스에서 만나보세요.`,
        },

        {
          id: 2,
          badge: "시간대 공략",
          title: "17~20시 집중 프로모션",
          summary:
            "손님을 늘리고 싶은 시간대만 집중적으로 홍보하는 방식이에요.",
          streetCopy: `17~20시, ${selectedStore.name}의 오늘의 추천 메뉴를 만나보세요.`,
          snsCopy: `저녁 시간 타임스페이스를 걷고 있다면?\n17시부터 20시까지 ${selectedStore.name}의 ${selectedStore.menu}를 만나보세요.\n오늘의 저녁 후보로 저장!`,
          shortScript: `[0~4초] 저녁 6시, 타임스페이스\n[4~8초] 어디 갈지 고민된다면\n[8~12초] ${selectedStore.name}의 ${selectedStore.menu}\n[12~15초] 오늘 저녁 AI Street에서 발견하세요.`,
        },

        {
          id: 3,
          badge: "발견 유도",
          title: "숨은 가게 발견 캠페인",
          summary:
            "할인보다 AI Street의 탐험 경험과 가게 발견 자체를 강조해요.",
          streetCopy: `지나치기 쉬운 오늘의 발견. ${selectedStore.name}을 찾아보세요.`,
          snsCopy: `타임스페이스에서 그냥 지나쳤던 가게가 있나요?\n오늘의 숨은 발견은 ${selectedStore.name}.\n${selectedStore.menu}부터 가볍게 만나보세요.`,
          shortScript: `[0~3초] 이 골목, 그냥 지나쳤다면?\n[3~7초] 오늘의 숨은 장소 공개\n[7~11초] ${selectedStore.name}\n[11~15초] AI Street가 새로운 가게를 연결합니다.`,
        },
      ];

      setPromotions(generated);
      setIsGenerating(false);
    }, 900);
  };

  const approvePromotion = () => {
    if (!selectedPromotion) {
      return;
    }

    const approvedData = {
      storeId: selectedStore.id,
      storeName: selectedStore.name,
      category: selectedStore.category,
      goal,
      constraint,
      promotion: selectedPromotion,
      approvedAt:
        new Date().toISOString(),
    };

    localStorage.setItem(
      "matmeot-approved-promotion",
      JSON.stringify(approvedData)
    );

    setApproved(true);
  };

  const copyText = async (
    text: string
  ) => {
    try {
      await navigator.clipboard.writeText(
        text
      );
    } catch {
      console.log(text);
    }
  };

  const navigate = (next: OwnerView) => {
    openTab(next);
    window.requestAnimationFrame(() => document.getElementById("owner-page-main")?.focus({ preventScroll: true }));
  };
  const openPortalTool = (tool: "sns" | "template") => {
    navigate("marketing");
    window.requestAnimationFrame(() => {
      const target = tool === "sns" && selectedPromotion ? ".owner-redesign .content-section" : tool === "template" ? ".owner-redesign .quick-goals" : ".owner-redesign .owner-main-panel";
      document.querySelector(target)?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };

  return (
    <div className="owner-page owner-redesign">
      <OwnerPortalHeader view={tab} onNavigate={navigate} />
      <main className="owner-container" id="owner-page-main" tabIndex={-1}>
        {tab === "home" && <OwnerPortalHome onNavigate={navigate} onOpenTool={openPortalTool} />}
        {tab === "stores" && <div className="owner-portal-workspace"><OwnerPortalStores stores={assignedStores} selectedId={selectedStoreId} published={publication.status === "published"} signedIn={Boolean(ownerSession)} onSelect={setSelectedStoreId} onNavigate={navigate} onPromote={id => { setSelectedStoreId(id); setPromotions([]); setSelectedPromotionId(null); setApproved(false); navigate("marketing"); }} /></div>}
        {tab === "guide" && <div className="owner-portal-workspace"><OwnerPortalGuide onNavigate={navigate} /></div>}
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
        <div className="owner-portal-workspace" hidden={tab !== "marketing"}>
        {ownerSession && !visibleStores.length ? <div className="owner-store-access"><CharacterAccent /><h1>담당 매장 정보를 확인할 수 없어요</h1><p>관리자에게 매장 연결을 확인해 주세요. 게시된 매장 정보를 불러온 뒤 홍보할 수 있습니다.</p><button type="button" className="owner-primary-action" onClick={() => navigate("stores")}>매장 정보 확인</button></div> : <>
        <section className="owner-intro">
          <div>
            <div className="owner-ai-label">
              <Bot size={15} />
              PROMOTION ASSISTANT
            </div>

            <h1>
              오늘 알리고 싶은 것을
              <br />
              <span>
                편하게 말해주세요.
              </span>
            </h1>

            <p>
              복잡한 광고 설정 없이
              오늘의 상황만 알려주면,
              <br />
              가게에 맞는 홍보
              방법과 콘텐츠 제안을 미리 경험할 수 있습니다.
            </p>
            <p className="owner-demo-note">홍보 문구 생성은 예시 기반 시연입니다. 담당 점포 계정으로 로그인한 뒤 일일 게시 한도 안에서 직접 손님 사이트에 게시할 수 있습니다.</p>
          </div>

          <div className="owner-flow-card">
            <span className="flow-title">
              TODAY'S FLOW
            </span>

            <div className="flow-steps">
              <div className="flow-step active">
                <span>1</span>
                상황 입력
              </div>

              <ChevronRight size={15} />

              <div className="flow-step">
                <span>2</span>
                홍보안
              </div>

              <ChevronRight size={15} />

              <div className="flow-step">
                <span>3</span>
                내용 확인
              </div>

              <ChevronRight size={15} />

              <div className="flow-step">
                <span>4</span>
                노출
              </div>
            </div>
          </div>
        </section>

        <section className="owner-grid">
          <div className="owner-main-panel">
            <div className="section-heading">
              <div className="heading-icon">
                <Store size={19} />
              </div>

              <div>
                <span>STEP 01</span>
                <h2>오늘의 가게 상황</h2>
              </div>
            </div>

            <div className="store-select-card">
              <label>
                홍보할 가게
              </label>

              <select
                aria-label="홍보할 가게"
                disabled={visibleStores.length <= 1}
                value={selectedStoreId}
                onChange={(event) => {
                  setSelectedStoreId(
                      Number(
                      event.target.value
                    )
                  );

                  setPromotions([]);
                  setSelectedPromotionId(
                    null
                  );
                  setApproved(false);
                }}
              >
                {visibleStores.map((store) => (
                  <option
                    key={store.id}
                    value={store.id}
                  >
                    {store.name}
                  </option>
                ))}
              </select>

              <div className="selected-store-info">
                <div>
                  <span>업종</span>
                  <strong>
                    {
                      selectedStore.category
                    }
                  </strong>
                </div>

                <div>
                  <span>
                    대표 메뉴·서비스
                  </span>
                  <strong>
                    {
                      selectedStore.menu
                    }
                  </strong>
                </div>

                <div>
                  <span>가격</span>
                  <strong>
                    {selectedStore.price}
                  </strong>
                </div>
              </div>
            </div>

            <div className="input-section">
              <label>
                <Target size={16} />
                오늘 어떤 도움이
                필요한가요?
              </label>

              <textarea
                value={goal}
                onChange={(event) =>
                  setGoal(
                    event.target.value
                  )
                }
                placeholder="예: 오늘 저녁 학생 손님을 늘리고 싶어요."
              />

              <div className="quick-goals">
                <button
                  type="button"
                  onClick={() =>
                    setGoal(
                      "오늘 저녁 인천대 학생 손님을 늘리고 싶어요."
                    )
                  }
                >
                  <Users size={14} />
                  학생 손님 늘리기
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setGoal(
                      "새로운 메뉴를 더 많은 사람에게 알리고 싶어요."
                    )
                  }
                >
                  <Megaphone
                    size={14}
                  />
                  신메뉴 알리기
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setGoal(
                      "오후 시간대 방문객을 늘리고 싶어요."
                    )
                  }
                >
                  <Clock size={14} />
                  한산한 시간 채우기
                </button>
              </div>
            </div>

            <div className="input-section">
              <label>
                <ShieldCheck size={16} />
                지켜야 할 조건이
                있나요?
              </label>

              <textarea
                className="constraint-input"
                value={constraint}
                onChange={(event) =>
                  setConstraint(
                    event.target.value
                  )
                }
                placeholder="예: 가격 할인은 어려워요. 서비스 제공은 가능해요."
              />
            </div>

            <button
              type="button"
              className="generate-button"
              onClick={
                generatePromotions
              }
              disabled={
                isGenerating ||
                !goal.trim()
              }
            >
              {isGenerating ? (
                <>
                  <RefreshCw
                    className="spin"
                    size={19}
                  />
                  가게에 맞는 방법을
                  찾는 중...
                </>
              ) : (
                <>
                  <WandSparkles
                    size={19}
                  />
                  예시 홍보안 만들기
                  <Sparkles size={16} />
                </>
              )}
            </button>
          </div>

          <aside className="owner-side-panel">
            <div className="ai-analysis-card">
              <div className="analysis-header">
                <Bot size={20} />

                <div>
                  <span>
                    PROMOTION BRIEF
                  </span>
                  <strong>
                    입력 내용 확인
                  </strong>
                </div>
              </div>

              <div className="analysis-list">
                <div>
                  <span>
                    <Store size={14} />
                    가게
                  </span>

                  <strong>
                    {selectedStore.name}
                  </strong>
                </div>

                <div>
                  <span>
                    <Target size={14} />
                    목표
                  </span>

                  <strong>
                    {goal
                      ? "입력 완료"
                      : "입력 필요"}
                  </strong>
                </div>

                <div>
                  <span>
                    <ShieldCheck
                      size={14}
                    />
                    조건
                  </span>

                  <strong>
                    {constraint
                      ? "입력 완료"
                      : "제한 없음"}
                  </strong>
                </div>
              </div>

              <div className="analysis-note">
                <Sparkles size={15} />

                <p>
                  현재는 가게 정보를 넣은 예시 문구를 제공합니다. 행사 조건과 가격을 확인한 후 사용해 주세요.
                </p>
              </div>
            </div>
          </aside>
        </section>

        {promotions.length > 0 && (
          <section className="result-section">
            <div className="result-heading">
              <div>
                <span>
                  STEP 02 · PROMOTION IDEAS
                </span>

                <h2>
                  이런 홍보 방법은
                  어떨까요?
                </h2>

                <p>
                  마음에 드는 안을 하나
                  선택해주세요.
                </p>
              </div>

              <button
                type="button"
                className="regenerate-button"
                onClick={
                  generatePromotions
                }
              >
                <RefreshCw size={15} />
                다시 제안
              </button>
            </div>

            <div className="promotion-grid">
              {promotions.map(
                (promotion) => {
                  const selected =
                    selectedPromotionId ===
                    promotion.id;

                  return (
                    <button
                      type="button"
                      key={promotion.id}
                      className={`promotion-card ${
                        selected
                          ? "selected"
                          : ""
                      }`}
                      onClick={() => {
                        setSelectedPromotionId(
                          promotion.id
                        );
                        setApproved(false);
                      }}
                    >
                      <div className="promotion-top">
                        <span className="promotion-number">
                          0{promotion.id}
                        </span>

                        <span className="promotion-badge">
                          {
                            promotion.badge
                          }
                        </span>

                        {selected && (
                          <span className="selected-check">
                            <Check
                              size={14}
                            />
                          </span>
                        )}
                      </div>

                      <h3>
                        {promotion.title}
                      </h3>

                      <p>
                        {
                          promotion.summary
                        }
                      </p>

                      <span className="choose-text">
                        {selected
                          ? "선택됨"
                          : "이 안 선택하기"}
                        <ChevronRight
                          size={15}
                        />
                      </span>
                    </button>
                  );
                }
              )}
            </div>
          </section>
        )}

        {selectedPromotion && (
          <section className="content-section">
            <div className="result-heading">
              <div>
                <span>
                  STEP 03 · CONTENT
                </span>

                <h2>
                  홍보 콘텐츠도 함께
                  만들었어요.
                </h2>

                <p>
                  승인 전 직접 확인하고
                  수정할 수 있는 영역입니다.
                </p>
              </div>
            </div>

            <div className="content-grid">
              <article className="content-card">
                <div className="content-card-title">
                  <div>
                    <Zap size={18} />
                  </div>

                  <span>
                    <small>
                      AI STREET
                    </small>
                    <strong>
                      거리 노출 문구
                    </strong>
                  </span>
                </div>

                <p>
                  {
                    selectedPromotion.streetCopy
                  }
                </p>

                <button
                  type="button"
                  onClick={() =>
                    copyText(
                      selectedPromotion.streetCopy
                    )
                  }
                >
                  <Copy size={14} />
                  복사
                </button>
              </article>

              <article className="content-card">
                <div className="content-card-title">
                  <div>
                    <MessageSquareText
                      size={18}
                    />
                  </div>

                  <span>
                    <small>SNS</small>
                    <strong>
                      게시글 문구
                    </strong>
                  </span>
                </div>

                <p className="multiline">
                  {
                    selectedPromotion.snsCopy
                  }
                </p>

                <button
                  type="button"
                  onClick={() =>
                    copyText(
                      selectedPromotion.snsCopy
                    )
                  }
                >
                  <Copy size={14} />
                  복사
                </button>
              </article>

              <article className="content-card">
                <div className="content-card-title">
                  <div>
                    <Video size={18} />
                  </div>

                  <span>
                    <small>
                      SHORT FORM
                    </small>
                    <strong>
                      15초 영상 대본
                    </strong>
                  </span>
                </div>

                <p className="multiline">
                  {
                    selectedPromotion.shortScript
                  }
                </p>

                <button
                  type="button"
                  onClick={() =>
                    copyText(
                      selectedPromotion.shortScript
                    )
                  }
                >
                  <Copy size={14} />
                  복사
                </button>
              </article>
            </div>

            <div className="approval-panel">
              <div className="approval-info">
                <div className="approval-icon">
                  <ShieldCheck
                    size={23}
                  />
                </div>

                <div>
                  <span>
                    점주 최종 확인
                  </span>

                  <strong>
                    직접 게시 버튼을 눌러야
                    손님에게 공개됩니다.
                  </strong>

                  <p>
                    선택한 내용이 맞는지
                    확인한 뒤 초안을 저장해주세요.
                  </p>
                </div>
              </div>

              {!approved ? (
                <button
                  type="button"
                  className="approve-button"
                  onClick={
                    approvePromotion
                  }
                >
                  <Check size={18} />
                  이 홍보안 시연 초안 저장
                </button>
              ) : (
                <div className="approved-box">
                  <div>
                    <Check size={19} />
                  </div>

                  <span>
                    <strong>
                      시연 초안 저장 완료
                    </strong>

                    <small>
                      현재 브라우저에서만 미리보기
                    </small>
                  </span>

                  <a href={sameOriginPreview()}>
                    이 주소에서 예시 점포 미리보기
                    <ChevronRight size={15}/>
                  </a>
                </div>
              )}
            </div>
            {approved && <div className="itda-owner-submit">
              <div><h3><ClipboardCheck size={19}/> 손님 페이지에 직접 게시</h3><p>관리자 승인 없이 게시합니다. 같은 점포의 점주 계정은 일일 한도를 공유하며, 게시 문구를 바꾸는 작업도 1회로 계산합니다.</p></div>
              <div className="owner-publication-quota" role="status">{!ownerSession ? "점주 로그인 후 게시 횟수를 확인할 수 있습니다." : quotaError || (quotaLoading ? "오늘 게시 가능 횟수를 확인 중입니다…" : quota ? !quota.enabled ? "점주 직접 게시가 일시 중지되었습니다." : `오늘 ${quota.used}/${quota.daily_limit}회 사용 · ${quota.remaining}회 남음 · 한국시간 자정 초기화` : "담당 점포의 게시 권한을 확인해 주세요.")}</div>
              <label><CalendarDays size={16}/> 홍보 종료일 <input type="date" value={endOn} onChange={event=>setEndOn(event.target.value)} min={koreanDate()} max={koreanDate(new Date(Date.now()+90*86400000))} required/></label>
              <button type="button" disabled={!ownerSession || !ownerStoreIds.includes(selectedStoreId) || ownerBusy || publication.status!=="published" || quotaLoading || !quota || !quota.enabled || quota.remaining<=0 || quota.quota_date!==koreanDate() || endOn<koreanDate() || endOn>koreanDate(new Date(Date.now()+90*86400000))} onClick={()=>void publishPromotion()}>
                {ownerBusy?"게시 중…":"직접 게시하기"} <Send size={16}/>
              </button>
              {!ownerSession && <small>실제 게시는 <button type="button" className="owner-portal-account-link" onClick={() => navigate("account")}>점주 계정에 로그인</button>한 후 이용할 수 있습니다.</small>}
              {ownerSession && !ownerStoreIds.includes(selectedStoreId) && <small>이 가게에 대한 게시 권한이 없습니다.</small>}
              <p className="owner-publication-message" role="status">{ownerMessage}</p>
            </div>}
          </section>
        )}

        <section className="owner-bottom-guide">
          <div>
            <Image size={18} />
            이미지 생성
            <span>다음 단계</span>
          </div>

          <div>
            <Video size={18} />
            숏폼 생성
            <span>다음 단계</span>
          </div>

          <div>
            <Send size={18} />
            AI Street 자동 반영
            <span>다음 단계</span>
          </div>
        </section>
        </>}
        </div>
      </main>
      <OwnerPortalFooter />
    </div>
  );
}

export default Owner;
