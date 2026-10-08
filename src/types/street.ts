export type StoreType = "맛" | "멋";
export type FilterType = "전체" | "맛" | "멋" | "이벤트";

export type ViewDirection = "forward" | "back" | "left" | "right";

export type StoreData = {
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

export type ApprovedPromotionData = {
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

export type StreetConnection = {
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

export type StreetNode = {
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

