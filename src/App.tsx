import { useEffect, useMemo, useState } from "react";
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Bot,
  Camera,
  ChevronRight,
  Clock,
  Compass,
  Eye,
  MapPin,
  Navigation,
  Search,
  Sparkles,
  Store,
  Utensils,
  X,
  Zap,
} from "lucide-react";

import "./App.css";

type StoreType = "맛" | "멋";
type FilterType = "전체" | "맛" | "멋" | "이벤트";

type ViewDirection = "forward" | "back" | "left" | "right";

type StoreData = {
  id: number;
  name: string;
  type: StoreType;
  category: string;
  description: string;
  menu: string;
  price: string;
  event?: string;
  tags: string[];
  walking: string;
  aiScore: number;
};

type ApprovedPromotionData = {
  storeId: number;
  storeName: string;
  category: string;
  goal: string;
  constraint: string;

  promotion: {
    id: number;
    title: string;
    summary: string;
    badge: string;
    streetCopy: string;
    snsCopy: string;
    shortScript: string;
  };

  approvedAt: string;
};

type StreetConnection = {
  direction: ViewDirection;
  to: string;
  label: string;

  /*
    다음 지점으로 이동했을 때
    처음 바라볼 방향.

    생략하면 이동한 방향을 그대로 사용.
  */
  arrivalView?: ViewDirection;
};

type StreetNode = {
  id: string;
  number: number;
  name: string;
  subtitle: string;

  /*
    같은 장소에서 바라보는 방향별 사진.

    사진을 찍어오면 이런 식으로 넣으면 됨.

    views: {
      forward: "/street/point1-forward.jpg",
      back: "/street/point1-back.jpg",
      left: "/street/point1-left.jpg",
      right: "/street/point1-right.jpg",
    }
  */
  views: Partial<Record<ViewDirection, string>>;

  stores: number[];

  connections: StreetConnection[];
};

const stores: StoreData[] = [
  {
    id: 1,
    name: "A 덮밥",
    type: "맛",
    category: "한식 · 덮밥",
    description:
      "인천대 학생들이 부담 없이 식사하기 좋은 타임스페이스의 덮밥집이에요.",
    menu: "제육덮밥",
    price: "9,000원",
    event: "오늘 17~20시 학생 인증 시 음료 서비스",
    tags: ["학생추천", "저녁", "가성비"],
    walking: "도보 3분",
    aiScore: 96,
  },
  {
    id: 2,
    name: "B 카페",
    type: "맛",
    category: "카페 · 디저트",
    description:
      "공강 시간이나 약속 전 잠깐 머물기 좋은 밝고 편안한 카페예요.",
    menu: "아메리카노",
    price: "4,500원",
    tags: ["공강", "카페", "조용한"],
    walking: "도보 4분",
    aiScore: 89,
  },
  {
    id: 3,
    name: "C 스튜디오",
    type: "멋",
    category: "사진 · 문화",
    description:
      "거리 안쪽에서 우연히 발견할 수 있는 작은 촬영·문화 공간이에요.",
    menu: "사진 촬영",
    price: "가격 문의",
    event: "오늘 예약 고객 소품 무료 대여",
    tags: ["사진", "데이트", "발견"],
    walking: "도보 6분",
    aiScore: 91,
  },
  {
    id: 4,
    name: "D 네일",
    type: "멋",
    category: "뷰티 · 네일",
    description:
      "타임스페이스에서 만나는 예약 중심의 뷰티 공간이에요.",
    menu: "젤 네일",
    price: "35,000원~",
    tags: ["뷰티", "예약", "분위기"],
    walking: "도보 5분",
    aiScore: 84,
  },
  {
    id: 5,
    name: "E 파스타",
    type: "맛",
    category: "양식 · 파스타",
    description:
      "타임스페이스 안쪽에서 발견하는 작은 파스타 가게예요.",
    menu: "토마토 파스타",
    price: "12,000원",
    tags: ["데이트", "양식", "저녁"],
    walking: "도보 7분",
    aiScore: 88,
  },
  {
    id: 6,
    name: "F 편집숍",
    type: "멋",
    category: "패션 · 소품",
    description:
      "개성 있는 소품과 의류를 둘러볼 수 있는 작은 편집숍이에요.",
    menu: "패션 · 소품",
    price: "상품별 상이",
    event: "오늘 일부 소품 10% 할인",
    tags: ["소품", "쇼핑", "발견"],
    walking: "도보 8분",
    aiScore: 87,
  },
];

