/**
 * Where the customer site's information comes from, shown on the admin dashboard.
 * Update this list whenever data is added from a new source.
 */
export type DataSource = {
  /** What the source was used for. */
  topic: string;
  /** Where the information came from and what was taken from it. */
  detail: string;
  /** When it was collected or how current it is. */
  asOf: string;
  links?: { label: string; url: string }[];
};

export const dataSources: DataSource[] = [
  {
    topic: "지도 (건물 배치)",
    detail: "운영자가 제공한 지도 서비스 화면의 단지 배치를 따라 밝은 색 안내 지도로 다시 그렸습니다. A~D동 배치는 운영자 확인과 현장 안내판 배치도로 대조했습니다. 실제 북쪽 방향은 확인되지 않아, 입구는 '인천대입구역 쪽 입구'와 'A·D동 사이 입구'처럼 표시합니다. 가게 위치는 동 안의 대략적인 자리입니다.",
    asOf: "2026-11-07 작성 · 2026-11-08 안내판 대조",
  },
  {
    topic: "거리 사진",
    detail: "운영자가 직접 촬영한 인천대입구역 쪽 입구와 B·C동 사이 길 사진입니다. 다른 길은 거리뷰 준비 중입니다.",
    asOf: "운영자 촬영",
  },
  {
    topic: "가게 목록 (간판 사진이 있는 가게)",
    detail: "간판 사진과 공개 주소를 대조해 동·층·호수를 확인했습니다. 간판 사진은 운영자 촬영 3장을 빼면 블로그·매장 안내 페이지 등 웹에 공개된 사진이며, 재사용 허락은 받지 않았습니다(사진별 출처는 조사 기록에 보관). 메뉴와 영업시간은 각 매장 안내 페이지에서 확인한 범위만 넣었고, 나머지는 '현장 확인'으로 표시합니다.",
    asOf: "2026-11-06 수집",
    links: [
      { label: "공개 주소·업소 등록 기록", url: "https://findby.co.kr/details/21998-281853152032-st-652b67c48c641f9e38a57849" },
      { label: "동·층별 시설 참고 목록 (공동 편집 자료)", url: "https://d.namu.moe/w/%EC%86%A1%EB%8F%84%20%ED%83%80%EC%9E%84%EC%8A%A4%ED%8E%98%EC%9D%B4%EC%8A%A4" },
      { label: "연수구청 우수 공중위생업소", url: "https://www.yeonsu.go.kr/main/part/food/best.asp?gotopage=12&keyfield=&keyword=&sch_kind=" },
    ],
  },
  {
    topic: "현장 안내판",
    detail: "운영자가 촬영한 단지 안내판(TIMES SPACE INFORMATION)으로 동 배치와 가게의 동·층을 대조했습니다. 앱의 가게 28곳 중 27곳이 일치했고, 목록에 없는 '피카 에스프레소 바'는 손님 화면에서 뺐습니다.",
    asOf: "2026년 4월 안내판 · 2026-11-08 대조",
  },
  {
    topic: "안내판으로 추가한 가게 9곳",
    detail: "버거킹, 배스킨라빈스, 이리스안경원, 한솥도시락, 설빙, 컴포즈커피, 경양카츠, 하삼동커피, 토지소곱창. 현장 안내판(동·층)과 공개 업소 등록 기록(호수)이 일치하는 가게를 골랐습니다. 외관 사진은 7곳이 운영자가 모아 전달한 사진(2026-11-08), 경양카츠는 타임스페이스 C동 107호라고 밝힌 2025년 2월 방문 글의 사진입니다. 모두 원 촬영자의 재사용 허락은 확인되지 않았습니다. 설빙은 아직 사진이 없어 '사진 추후 업데이트 예정'으로 표시합니다.",
    asOf: "2026-11-08 추가",
    links: [
      { label: "연수구청 안경원 목록", url: "https://www.yeonsu.go.kr/clinic/institution/glasses.asp" },
      { label: "경양카츠 방문 글 (2025-02)", url: "https://ssamdwii.semobenefit.com/entry/%EC%9C%A1%EC%A6%99-%ED%8C%A1%ED%8C%A1-%EC%86%A1%EB%8F%84-%EA%B2%BD%EC%96%91%EC%B9%B4%EC%B8%A0-%EC%97%90%EC%84%9C-%EB%A7%9B%EB%B3%B4%EB%8A%94-%EB%B0%94%EC%82%AD%ED%95%9C-%EB%8F%88%EC%B9%B4%EC%B8%A0" },
    ],
  },
  {
    topic: "메인 배너 사진",
    detail: "인천관광공사 인천관광 갤러리의 사진을 출처를 밝혀 사용합니다. 그 밖의 배너·캐릭터 그림은 연출된 일러스트입니다.",
    asOf: "메인 화면 하단에 출처 표기",
    links: [
      { label: "인천관광공사 · 인천관광 갤러리", url: "https://www.ito.or.kr/bbs/bbsMsgDetail.do?bcd=galleryko&msg_seq=264&pgno=17" },
    ],
  },
];

/** Repository folders with the raw research notes behind this list. */
export const researchFolders = [
  "docs/research/timespace-2026-11-06 (공개 자료 수집본·간판 사진 대조)",
  "docs/research/timespace-board-2026-04 (현장 안내판 판독·대조)",
  "src/data/timespaceBoardStores.json (사진 준비 중 가게와 출처)",
];
