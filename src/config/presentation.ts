/**
 * 발표용 관리자 둘러보기.
 * true면 관리자 화면을 로그인 없이 열 수 있다. 화면만 열리고 서버 저장·게시·업로드는
 * 여전히 실제 관리자 로그인과 Supabase RLS가 막는다. 발표가 끝나면 false로 되돌린다.
 */
export const ADMIN_PRESENTATION_MODE = true;

/**
 * 발표용 점주 둘러보기. true면 점주 로그인 화면에 '로그인 없이 둘러보기'가 생기고,
 * 아래 가게의 점주 화면을 로그인 없이 볼 수 있다. 공개 게시본만 읽고 소식 게시·내리기는
 * 실제 점주 로그인이 있어야 한다. 테스트 계정의 이메일·비밀번호는 코드에 넣지 않는다.
 */
export const OWNER_PRESENTATION_MODE = true;
export const OWNER_PRESENTATION_STORE_ID = 9101;