/*
  일단 촬영 지점 4개를 테스트용으로 연결한 상태.

  ① → ② → ③ → ④

  실제 사진을 찍고 정확한 이동 동선을 확인한 뒤
  connections 부분만 바꾸면 됨.
*/

const streetNodes: StreetNode[] = [
  {
  id: "point1",
  number: 1,
  name: "D동",
  subtitle: "타임스페이스 D동",

  views: {
    forward: "/street/point1-forward.jpg",
    back: "/street/point1-back.jpg",
  },

  stores: [1, 2],

  connections: [],
},

  {
    id: "point2",
    number: 2,
    name: "2번 촬영 지점",
    subtitle: "타임스페이스 북측 중앙 구역",

    views: {
      // forward: "/street/point2-forward.jpg",
      // back: "/street/point2-back.jpg",
      // left: "/street/point2-left.jpg",
      // right: "/street/point2-right.jpg",
    },

    stores: [2, 3, 4],

    connections: [
      {
        direction: "back",
        to: "point1",
        label: "1번 지점으로 이동",
        arrivalView: "back",
      },

      {
        direction: "right",
        to: "point3",
        label: "3번 지점으로 이동",
        arrivalView: "right",
      },
    ],
  },

  {
    id: "point3",
    number: 3,
    name: "3번 촬영 지점",
    subtitle: "타임스페이스 동측 중앙 구역",

    views: {
      // forward: "/street/point3-forward.jpg",
      // back: "/street/point3-back.jpg",
      // left: "/street/point3-left.jpg",
      // right: "/street/point3-right.jpg",
    },

    stores: [3, 4, 5],

    connections: [
      {
        direction: "left",
        to: "point2",
        label: "2번 지점으로 이동",
        arrivalView: "left",
      },

      {
        direction: "back",
        to: "point4",
        label: "4번 지점으로 이동",
        arrivalView: "back",
      },
    ],
  },

  {
    id: "point4",
    number: 4,
    name: "4번 촬영 지점",
    subtitle: "타임스페이스 남측 구역",

    views: {
      // forward: "/street/point4-forward.jpg",
      // back: "/street/point4-back.jpg",
      // left: "/street/point4-left.jpg",
      // right: "/street/point4-right.jpg",
    },

    stores: [5, 6],

    connections: [
      {
        direction: "forward",
        to: "point3",
        label: "3번 지점으로 이동",
        arrivalView: "forward",
      },
    ],
  },
];

const filters: FilterType[] = ["전체", "맛", "멋", "이벤트"];

const viewDirections: ViewDirection[] = [
  "left",
  "forward",
  "right",
  "back",
];

const viewLabels: Record<ViewDirection, string> = {
  forward: "정면",
  back: "뒤",
  left: "왼쪽",
  right: "오른쪽",
};

function DirectionIcon({
  direction,
  size = 20,
}: {
  direction: ViewDirection;
  size?: number;
}) {
  if (direction === "left") {
    return <ArrowLeft size={size} />;
  }

  if (direction === "right") {
    return <ArrowRight size={size} />;
  }

  if (direction === "back") {
    return <ArrowDown size={size} />;
  }

  return <ArrowUp size={size} />;
}

