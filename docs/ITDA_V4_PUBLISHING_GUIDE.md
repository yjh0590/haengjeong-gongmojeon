# ITDA v4 — 점포·지도 통합 게시 사용법

## 이번 버전에서 가능한 일

- `/catalog` (editor.itda.ink/catalog): 점포 **추가·수정·삭제**, 동/층/호수, 업종, 소개, 이벤트 편집
- `/map-editor`: 점포 지도 위치, 촬영 지점·연결, 보행 통로 편집
- `/street-editor`: 촬영 사진을 **브라우저에 임시 등록**하고 가게 외곽선 지정
- `/preview/customer`: 관리자 주소에서 **게시 전 로컬 초안 미리보기**
- `전체 게시`: 등록 점포·층수·좌표·촬영 지점·외곽선 **한 번에 공개 게시** (Supabase 연결 시)
- `customer.itda.ink`: 새로고침 시 게시된 목록·지도 정보를 읽음

**중요:** 사진 바이너리와 지도 배경 이미지 파일은 현재 Supabase 게시 대상이 아닙니다. 촬영 사진은 `/street-editor`에서 같은 브라우저에서만 확인할 수 있습니다. 공개 사진은 GitHub `public/street/`에 배포하거나, 후속 버전에서 Supabase Storage를 연결해야 합니다. 발행 전 실제 촬영 좌표/영업 정보는 확인해야 합니다.

## 처음 연결 — Supabase

1. https://supabase.com/ 에서 프로젝트를 만들고 Project URL과 **publishable** API key(`sb_publishable_...`)를 준비합니다.
2. SQL Editor에 `supabase/001_publication.sql`의 내용을 붙여 넣어 실행합니다.
3. **Authentication → Users**에서 본인이 로그인할 사용자 계정을 생성합니다. 사용할 비밀번호는 채팅이나 소스에 올리지 마세요.
4. SQL Editor에서 아래 쿼리를 실행하여 **그 계정만** 게시 관리자로 등록합니다. 이메일을 실제 계정으로 변경합니다.

```sql
insert into public.itda_admins(user_id)
select id from auth.users where email = 'your-admin-email@example.com'
on conflict (user_id) do nothing;
```

5. Vercel 프로젝트 → **Settings → Environment Variables**에서 아래 2개를 등록하고 Production 환경에 배포합니다.

```dotenv
VITE_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_YOUR-PUBLIC-KEY
```

**절대 넣지 말 것:** `service_role`, `sb_secret_*`, DB 비밀번호, 사용자 비밀번호. `VITE_` 변수는 웹사이트의 JavaScript에 포함되므로 **공개 가능한 키만** 사용합니다. 접근 권한은 `001_publication.sql`의 RLS 정책으로 검증합니다.

6. Vercel에서 새로 배포(Redeploy)합니다. **같은 Vercel 프로젝트**에 `itda.ink`, `customer.itda.ink`, `owner.itda.ink`, `editor.itda.ink` 네 주소가 연결돼 있어야 합니다.

## 실제 게시 과정

1. `editor.itda.ink/catalog`에 접속 → 점포 목록을 수정합니다. 입력할 때마다 **현재 브라우저 초안**으로 저장됩니다.
2. `editor.itda.ink/map-editor`에서 점포와 촬영 지점을 연결하고 지도 위치를 지정한 뒤 **변경사항 저장**을 누릅니다.
3. 사진이 준비됐으면 `editor.itda.ink/street-editor`에서 임시로 올리고 윤곽선을 설정합니다. 사진 원본은 아직 온라인 게시되지 않음을 기억하세요.
4. `editor.itda.ink/preview/customer`로 가서 시연 화면을 확인합니다.
5. `/catalog`로 돌아와 Supabase Auth 관리자 계정으로 로그인 → **관리자 승인 · 전체 게시**.
6. `customer.itda.ink`를 새로고침하여 게시 목록, 층, 촬영 지점, 점포 좌표를 확인합니다.

**브라우저 주소별 저장소가 서로 다른 문제:** `editor.itda.ink`의 로컬 초안은 `customer.itda.ink`에서 보이지 않습니다. 로그인 후 게시하면 **Supabase에 저장된 단일 게시본**을 각 방문자가 읽으므로 도메인 간 동일한 점포/지도 정보가 표시됩니다.

## 도메인 전환 전 사용하기

Vercel 기본 주소에서는 `/catalog`, `/editor`, `/map-editor`, `/street-editor`, `/preview/customer` 경로를 그대로 테스트할 수 있습니다. 데이터 서버 설정 없이도 초안 편집과 같은 주소 미리보기는 작동합니다. **서버 게시 기능은 Supabase 연결 전에는 비활성화**됩니다.

## 한계와 안전 수칙

- 점포 자동 갱신 API **미구현**. 공공데이터 API 비교·AI 점포 교체 감지는 후속 개발 단계입니다.
- 점주 `/owner`의 홍보 제안은 아직 **시연용 로컬 기능**이며 게시 DB에 자동 반영되지 않습니다.
- 관리자 로그인은 **게시 버튼의 서버 권한**을 보호합니다. `/map-editor`, `/street-editor` 등 브라우저 초안 화면 자체는 아직 인증으로 차단되지 않았으므로 실운영 전에 화면 접근 제어가 추가로 필요합니다.
- 공용 지도 배경 사진, 촬영 사진 **서버 동기화 미구현**. 별도 스토리지와 권한 검증 필요.
- 온라인 게시 데이터에는 시연 점포가 포함될 수 있습니다. 실제 영업 정보로 사용하기 전에 이름, 건물·층·호실, 이벤트 기간, 촬영 지점, 사진 저작권을 검증하세요.
- 백업이 필요하면 `/catalog`의 점포 JSON 내보내기와 `/editor`의 사진 포함 전체 백업을 각각 사용하세요. 사진 포함 백업은 용량이 커질 수 있습니다.

## 향후 버전

1. Supabase Storage 사진 업로드, 촬영 지점별 파일 URL 게시 및 이전 사진 교체
2. 점주 계정과 점포별 소유권 분리, 홍보물 관리자 승인 흐름
3. 공공데이터 API로 신규·폐업 점포 *변경 후보* 감지 + 관리자 승인
4. 발행 이력·복구, 점포 수정 감사 기록
