# ITDA v4.4 — 관리자 인증 및 편집 화면 접근 제한

## 변경 사항

- **`editor.itda.ink`**, `/catalog`, `/map-editor`, `/street-editor`, `/preview/customer`는 인증 후에만 렌더링됩니다.
- 기존 Vercel 주소에서 `/editor`, `/catalog`, `/map-editor`, `/street-editor`, `/preview/customer`도 같은 방식으로 보호합니다.
- 관리자 계정은 Supabase Auth 이메일/비밀번호와 `public.itda_admins` RLS 테이블에서 **모두 검증**합니다.
- 로그인 후 관리 페이지를 이동할 때 재로그인할 필요가 없습니다. 세션은 **해당 탭의 `sessionStorage`**에 저장되며 만료 시 서버에서 갱신을 시도합니다.
- 공통 **로그아웃 버튼**, 만료/권한 실패 처리, 기존 승인 게시 기능 연동.
- 소비자용 `customer.itda.ink`, 점주용 `owner.itda.ink` 화면은 기존대로 유지합니다.
- 점포/지도/사진 편집 초안은 **여전히 해당 브라우저에 저장**됩니다. 관리자가 게시하는 정보는 RLS가 보호하는 기존 Supabase `itda_publication`에 저장됩니다. **사진 파일의 서버 업로드는 아직 미구현입니다.**

## 1. 배포

1. ZIP의 `haengjeong-gongmojeon-main` 폴더 **내용물**을 GitHub 저장소에 업로드·커밋합니다.
2. Vercel 배포 상태가 **Ready**인지 확인합니다.
3. Vercel Production 환경변수: `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY` (기존 설정 유지). `sb_secret_*`, `service_role` 키는 사용하지 않습니다.
4. 로그인 페이지: `https://editor.itda.ink/`.

## 2. Supabase 사용자 준비

**Authentication → Users**에서 이메일 사용자가 이미 보인다면 계정을 중복 생성하지 마세요.

1. 비밀번호가 없다면 `https://editor.itda.ink/reset-password`에서 **비밀번호 설정 메일 보내기**를 누릅니다.
2. Supabase **Authentication → URL Configuration**에서 `Site URL = https://itda.ink`와 `Redirect URLs`에 `https://editor.itda.ink/reset-password`를 등록합니다. (기존 Vercel 주소도 당분간 허용 가능.)
3. **새 메일**에서 링크를 누르고 ITDA 화면에서 12자 이상의 새 비밀번호를 설정합니다.
4. 데이터베이스에서 관리자 권한이 등록됐는지 확인합니다. Supabase SQL Editor (이메일은 본인 것으로 교체):

```sql
insert into public.itda_admins(user_id)
select id from auth.users where email = '관리자_이메일'
on conflict (user_id) do nothing;
```

5. `https://editor.itda.ink`에서 이메일과 새 비밀번호로 로그인합니다. 로그인 화면이 관리자 목록 권한을 확인한 후 대시보드를 보여줍니다.

**주의:** 이미 `001_publication.sql`을 실행했다면 같은 SQL을 다시 실행할 필요가 없습니다. 데이터베이스 로그인 비밀번호와 관리자 로그인 비밀번호는 다른 것입니다.

## 3. 로그인·게시 동작 테스트

- 시크릿 창에서 `https://editor.itda.ink/catalog`을 열면 **로그인 화면**이 나타나야 합니다.
- **틀린 비밀번호/권한 없는 사용자**는 편집 화면에 접근하지 못해야 합니다.
- 올바른 관리자 로그인 후 **점포 관리·지도 편집·사진 편집** 화면을 오갈 수 있어야 합니다.
- 상단 **로그아웃**을 누르면 편집 화면이 사라지고 다시 로그인 화면이 표시돼야 합니다.
- 승인 게시 테스트를 하려면 현재 초안을 **반드시 백업**하세요. 게시 버튼은 점포/지도/촬영 지점/외곽선을 전체 공개합니다. 실제 점포 정보가 준비되지 않았다면 게시 테스트를 보류하세요.
- 게시 후 `https://customer.itda.ink`를 **다른 브라우저/시크릿 창**에서 열어 정보가 동일한지 확인합니다.

## 제한 및 향후 과제

- 인증된 관리자만 편집 **화면을 사용하는** React 인증 관문입니다. **서버에서 개별 HTML/JS 파일 다운로드를 막는 접근 제어는 아닙니다.** 실제 게시/수정 API에 대한 권한은 기존 Supabase RLS가 검사합니다. 전체 편집 앱 자체를 원천 차단해야 한다면 별도의 서버 측 인증 또는 배포 보호가 필요합니다.
- 로그인 토큰은 현재 탭의 세션 스토리지에 보관되므로 공유 PC에서는 사용 후 로그아웃하세요. 브라우저 탭을 모두 닫으면 세션이 사라질 수 있습니다.
- 인증 이전에 이미 같은 브라우저에 저장된 초안은 자동으로 삭제되지 않습니다. 이전에 공개된 정적 코드에 기밀 데이터가 포함됐다면 별도 조치가 필요합니다.
- 비밀번호 설정 링크는 인증 토큰이 포함될 수 있으므로 전체 주소를 캡처·공유하지 마세요.
- Supabase 인증 이메일에서 `localhost`로 이동하면 Site URL/Redirect URLs와 새 메일 요청부터 확인하세요.
- 비밀번호 재설정 일부 이메일 인증 방식(PKCE 등)은 앱/메일 템플릿에 맞는 별도 콜백 지원이 필요할 수 있습니다. 현재 코드에서는 Supabase 기본 암시적 로그인 방식의 `access_token` URL 조각을 처리합니다.