function App() {
const [approvedPromotion, setApprovedPromotion] =
  useState<ApprovedPromotionData | null>(() => {
    try {
      const saved = localStorage.getItem(
        "matmeot-approved-promotion"
      );

      return saved
        ? JSON.parse(saved)
        : null;
    } catch {
      return null;
    }
  });

const syncApprovedPromotion = () => {
  try {
    const saved = localStorage.getItem(
      "matmeot-approved-promotion"
    );

    setApprovedPromotion(
      saved
        ? JSON.parse(saved)
        : null
    );
  } catch {
    setApprovedPromotion(null);
  }
};

useEffect(() => {
  /*
    다른 탭에서 사장님이 승인했을 때
    소비자 화면도 자동 갱신
  */
  const handleStorage = (
    event: StorageEvent
  ) => {
    if (
      event.key ===
      "matmeot-approved-promotion"
    ) {
      syncApprovedPromotion();
    }
  };

  /*
    owner 화면에서 돌아왔을 때도
    최신 데이터를 다시 확인
  */
  const handleFocus = () => {
    syncApprovedPromotion();
  };

  window.addEventListener(
    "storage",
    handleStorage
  );

  window.addEventListener(
    "focus",
    handleFocus
  );

  return () => {
    window.removeEventListener(
      "storage",
      handleStorage
    );

    window.removeEventListener(
      "focus",
      handleFocus
    );
  };
}, []);
const effectiveStores = useMemo(() => {
  return stores.map((store) => {
    if (
      approvedPromotion &&
      store.id ===
        approvedPromotion.storeId
    ) {
      return {
        ...store,

        event:
          approvedPromotion.promotion
            .streetCopy,
      };
    }

    return store;
  });
}, [approvedPromotion]);	
  const [currentNodeId, setCurrentNodeId] =
    useState("point1");

  const [currentView, setCurrentView] =
    useState<ViewDirection>("forward");

  const [visitedNodes, setVisitedNodes] =
    useState<Set<string>>(new Set(["point1"]));

  const [discoveredStores, setDiscoveredStores] =
    useState<Set<number>>(new Set());

  const [filter, setFilter] =
    useState<FilterType>("전체");

  const [query, setQuery] = useState("");

  const [selectedStore, setSelectedStore] =
    useState<StoreData | null>(null);

  const currentNode =
    streetNodes.find(
      (node) => node.id === currentNodeId
    ) ?? streetNodes[0];

  const currentImage =
    currentNode.views[currentView];

  const currentStores = useMemo(() => {
   const nodeStores =
  effectiveStores.filter((store) =>
    currentNode.stores.includes(store.id)
  );

    const keyword = query.trim().toLowerCase();

    return nodeStores.filter((store) => {
      const filterMatched =
        filter === "전체" ||
        (filter === "이벤트" &&
          Boolean(store.event)) ||
        store.type === filter;

      const queryMatched =
        !keyword ||
        [
          store.name,
          store.category,
          store.description,
          store.menu,
          ...store.tags,
        ]
          .join(" ")
          .toLowerCase()
          .includes(keyword);

      return filterMatched && queryMatched;
    });
  }, [
  currentNode,
  filter,
  query,
  effectiveStores,
]);

  const changeView = (
    direction: ViewDirection
  ) => {
    setCurrentView(direction);
  };

  const moveToNode = (
    connection: StreetConnection
  ) => {
    setCurrentNodeId(connection.to);

    setCurrentView(
      connection.arrivalView ??
        connection.direction
    );

    setVisitedNodes((previous) => {
      const next = new Set(previous);

      next.add(connection.to);

      return next;
    });
  };

  const openStore = (store: StoreData) => {
    setSelectedStore(store);

    setDiscoveredStores((previous) => {
      const next = new Set(previous);

      next.add(store.id);

      return next;
    });
  };

  const pickWithAI = () => {
    if (currentStores.length === 0) {
      return;
    }

    const recommendation = [
      ...currentStores,
    ].sort(
      (a, b) => b.aiScore - a.aiScore
    )[0];

    openStore(recommendation);
  };

  const streetBackground = currentImage
    ? {
        backgroundImage: `
          linear-gradient(
            to bottom,
            rgba(4, 18, 38, 0.03),
            rgba(4, 18, 38, 0.32)
          ),
          url("${currentImage}")
        `,
      }
    : {};

  return (
    <div className="app-shell">
      <header className="top-navigation">
        <button
          className="brand"
          type="button"
        >
          <span className="brand-symbol">
            <Sparkles size={19} />
          </span>

          <span className="brand-text">
            <strong>맛&멋</strong>
            <span>AI Street</span>
          </span>
        </button>

        <nav className="desktop-nav">
          <button
            className="nav-item active"
            type="button"
          >
            거리 탐색
          </button>

          <button
            className="nav-item"
            type="button"
          >
            오늘의 발견
          </button>

          <button
            className="nav-item"
            type="button"
          >
            프로젝트 소개
          </button>
        </nav>

        <button
          className="location-button"
          type="button"
        >
          <MapPin size={16} />

          <span>
            송도 타임스페이스
          </span>

          <ChevronRight size={16} />
        </button>
      </header>

      <main className="page">
        <section className="hero">
          <div className="hero-copy">
            <div className="ai-badge">
              <span className="ai-dot" />
              AI LOCAL DISCOVERY
            </div>

            <h1>
              목적지를 찾는 대신,
              <br />
              <span>
                거리를 발견해보세요.
              </span>
            </h1>

            <p>
              AI Street를 따라
              타임스페이스를 탐험하고
              <br />
              지금까지 몰랐던 맛과 멋을
              발견해보세요.
            </p>

            <div className="hero-actions">
              <button
                className="primary-action"
                type="button"
              >
                <Compass size={19} />
                거리 탐색 중
              </button>

              <button
                className="secondary-action"
                type="button"
                onClick={pickWithAI}
              >
                <Bot size={19} />
                지금 여기서 AI 추천
              </button>
            </div>
          </div>

          <div className="ai-card">
            <div className="ai-card-header">
              <div className="ai-orb">
                <Bot size={25} />
              </div>

              <div>
                <span>AI GUIDE</span>
                <strong>타임이</strong>
              </div>

              <span className="live-chip">
                <i />
                LIVE
              </span>
            </div>

            <div className="ai-message">
              <Sparkles size={17} />

              <p>
                현재는{" "}
                <strong>
                  {currentNode.number}번 지점
                </strong>
                의{" "}
                <strong>
                  {viewLabels[currentView]}
                </strong>
                을 보고 있어요.
              </p>
            </div>

            <div className="recommend-preview">
              <div className="recommend-icon">
                <Navigation size={20} />
              </div>

              <div>
                <span>
                  STREET PROGRESS
                </span>

                <strong>
                  {visitedNodes.size} /{" "}
                  {streetNodes.length} 구역
                  발견
                </strong>

                <small>
                  가게{" "}
                  {discoveredStores.size}곳
                  발견
                </small>
              </div>

              <ChevronRight size={19} />
            </div>
          </div>
        </section>

        <section className="explore-toolbar">
          <div className="search-field">
            <Search size={19} />

            <input
              value={query}
              onChange={(event) =>
                setQuery(
                  event.target.value
                )
              }
              placeholder="현재 거리의 가게를 검색해보세요"
            />

            {query && (
              <button
                type="button"
                className="clear-search"
                onClick={() =>
                  setQuery("")
                }
              >
                <X size={16} />
              </button>
            )}
          </div>

          <div className="filter-row">
            <div className="filter-buttons">
              {filters.map((item) => (
                <button
                  type="button"
                  key={item}
                  className={`filter-chip ${
                    filter === item
                      ? "selected"
                      : ""
                  }`}
                  onClick={() =>
                    setFilter(item)
                  }
                >
                  {item === "맛" && (
                    <Utensils size={15} />
                  )}

                  {item === "멋" && (
                    <Camera size={15} />
                  )}

                  {item ===
                    "이벤트" && (
                    <Zap size={15} />
                  )}

                  {item}
                </button>
              ))}
            </div>

            <div className="discovery-progress">
              <span>거리 탐험</span>

              <div className="progress-track">
                <span
                  style={{
                    width: `${
                      (visitedNodes.size /
                        streetNodes.length) *
                      100
                    }%`,
                  }}
                />
              </div>

              <strong>
                {visitedNodes.size}/
                {streetNodes.length}
              </strong>
            </div>
          </div>
        </section>

        <section className="explore-layout">
          <div className="street-viewer">
            <div
              className={`street-image ${
                currentImage
                  ? "has-street-image"
                  : "street-placeholder"
              }`}
              style={streetBackground}
            >
              <div className="street-topbar">
                <div className="street-status">
                  <span className="pulse-dot" />

                  <div>
                    <strong>
                      AI Street 탐색 중
                    </strong>

                    <span>
                      {currentNode.name}
                      {" · "}
                      {
                        viewLabels[
                          currentView
                        ]
                      }{" "}
                      보기
                    </span>
                  </div>
                </div>

                <div className="street-actions">
                  <button
                    type="button"
                    aria-label="주변 상점"
                  >
                    <Store size={18} />
                  </button>

                  <button
                    type="button"
                    aria-label="현재 위치"
                  >
                    <Navigation
                      size={18}
                    />
                  </button>
                </div>
              </div>

              <div className="view-switcher">
               {viewDirections
 		 .filter(
   		  (direction) =>
      currentNode.views[direction]
  )
  .map((direction) => (
                    <button
                      type="button"
                      key={direction}
                      className={
                        currentView ===
                        direction
                          ? "active"
                          : ""
                      }
                      onClick={() =>
                        changeView(
                          direction
                        )
                      }
                    >
                      <DirectionIcon
                        direction={
                          direction
                        }
                        size={16}
                      />

                      <span>
                        {
                          viewLabels[
                            direction
                          ]
                        }
                      </span>
                    </button>
                  )
                )}
              </div>

              {!currentImage && (
                <div className="street-placeholder-content">
                  <div className="placeholder-number">
                    {
                      currentNode.number
                    }
                  </div>

                  <span>
                    STREET VIEW
                  </span>

                  <h2>
                    {currentNode.name}
                  </h2>

                  <p>
                    {
                      currentNode.subtitle
                    }
                  </p>

                  <div className="looking-direction">
                    <Eye size={16} />

                    <span>
                      현재{" "}
                      <strong>
                        {
                          viewLabels[
                            currentView
                          ]
                        }
                      </strong>
                      을 보고 있어요
                    </span>
                  </div>

                  <small>
                    이 방향의 거리 사진은
                    추후 추가됩니다.
                  </small>
                </div>
              )}

              <div className="guide-bubble">
                <div className="guide-avatar">
                  <Sparkles size={19} />
                </div>

                <div>
                  <span>타임이</span>

                  <strong>
                    주변을 둘러보고
                    <br />
                    이동 화살표를
                    찾아봐!
                  </strong>
                </div>
              </div>

              <div className="street-store-pins">
                {currentStores.map(
                  (store, index) => (
                    <button
                      type="button"
                      key={store.id}
                      className="floating-store-pin"
                      style={{
                        left: `${
                          26 +
                          (index % 3) *
                            24
                        }%`,
                        top: `${
                          43 +
                          (index % 2) *
                            16
                        }%`,
                      }}
                      onClick={() =>
                        openStore(store)
                      }
                    >
                      {store.event && (
                        <span className="event-mini-badge">
                          TODAY
                        </span>
                      )}

                      <span className="hotspot-pin">
                        {store.type ===
                        "맛" ? (
                          <Utensils
                            size={19}
                          />
                        ) : (
                          <Camera
                            size={19}
                          />
                        )}
                      </span>

                      <span className="hotspot-label">
                        <strong>
                          {store.name}
                        </strong>

                        <small>
                          {
                            store.category
                          }
                        </small>
                      </span>
                    </button>
                  )
                )}
              </div>

              {currentNode.connections
                .filter(
                  (connection) =>
                    connection.direction ===
                    currentView
                )
                .map((connection) => (
                  <button
                    type="button"
                    key={`${currentNode.id}-${connection.to}-${connection.direction}`}
                    className={`street-move-arrow move-${connection.direction}`}
                    onClick={() =>
                      moveToNode(
                        connection
                      )
                    }
                  >
                    <span className="move-arrow-icon">
                      <DirectionIcon
                        direction={
                          connection.direction
                        }
                        size={24}
                      />
                    </span>

                    <span className="move-arrow-text">
                      <small>
                        이동하기
                      </small>

                      <strong>
                        {
                          connection.label
                        }
                      </strong>
                    </span>
                  </button>
                ))}

              <div className="street-footer">
                <div>
                  <MapPin size={17} />

                  <span>
                    {currentNode.name}
                  </span>
                </div>

                <span>
                  {currentStores.length}개의
                  장소가 보여요
                </span>
              </div>
            </div>
          </div>

          <aside className="discovery-panel">
            <div className="panel-heading">
              <div>
                <span>NEARBY</span>

                <h2>
                  이 거리의 발견
                </h2>
              </div>

              <span className="count-badge">
                {currentStores.length}
              </span>
            </div>

            <div className="street-location-card">
              <div className="node-number-mini">
                {currentNode.number}
              </div>

              <div>
                <strong>
                  {currentNode.name}
                </strong>

                <span>
                  {
                    currentNode.subtitle
                  }
                </span>
              </div>
            </div>

            <div className="view-status-card">
              <Eye size={15} />

              <span>
                현재{" "}
                <strong>
                  {
                    viewLabels[
                      currentView
                    ]
                  }
                </strong>
                을 보는 중
              </span>
            </div>

            <div className="place-list">
              {currentStores.map(
                (store) => (
                  <button
                    type="button"
                    key={store.id}
                    className="place-item"
                    onClick={() =>
                      openStore(store)
                    }
                  >
                    <div
                      className={`place-thumbnail ${
                        store.type ===
                        "맛"
                          ? "food"
                          : "style"
                      }`}
                    >
                      {store.type ===
                      "맛" ? (
                        <Utensils
                          size={20}
                        />
                      ) : (
                        <Camera
                          size={20}
                        />
                      )}
                    </div>

                    <div className="place-content">
                      <div className="place-title-row">
                        <strong>
                          {store.name}
                        </strong>

                        {store.event && (
                          <span className="today-label">
                            오늘
                          </span>
                        )}
                      </div>

                      <span>
                        {
                          store.category
                        }
                      </span>

                      <small>
                        <Clock
                          size={13}
                        />

                        {
                          store.walking
                        }

                        <i>·</i>

                        AI 추천{" "}
                        {store.aiScore}%
                      </small>
                    </div>

                    <ChevronRight
                      size={18}
                    />
                  </button>
                )
              )}
            </div>

            {currentStores.length ===
              0 && (
              <div className="empty-street">
                <Store size={25} />

                <strong>
                  조건에 맞는 가게가
                  없어요
                </strong>

                <span>
                  필터를
                  변경해보세요.
                </span>
              </div>
            )}

            <button
              type="button"
              className="ai-discovery-box"
              onClick={pickWithAI}
              disabled={
                currentStores.length ===
                0
              }
            >
              <span className="ai-discovery-icon">
                <Bot size={21} />
              </span>

              <span>
                <small>
                  지금 이 거리에서
                </small>

                <strong>
                  AI 추천 장소 보기
                </strong>
              </span>

              <ArrowRight size={17} />
            </button>
          </aside>
        </section>
      </main>

      {selectedStore && (
        <div
          className="modal-overlay"
          onClick={() =>
            setSelectedStore(null)
          }
        >
          <article
            className="store-modal"
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            <button
              type="button"
              className="modal-close"
              onClick={() =>
                setSelectedStore(null)
              }
            >
              <X size={20} />
            </button>

            <div className="modal-visual">
              <div className="modal-visual-content">
                <span className="modal-pick">
                  {selectedStore.type ===
                  "맛" ? (
                    <>
                      <Utensils
                        size={14}
                      />
                      맛 PICK
                    </>
                  ) : (
                    <>
                      <Camera
                        size={14}
                      />
                      멋 PICK
                    </>
                  )}
                </span>

                <span className="modal-score">
                  <Sparkles size={14} />
                  AI MATCH{" "}
                  {
                    selectedStore.aiScore
                  }
                  %
                </span>
              </div>
            </div>

            <div className="modal-body">
              <span className="modal-category">
                {
                  selectedStore.category
                }
              </span>

              <h2>
                {selectedStore.name}
              </h2>

              <p>
                {
                  selectedStore.description
                }
              </p>

              <div className="tag-row">
                {selectedStore.tags.map(
                  (tag) => (
                    <span key={tag}>
                      #{tag}
                    </span>
                  )
                )}
              </div>

              <div className="store-information">
                <div>
                  <span>
                    대표 메뉴 · 서비스
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
                    {
                      selectedStore.price
                    }
                  </strong>
                </div>

                <div>
                  <span>거리</span>

                  <strong>
                    {
                      selectedStore.walking
                    }
                  </strong>
                </div>
              </div>

              {selectedStore.event && (
                <div className="event-card">
                  <div className="event-icon">
                    <Zap size={19} />
                  </div>

                  <div>
                    <span>
                      AI STREET · TODAY
                    </span>

                    <strong>
                      {
                        selectedStore.event
                      }
                    </strong>
                  </div>
                </div>
              )}

              <div className="modal-buttons">
                <button
                  type="button"
                  className="save-button"
                >
                  저장
                </button>

                <button
                  type="button"
                  className="route-button"
                >
                  <Navigation
                    size={18}
                  />
                  길찾기
                </button>
              </div>
            </div>
          </article>
        </div>
      )}
    </div>
  );
}

export default App;