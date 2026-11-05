import type { Surface } from "../config/site";

export type GuidebookId = "customer" | "owner" | "admin" | "characters";
export type GuidePicture = "map" | "photo" | "store" | "write" | "check" | "publish" | "heart" | "people";
export type GuideStep = { picture: GuidePicture; title: string; caption: string };
type GuidePage = { title: string; lead: string; steps: GuideStep[]; image?: string; imageAlt?: string; art?: "pomuli" | "dosongi" | "brothers"; note?: string };
type Guidebook = { id: GuidebookId; label: string; subtitle: string; description: string; action?: { label: string; surface: Surface }; pages: GuidePage[] };
const step = (picture: GuidePicture, title: string, caption: string): GuideStep => ({ picture, title, caption });

/** Short public guidance. Keep current features distinct from future plans. */
export const guidebooks: Guidebook[] = [
  { id: "customer", label: "손님용", subtitle: "손님 화면 사용법", description: "찾고 · 둘러보고 · 저장해요", action: { label: "손님용 시작하기", surface: "customer" }, pages: [
    { title: "가고 싶은 가게를 찾아요", lead: "송도 타임스페이스, 지도에서 시작해요.", steps: [step("map", "지도 열기", "건물과 층을 골라요"), step("store", "가게 고르기", "이름이나 업종으로 찾아요"), step("check", "정보 보기", "메뉴와 가격을 확인해요")], note: "현재 등록된 시범 정보를 보여드려요." },
    { title: "거리 사진으로 둘러봐요", lead: "보고 싶은 방향을 누르면 가게가 보여요.", steps: [step("map", "지점 선택", "‘거리 사진’을 열어요"), step("photo", "방향 선택", "앞 · 오른쪽 · 뒤 · 왼쪽"), step("store", "카드 열기", "아래 카드를 3개씩 넘겨요")], note: "등록된 일반 사진이에요. 실시간 360도 거리뷰는 아니에요." },
    { title: "마음에 들면 저장해요", lead: "다시 찾고 싶은 가게를 모아두세요.", steps: [step("store", "가게 열기", "상세 정보를 살펴봐요"), step("heart", "즐겨찾기", "좋아하는 가게를 저장해요"), step("photo", "주변 둘러보기", "다음 지점으로 이동해요")], note: "AI 다음 코스 추천은 준비할 기능이에요. 방문 전 영업 정보를 확인해 주세요." },
  ] },
  { id: "owner", label: "점주용", subtitle: "점주 화면 사용법", description: "확인하고 · 만들고 · 게시해요", action: { label: "점주용 시작하기", surface: "owner" }, pages: [
    { title: "우리 가게를 확인해요", lead: "내 계정에 연결된 매장만 보여요.", steps: [step("people", "로그인", "초대받은 점주 계정으로"), step("store", "매장 정보", "담당 가게를 확인해요"), step("check", "메뉴 · 가격", "등록 정보가 맞는지 봐요")], note: "가게 연결이나 정보 수정은 관리자에게 요청해 주세요." },
    { title: "알리고 싶은 내용을 적어요", lead: "오늘의 메뉴나 행사 소식을 준비해요.", steps: [step("write", "목적 적기", "알리고 싶은 내용을 입력해요"), step("write", "예시 만들기", "홍보 문구를 비교해요"), step("check", "조건 확인", "가격 · 시간 · 혜택을 봐요")], note: "현재는 예시 문구 생성이에요. 초안 저장만으로 공개되지는 않아요." },
    { title: "확인한 소식을 게시해요", lead: "점주가 마지막으로 확인하고 공개해요.", steps: [step("check", "게시 전 확인", "종료일과 남은 횟수를 봐요"), step("publish", "직접 게시", "게시 버튼을 눌러요"), step("store", "손님에게 공개", "가게 정보의 이벤트에 떠요")], note: "담당 계정과 서버 연결이 필요해요. 같은 가게의 일일 한도는 함께 사용해요." },
  ] },
  { id: "admin", label: "관리자용", subtitle: "관리자 화면 사용법", description: "등록하고 · 연결하고 · 공개해요", action: { label: "관리자 로그인", surface: "editor" }, pages: [
    { title: "가게 정보를 등록해요", lead: "정확한 정보가 동네 탐색의 시작이에요.", steps: [step("store", "가게 등록", "이름 · 위치 · 소개를 적어요"), step("write", "메뉴 입력", "메뉴별 가격을 채워요"), step("people", "점주 연결", "운영 설정에서 계정을 연결해요")], note: "가게 등록과 점주 계정 배정은 별도예요." },
    { title: "지도와 사진을 연결해요", lead: "사진 속 어느 가게인지 알려주세요.", steps: [step("map", "위치 지정", "가게와 촬영 지점을 연결해요"), step("photo", "사진 등록", "방향별 사진을 올려요"), step("store", "가게 표시", "방향별 가게 카드를 추가해요")], note: "가게 카드는 방향별 연결로 보여요. 사진 속 영역 표시는 선택 사항이에요." },
    { title: "살펴본 뒤 공개해요", lead: "초안 저장과 전체 게시는 달라요.", steps: [step("check", "미리보기", "정보와 사진 연결을 점검해요"), step("publish", "전체 게시", "확인한 기본 정보를 공개해요"), step("store", "공개 확인", "손님용 화면에서 확인해요")], note: "점주의 홍보 직접 게시는 기본 정보의 전체 게시와 별도예요." },
  ] },
  { id: "characters", label: "캐릭터북", subtitle: "포물이와 도송이", description: "동네를 잇는 두 형제 이야기", pages: [
    { title: "포물이, 정겨운 형", lead: "사람에게 먼저 다가가는 든든한 안내자예요.", image: "/brand/characters/character-pomuli-v7.webp", art: "pomuli", imageAlt: "항구 골목의 벤치에서 지도를 펼쳐 보는 포물이", steps: [step("map", "제물포", "이름에 제물포의 ‘포’를 담았어요"), step("heart", "책임감", "씩씩하지만 기술은 조금 서툴러요"), step("people", "정겨움", "정장과 회중시계가 잘 어울려요")] },
    { title: "도송이, 호기심 많은 동생", lead: "새로운 가게와 기술을 발견하는 걸 좋아해요.", image: "/brand/characters/character-dosongi-v9.webp", art: "dosongi", imageAlt: "강변 산책로의 꽃 화분 옆에 몸을 낮추고 앉은 도송이", steps: [step("map", "송도", "‘송도’를 뒤집어 도송이예요"), step("photo", "새로운 발견", "호기심과 관찰력이 풍부해요"), step("people", "친근한 안내", "흰 후드와 파란 가방이 표식이에요")] },
    { title: "다른 매력, 함께하는 여행", lead: "백령도에서 출발한 형제가 동네를 이어요.", image: "/brand/characters/character-brothers-v7.webp", art: "brothers", imageAlt: "지도를 들고 항구 산책로를 함께 걷는 포물이와 도송이", steps: [step("people", "두 형제", "포물이와 도송이가 함께해요"), step("map", "두 동네", "제물포의 정취와 송도의 새로움"), step("heart", "하나의 연결", "점주와 손님을 친근하게 이어요")], note: "현재 시범 구역은 송도 타임스페이스예요. 제물포는 확장 구상이에요." },
  ] },
];
