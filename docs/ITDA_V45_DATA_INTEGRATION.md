# ITDA v4.5 | 세 홈페이지 공통 데이터·홍보안 검토 연동

## 현재 범위

- `editor.itda.ink/catalog`: 관리자 등록·수정 → `itda_publication` 전체 게시 (v4.4 유지)
- `customer.itda.ink`: **게시된 점포·층수·지도 정보**를 Supabase에서 읽음 (v4.4 유지)
- `owner.itda.ink`: **같은 게시 점포 목록**을 읽어 홍보 문구 제안의 대상으로 사용 (v4.5 변경)
- `owner.itda.ink`: 담당 점포로 승인된 점주 계정만 홍보안을 **검토 요청** 가능 (v4.5 신규)
- `editor.itda.ink/promotions`: 요청을 검토·승인·반려. 승인 시 해당 점포의 공개 이벤트 문구를 **단일 DB 트랜잭션으로 변경** (v4.5 신규)
- 홍보 종료일을 지나면 소비자용에서 이벤트를 숨김 (v4.5 신규)

주의: 홍보 문구 생성은 **실제 생성형 AI 미연동 예시 기반 시연**입니다. 사진 업로드, 360도 거리뷰, 공공데이터 자동 갱신 역시 별도 단계입니다.

## 1. GitHub/Vercel

v4.5 ZIP에서 프로젝트 안 파일을 기존 GitHub 저장소 최상위에 덮어쓰고 커밋합니다.
Vercel Deployments의 최신 배포가 `Ready`인지 확인합니다.
기존 두 환경변수 `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`는 그대로 사용하며 새 비밀키를 추가하지 않습니다.

## 2. Supabase SQL 마이그레이션 (필수)

Supabase > SQL Editor > New query에서 `supabase/002_owner_promotion_workflow.sql` 전체 내용을 붙여 넣고 Run을 누릅니다.
이 SQL은 v4.4의 `supabase/001_publication.sql`을 이미 실행한 프로젝트에 추가하는 내용입니다.

Table Editor에 다음 테이블이 새로 나타나야 합니다.

- `itda_owner_stores`: 점주 계정에 실제 담당 점포 ID를 배정하는 목록
- `itda_promotion_requests`: 점주 홍보안과 검토 상태 저장

SQL이 적용되기 전에는 점주 로그인·제출·관리자 검토가 작동하지 않습니다. 기존 관리자 점포 게시 기능에는 영향을 주지 않습니다.

## 3. 첫 번째 점주 계정 만들기

1. Supabase > Authentication > Users > Add user에서 **테스트용 점주 계정**을 등록합니다. 로그인 가능한 계정으로 이메일 확인/비밀번호 설정까지 완료해야 합니다.
2. `editor.itda.ink/catalog`에서 점포를 **최소 1곳 이상 전체 게시**하고 가게 ID를 확인합니다. 예: 첫 예시 가게 `1`.
3. SQL Editor에서 다음 코드의 이메일과 점포 ID **두 곳을 수정**하고 실행합니다.

```sql
insert into public.itda_owner_stores (user_id, store_id)
select id, 1
from auth.users
where email = 'YOUR-OWNER-EMAIL@example.com'
on conflict do nothing;
```

4. 등록 확인:

```sql
select s.store_id, u.email
from public.itda_owner_stores s
join auth.users u on u.id = s.user_id;
```

점포 ID는 실제 공개된 점포 ID와 일치해야 합니다. 자기 점포만 배정해야 합니다. 이 테이블은 일반 점주가 직접 변경할 수 없습니다.

### 이미 관리자 계정이 있다면 더 빠른 시험 방법

별도의 점주 계정을 처음부터 만드는 대신 **첫 동작 확인용으로만** 이미 로그인에 성공한 관리자 이메일을 점포 `1`에 연결할 수도 있습니다. 실제 운영할 때는 관리자와 점주 계정을 분리하세요.

```sql
insert into public.itda_owner_stores (user_id, store_id)
select id, 1 from auth.users
where email = 'YOUR-EXISTING-ADMIN-EMAIL@example.com'
on conflict do nothing;
```

