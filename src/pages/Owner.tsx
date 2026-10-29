import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  ArrowLeft,
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
import { appUrl, sameOriginPreview } from "../config/site";
import { stores as exampleStores } from "../data/stores";
import { usePublicSite } from "../data/sitePublication";
import type { StoreData } from "../types/street";
import { fetchOwnerStoreIds, fetchPromotionRequests, getSavedOwnerSession, refreshOwnerSession,
  saveOwnerSession, signInOwner, signOutOwner, submitOwnerPromotion, type OwnerSession, type PromotionRequest } from "../data/promotionWorkflow";

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
  const publication = usePublicSite();
  const sharedStores: StoreData[] = publication.data?.stores || exampleStores;
  const [selectedStoreId, setSelectedStoreId] = useState(1);
  const [ownerSession,setOwnerSession] = useState<OwnerSession|null>(null);
  const [ownerStoreIds,setOwnerStoreIds] = useState<number[]>([]);
  const [loginEmail,setLoginEmail] = useState("");
  const [loginPassword,setLoginPassword] = useState("");
  const [ownerBusy,setOwnerBusy] = useState(false);
  const [ownerMessage,setOwnerMessage] = useState("점주 계정을 연결하면 홍보안을 관리자에게 제출할 수 있습니다.");
  const [ownerHistory,setOwnerHistory] = useState<PromotionRequest[]>([]);
  const [endOn,setEndOn] = useState(() => new Date().toISOString().slice(0,10));
  const visibleStores = ownerSession ? sharedStores.filter(store=>ownerStoreIds.includes(store.id)) : sharedStores;

  useEffect(()=>{
    let active=true;
    const saved = getSavedOwnerSession();
    if (!saved) return;
    refreshOwnerSession(saved).then(async next=>{
      const [ids, history] = await Promise.all([fetchOwnerStoreIds(next.token),fetchPromotionRequests(next.token)]);
      if (!active) return;
      saveOwnerSession(next);setOwnerSession(next);setOwnerStoreIds(ids);setOwnerHistory(history);
    }).catch(()=>{if(active){saveOwnerSession(null);setOwnerMessage("점주 로그인이 만료됐습니다. 다시 로그인해 주세요.");}});
    return ()=>{active=false};
  },[]);
  useEffect(()=>{
    if (!visibleStores.some(s=>s.id===selectedStoreId) && visibleStores[0]) setSelectedStoreId(visibleStores[0].id);
  },[publication.data,ownerSession,ownerStoreIds,selectedStoreId]);

  const ownerLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();setOwnerBusy(true);setOwnerMessage("");
    try {
      const logged = await signInOwner(loginEmail.trim(),loginPassword);
      const [ids,history] = await Promise.all([fetchOwnerStoreIds(logged.token),fetchPromotionRequests(logged.token)]);
      saveOwnerSession(logged);setOwnerSession(logged);setOwnerStoreIds(ids);setOwnerHistory(history);
      setLoginPassword("");setOwnerMessage("로그인됐어요. 배정된 가게만 제출할 수 있습니다.");
    } catch(e){setOwnerMessage(e instanceof Error?e.message:"로그인 실패");}
    finally{setOwnerBusy(false);}
  };
  const ownerLogout = () => {
    const previous = ownerSession;
    setOwnerSession(null);setOwnerStoreIds([]);setOwnerHistory([]);setApproved(false);
    void signOutOwner(previous);
    setOwnerMessage("로그아웃했습니다. 시연 기능은 계속 사용할 수 있습니다.");
  };
  const submitForReview = async () => {
    if (!selectedPromotion || !ownerSession || !ownerStoreIds.includes(selectedStoreId)) return;
    setOwnerBusy(true);setOwnerMessage("");
    try {
      const logged = await refreshOwnerSession(ownerSession);
      saveOwnerSession(logged);setOwnerSession(logged);
      await submitOwnerPromotion(logged,{
        store_id:selectedStoreId,title:selectedPromotion.title,street_copy:selectedPromotion.streetCopy,
        sns_copy:selectedPromotion.snsCopy,short_script:selectedPromotion.shortScript,ends_on:endOn,
      });
      setOwnerHistory(await fetchPromotionRequests(logged.token));
      setOwnerMessage("홍보안을 관리자에게 제출했어요. 승인 전에는 소비자에게 표시되지 않습니다.");
    } catch(e){setOwnerMessage(e instanceof Error?e.message:"홍보안 제출 실패");}
    finally {setOwnerBusy(false);}
  };
  useEffect(() => {
    document.title = "점주용 AI 마케팅 · AI Marketing";
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

  return (
    <div className="owner-page">
      <header className="owner-header">
        <a
          href={appUrl("customer")}
          className="owner-back"
        >
          <ArrowLeft size={18} />
          소비자 거리 탐색
        </a>

        <div className="owner-brand">
          <span className="owner-brand-icon">
            <Sparkles size={18} />
          </span>

          <div>
            <strong>
              점주용 AI 마케팅
            </strong>

            <span>
              AI 마케팅 도우미
            </span>
          </div>
        </div>

        <div className="owner-status">
          <span />
          콘텐츠 제안·승인 요청
        </div>
      </header>

      <main className="owner-container">
        <section className="itda-owner-connect" aria-label="서버 연동 및 점주 인증">
          <div className="itda-owner-connect-head">
            <div><span>ITDA CONNECTED STORES</span><h2>공통 점포 데이터 · 홍보안 제출</h2>
              <p>{publication.status === "published" ? `관리자 게시 점포 ${sharedStores.length}곳을 연결했어요.` : "관리자 게시본이 아직 없거나 연결되지 않아 시연용 점포가 표시됩니다."} 점포 등록·수정은 관리자용에서 수행합니다.</p>
            </div>
            {ownerSession && <button type="button" className="itda-owner-signout" onClick={ownerLogout}><LogOut size={16}/> 점주 로그아웃</button>}
          </div>
          {!ownerSession ? <form className="itda-owner-login" onSubmit={event=>void ownerLogin(event)}>
            <label>점주 이메일<input type="email" value={loginEmail} onChange={event=>setLoginEmail(event.target.value)} placeholder="점주 계정 이메일" required/></label>
            <label>비밀번호<input type="password" autoComplete="current-password" value={loginPassword} onChange={event=>setLoginPassword(event.target.value)} placeholder="점주 계정 비밀번호" required/></label>
            <button type="submit" disabled={ownerBusy || publication.status!=="published"}><LogIn size={16}/>{ownerBusy?"확인 중…":"점주 로그인"}</button>
            <p className="itda-owner-login-note">점주 계정은 관리자가 Supabase에 초대하고 담당 점포를 지정해야 합니다. 계정이 없어도 예시 홍보안은 만들어 볼 수 있어요.</p>
          </form> : <p className="itda-owner-identity"><ShieldCheck size={17}/> {ownerSession.email} · 담당 점포 {visibleStores.length}곳 · 관리자 승인 후 공개</p>}
          <p className="itda-owner-message" role="status">{ownerMessage}</p>
          {ownerSession && <div className="itda-owner-history"><strong>내 홍보안 제출 내역</strong>
            {ownerHistory.length ? ownerHistory.slice(0,5).map(req=><div key={req.id}><span>{sharedStores.find(s=>s.id===req.store_id)?.name||`가게 #${req.store_id}`} · {req.title}</span><b className={`itda-owner-state-${req.status}`}>{req.status==="pending"?"검토 중":req.status==="approved"?"승인됨":"반려됨"}</b></div>) : <small>아직 제출한 홍보안이 없습니다.</small>}
          </div>}
        </section>
        <section className="owner-intro">
          <div>
            <div className="owner-ai-label">
              <Bot size={15} />
              AI MARKETING ASSISTANT
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
            <p className="owner-demo-note">현재 홍보 문구 생성은 예시 기반 시연입니다(실제 생성형 AI API 미연동). 점주 로그인 후 제출한 홍보안만 관리자 검토를 거쳐 소비자 사이트에 반영될 수 있습니다.</p>
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
                AI 제안
              </div>

              <ChevronRight size={15} />

              <div className="flow-step">
                <span>3</span>
                승인
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
                  AI 프로모션 생성
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
                    AI CONTEXT
                  </span>
                  <strong>
                    현재 분석 정보
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
                      ? "반영 예정"
                      : "제한 없음"}
                  </strong>
                </div>
              </div>

              <div className="analysis-note">
                <Sparkles size={15} />

                <p>
                  AI는 할인율이나 가격을
                  임의로 결정하지 않고,
                  사장님의 입력 조건 안에서
                  아이디어를 제안합니다.
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
                  STEP 02 · AI RESULT
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
                    상인 최종 확인
                  </span>

                  <strong>
                    승인하기 전까지
                    소비자에게 노출되지
                    않습니다.
                  </strong>

                  <p>
                    선택한 내용이 맞는지
                    확인한 뒤 승인해주세요.
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
              <div><h3><ClipboardCheck size={19}/> 관리자에게 홍보안 제출</h3><p>점주가 내용을 선택해도 바로 게시되지 않습니다. 담당 점포로 인증한 계정이 제출한 뒤 관리자 승인을 받아야 공개됩니다.</p></div>
              <label><CalendarDays size={16}/> 홍보 종료일 <input type="date" value={endOn} onChange={event=>setEndOn(event.target.value)} min={new Date().toISOString().slice(0,10)} required/></label>
              <button type="button" disabled={!ownerSession || !ownerStoreIds.includes(selectedStoreId) || ownerBusy || publication.status!=="published" || ownerHistory.some(req=>req.store_id===selectedStoreId && req.status==="pending")} onClick={()=>void submitForReview()}>
                {ownerBusy?"제출 중…":"검토 요청 보내기"} <Send size={16}/>
              </button>
              {!ownerSession && <small>실제 제출은 화면 상단에서 점주 로그인 후 이용할 수 있습니다.</small>}
              {ownerSession && !ownerStoreIds.includes(selectedStoreId) && <small>이 가게에 대한 제출 권한이 없습니다.</small>}
              {ownerHistory.some(req=>req.store_id===selectedStoreId && req.status==="pending") && <small>이 가게에는 검토 중인 홍보안이 있습니다. 처리 후 다시 제출할 수 있습니다.</small>}
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
      </main>
    </div>
  );
}

export default Owner;