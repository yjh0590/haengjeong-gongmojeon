# ITDA AI Street v4.5 | 공통 데이터 및 점주 홍보 검토

## 새 기능

1. 점주 화면은 기존 하드코딩된 가게 3곳 대신 관리자 `itda_publication`에 게시된 최신 점포 목록을 사용합니다.
2. 점주 로그인은 Supabase Auth를 사용합니다. 담당 가게는 `itda_owner_stores`에서 제한하며 다른 점포로의 홍보안 제출은 DB RLS가 거부합니다.
3. 점주가 고른 시연 홍보안은 `itda_promotion_requests`에 **검토 대기** 상태로 전송됩니다. 소비자 화면에 즉시 게시되지는 않습니다.
4. 관리자 `editor.itda.ink/promotions`에서 승인·반려합니다. 승인은 서버 트랜잭션에서 공개 게시본의 해당 점포 이벤트를 변경합니다.
5. 점주 이벤트는 종료일 이후 소비자 화면에서 자동으로 숨겨집니다.
6. 기존 점포 전체 게시 시 다른 창에서 최근에 승인된 이벤트를 실수로 덮어쓰지 않도록 업데이트 감지 경고를 추가했습니다.
7. 점주 주소의 `/preview/customer`가 브라우저 시연용 미리보기를 표시하도록 라우팅 수정했습니다.

## 그대로 유지

- `itda.ink`, `customer.itda.ink`, `owner.itda.ink`, `editor.itda.ink` 서브도메인 분리
- v4.4 관리자 인증, 점포 등록·지도·외곽선 편집, 녹색 관리자 테마
- 기존 Supabase 프로젝트, `001_publication.sql`, 환경변수 이름

## 주의

**v4.5는 `supabase/002_owner_promotion_workflow.sql` 실행 후에만 새 기능이 동작합니다.** 테스트 계정 등록 및 점포 배정도 필요합니다. 자세한 내용은 `docs/ITDA_V45_DATA_INTEGRATION.md`를 확인하세요.

실제 AI 모델 호출, 사진 서버 업로드, 자동 인허가 데이터 수집은 아직 연결되지 않았습니다. 새 기능의 개발은 완료했으나 현재 환경에서 최종 npm 빌드와 실제 Supabase 세션을 통한 운영 테스트는 수행하지 못했습니다.
