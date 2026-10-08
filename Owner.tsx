import { useEffect, useMemo, useState } from "react";
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
} from "lucide-react";

import "./Owner.css";

type StoreData = {
  id: number;
  name: string;
  category: string;
  mainMenu: string;
  price: string;
};

type Promotion = {
  id: number;
  title: string;
  summary: string;
  badge: string;
  streetCopy: string;
  snsCopy: string;
  shortScript: string;
};

const stores: StoreData[] = [
  {
    id: 1,
    name: "A 덮밥",
    category: "한식 · 덮밥",
    mainMenu: "제육덮밥",
    price: "9,000원",
  },
  {
    id: 2,
    name: "B 카페",
    category: "카페 · 디저트",
    mainMenu: "아메리카노",
    price: "4,500원",
  },
  {
    id: 3,
    name: "C 스튜디오",
    category: "사진 · 문화",
    mainMenu: "사진 촬영",
    price: "가격 문의",
  },
];

function Owner() {
  useEffect(() => {
    document.title = "테스트용(사장) · AI Marketing";
  }, []);

  const [selectedStoreId, setSelectedStoreId] =
    useState(1);

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
      stores.find(
        (store) =>
          store.id === selectedStoreId
      ) ?? stores[0],
    [selectedStoreId]
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
          snsCopy: `저녁 시간 타임스페이스를 걷고 있다면?\n17시부터 20시까지 ${selectedStore.name}의 ${selectedStore.mainMenu}를 만나보세요.\n오늘의 저녁 후보로 저장!`,
          shortScript: `[0~4초] 저녁 6시, 타임스페이스\n[4~8초] 어디 갈지 고민된다면\n[8~12초] ${selectedStore.name}의 ${selectedStore.mainMenu}\n[12~15초] 오늘 저녁 AI Street에서 발견하세요.`,
        },

        {
          id: 3,
          badge: "발견 유도",
          title: "숨은 가게 발견 캠페인",
          summary:
            "할인보다 AI Street의 탐험 경험과 가게 발견 자체를 강조해요.",
          streetCopy: `지나치기 쉬운 오늘의 발견. ${selectedStore.name}을 찾아보세요.`,
          snsCopy: `타임스페이스에서 그냥 지나쳤던 가게가 있나요?\n오늘의 숨은 발견은 ${selectedStore.name}.\n${selectedStore.mainMenu}부터 가볍게 만나보세요.`,
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
          href="/"
          className="owner-back"
        >
          <ArrowLeft size={18} />
          테스트용(손님)
        </a>

        <div className="owner-brand">
          <span className="owner-brand-icon">
            <Sparkles size={18} />
          </span>

          <div>
            <strong>
              테스트용(사장)
            </strong>

            <span>
              AI 마케팅 도우미
            </span>
          </div>
        </div>

        <div className="owner-status">
          <span />
          AI 준비됨
        </div>
      </header>

      <main className="owner-container">
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
              AI가 가게에 맞는 홍보
              방법과 콘텐츠를 제안합니다.
            </p>
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
                {stores.map((store) => (
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
                      selectedStore.mainMenu
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
                  이 프로모션 승인하기
                </button>
              ) : (
                <div className="approved-box">
                  <div>
                    <Check size={19} />
                  </div>

                  <span>
                    <strong>
                      승인 완료
                    </strong>

                    <small>
                      AI Street 반영 대기
                    </small>
                  </span>

                  <a href="/">
                    소비자 화면 보기
                    <ChevronRight
                      size={15}
                    />
                  </a>
                </div>
              )}
            </div>
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