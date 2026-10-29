# ITDA.INK 도메인 연결 (v4.2)

이번 버전은 기존 v4.1 기능을 유지하면서 도메인 라우팅을 `itda.link`에서 실제 구매 주소인 `itda.ink`로 바꾼 버전입니다.

1. Vercel의 **기존 프로젝트** Settings → Domains에서 `itda.ink`, `customer.itda.ink`, `owner.itda.ink`, `editor.itda.ink`를 등록합니다.
2. Namecheap Domain List → Manage → Advanced DNS → Host Records에서 아래의 레코드를 설정합니다. 실제 IP/CNAME 대상은 **Vercel 화면에 표시되는 값**을 따릅니다.
   - `A Record`, Host `@`, Value `Vercel 안내 IP`
   - `CNAME Record`, Host `customer`, Value `Vercel 안내 CNAME`
   - `CNAME Record`, Host `owner`, Value `Vercel 안내 CNAME`
   - `CNAME Record`, Host `editor`, Value `Vercel 안내 CNAME`
3. GitHub 저장소에 이 ZIP의 프로젝트 파일을 업로드하고 Vercel Production 배포 완료를 확인합니다.
4. 접속 화면 확인: `itda.ink`(메인), `customer.itda.ink`(소비자), `owner.itda.ink`(점주), `editor.itda.ink`(관리자).
5. Supabase Authentication → URL Configuration에서 Site URL을 대표 홈페이지 주소로 변경합니다. 기존 Vercel 도메인도 Redirect URLs에 유지해 로그인 복구 테스트 후 전환하세요. `https://editor.itda.ink/reset-password`를 Redirect URLs에 추가합니다.

**보안 주의:** `/map-editor`, `/street-editor` 편집 화면은 현재 전면 로그인 보호가 없습니다. 서브도메인 분리만으로 접근 제한되지 않으므로 실제 공개 전 서버 측 인증과 권한 검증을 추가해야 합니다. 점포 게시 기능의 Supabase Auth/RLS는 별도 설정됩니다.

**데이터 주의:** 서로 다른 도메인의 브라우저 저장소는 별개입니다. 기존 로컬 초안·사진은 관리자 백업·복원을 사용하세요. Supabase에 게시된 데이터만 소비자에게 공유됩니다.
