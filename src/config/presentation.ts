/**
 * 발표용 관리자 둘러보기.
 * true면 관리자 화면을 로그인 없이 열 수 있다. 화면만 열리고 서버 저장·게시·업로드는
 * 여전히 실제 관리자 로그인과 Supabase RLS가 막는다. 발표가 끝나면 false로 되돌린다.
 */
export const ADMIN_PRESENTATION_MODE = true;
