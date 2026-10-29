# ITDA v4.1 · 기존 초대 계정의 비밀번호 설정

현재 Vercel URL(도메인 미연결): `https://haengjeong-gongmojeon.vercel.app`

## 1. 코드 업데이트

이 ZIP의 프로젝트 파일을 기존 GitHub 저장소에 반영하고 Vercel에서 새 배포가 Ready가 된 후 진행합니다.

## 2. Supabase URL Configuration (필수)

Supabase Dashboard → Authentication → URL Configuration

- Site URL: `https://haengjeong-gongmojeon.vercel.app`
- Redirect URLs에 `https://haengjeong-gongmojeon.vercel.app/reset-password` 추가

도메인 변경 후에는 `https://editor.itda.ink/reset-password`도 Redirect URLs에 추가합니다.

## 3. 이미 받은 메일

기존 이메일의 링크는 변경 전 Site URL로 발송됐을 수 있으므로 새 메일을 요청하는 것이 안전합니다. 인증 토큰·URL은 공유하지 마세요.

1. `https://haengjeong-gongmojeon.vercel.app/reset-password` 접속
2. Supabase Authentication → Users에 등록된 이메일 입력
3. '비밀번호 설정 메일 보내기' 선택
4. 도착한 **새 메일**의 링크 클릭
5. ITDA 비밀번호 설정 화면에서 12자 이상의 새 비밀번호 입력 및 저장
6. `https://haengjeong-gongmojeon.vercel.app/catalog`에서 로그인

초대 링크 자체를 누르더라도 같은 Site URL로 돌아오고 해시 파라미터 `type=invite`와 토큰이 붙었다면 비밀번호 설정 화면으로 자동 전환합니다.

## 4. 관리자 권한은 별도

Supabase Authentication 사용자 등록만으로 게시 권한이 생기지 않습니다. `public.itda_admins` 테이블에 UID를 등록해야 합니다.

```sql
insert into public.itda_admins (user_id)
select id from auth.users where email = '관리자_이메일'
on conflict (user_id) do nothing;
```

## 보안

- 브라우저에 `sb_secret_` 또는 `service_role` 키를 설정하지 마세요.
- 사용자 비밀번호는 Supabase Auth API에서 변경하며 앱 데이터베이스에 저장하지 않습니다.
- 메일 링크의 토큰은 로그인 비밀정보이므로 스크린샷이나 채팅에 URL 전체를 올리지 마세요.
- 비밀번호 설정 페이지 추가는 **관리자 편집 화면의 접근 제한을 대신하지 않습니다**. 공개 전 인증 보호가 별도로 필요합니다.