이렇게 등록했다면 `owner.itda.ink`에서도 기존 관리자 이메일과 비밀번호로 **점주 로그인**을 테스트할 수 있습니다. `itda_admins` 관리자 권한은 그대로 유지됩니다. 테스트가 끝난 뒤 해당 배정을 해제하려면 아래처럼 실행하세요(다른 점포 배정에 영향 없도록 ID 1만 삭제).

```sql
delete from public.itda_owner_stores
where store_id = 1 and user_id in
  (select id from auth.users where email='YOUR-EXISTING-ADMIN-EMAIL@example.com');
```

## 4. 테스트 흐름

1. `owner.itda.ink` 접속 → 상단 **점주 로그인** → 담당 가게 선택.
2. 상황 입력 → 예시 프로모션 생성 → 하나 선택 → **이 홍보안 시연 초안 저장**.
3. 종료일 설정 → **검토 요청 보내기**. 화면에 `검토 중`이 표시되는지 확인.
4. `editor.itda.ink/promotions`에서 관리자 로그인 → 요청 확인 → **승인 · 소비자 게시**.
5. **새 시크릿 창**에서 `customer.itda.ink` 접속 → 해당 가게의 이벤트 문구 확인.
6. 반려 테스트: 다른 홍보안을 제출 → 관리자에서 **반려** → 소비자에게 노출되지 않는지 확인.
7. 동일 가게의 최신 승인 홍보안이 이전 홍보 문구를 대체합니다.
8. 종료일 이후에는 소비자용에서 이벤트 문구가 숨겨집니다.

### 왜 점주 계정과 관리자 승인이 모두 필요한가?

서버에서 각 점주에게 담당 점포만 연결합니다. RLS 정책이 다른 점포로의 제출을 차단합니다. 점주 제출물은 `itda_promotion_requests`에만 저장되고 소비자에게 공개되지 않습니다. 관리자만 `itda_review_promotion()`을 호출할 수 있으며, 승인 시에만 `itda_publication`이 갱신됩니다.

## 5. 운영상의 주의

- **관리자 초안과 공개본은 다릅니다.** `editor.itda.ink/catalog`에서 이전 브라우저 초안을 다시 전체 게시하면, 앞서 승인된 홍보 문구를 덮어쓸 수 있습니다. v4.5는 공개본이 변경됐으면 게시를 중단하고 확인 메시지를 표시하지만, 이후 사용자가 의도적으로 구버전 초안을 다시 게시하면 되돌릴 수 있습니다. 중요한 변경 전에 최신 공개본을 가져와 비교하고 백업하세요.
- Supabase 로그인 이메일/비밀번호는 **GitHub 소스에 넣지 마세요**. 서버 비밀키(`service_role`, `sb_secret_*`)도 클라이언트/환경변수 `VITE_*`에 넣지 않습니다.
- Supabase 공개용 키만 현재 프런트엔드에 사용합니다.
- `eventUntil`에 설정한 종료일은 **이벤트 정보 표시용**이며, 실제 매장 영업 여부나 행사 진행 여부를 자동 검증해 주지 않습니다.
- 사진과 360도 파노라마는 여전히 브라우저 또는 빌드 이미지이며, 이번 단계에서 Supabase Storage로 올라가지 않습니다.
- 점주가 작성한 공개 문구에 링크·연락처·허위 이벤트가 포함될 수 있으니 **관리자 검토 후 승인**해야 합니다. 실제 매장과의 제휴 여부는 따로 검증해야 합니다.

## 다음 단계

- Supabase Storage로 촬영 사진·지도 배경을 저장하고 관리자가 승인한 이미지를 공개하기
- 점주 계정 초대·배정을 관리자 UI에서 처리하기 (현재는 Supabase에서 수동 배정)
- 실제 AI 홍보 문구 생성 API는 서버에서 호출하고 승인 절차 유지하기
- 점포별 방문/이벤트 조회 통계와 공공데이터 변경 감지 추가하기
