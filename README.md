# 맛&멋 AI Street — 테스트용 프로토타입

Vite + React + TypeScript 기반의 손님/사장 화면입니다.

## 실행

```bash
npm install
npm run dev
```

- `/` : 테스트용(손님) — 거리 사진, 가게 탐색, D동 미니맵
- `/owner` : 테스트용(사장) — 프로모션 제안·승인

## 프로젝트 구조

- `src/pages/Customer.tsx`: 손님 화면
- `src/pages/Owner.tsx`: 사장 화면
- `src/styles/`: 화면별 CSS
- `src/data/stores.ts`: 테스트 가게 정보
- `src/data/streetNodes.ts`: 촬영 지점과 연결 정보
- `src/types/street.ts`: 공통 타입
- `public/street/`: D동 거리 사진
- `vercel.json`: Vercel SPA 라우팅 설정

## 참고

프로모션 승인 데이터는 현재 브라우저의 `localStorage`에 저장됩니다. 실제 서버/계정 간 데이터 동기화는 아직 구현되지 않았습니다. 미니맵은 실측 지도가 아닌 탐색용 도식입니다.
