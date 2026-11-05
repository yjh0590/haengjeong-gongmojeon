import { useEffect, useRef, useState } from "react";
import { ArrowDown, ArrowRight, ArrowUpRight } from "lucide-react";
import { appUrl } from "../config/site";
import "../styles/Landing.css";

const navigation = [
  { href: "#about", label: "소개" },
  { href: "#services", label: "서비스" },
  { href: "#news", label: "소식" },
  { href: "#contact", label: "이용 안내" },
];

export default function Landing() {
  const [menuOpen, setMenuOpen] = useState(false);
  const header = useRef<HTMLElement>(null);
  const menuToggle = useRef<HTMLButtonElement>(null);
  const newsDialog = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    document.title = "맛&멋 AI Street | 인천의 맛과 멋을 잇다";
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setMenuOpen(false);
        menuToggle.current?.focus();
      }
    }
    function onPointerDown(event: PointerEvent) {
      if (event.target instanceof Node && !header.current?.contains(event.target)) setMenuOpen(false);
    }
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [menuOpen]);

  return <div className="itda-landing" id="top">
    <a className="landing-skip" href="#main-content">본문 바로가기</a>
    <header className="landing-header" ref={header}>
      <div className="landing-header-inner">
        <a className="landing-logo" href={appUrl("landing")} aria-label="맛&멋 AI Street 홈">
          <strong>ITDA<span aria-hidden="true" /></strong><small>맛&멋 AI Street</small>
        </a>
        <nav className="landing-desktop-nav" aria-label="주 메뉴">
          {navigation.map(item => <a key={item.href} href={item.href}>{item.label}</a>)}
        </nav>
        <button className="landing-menu-toggle" ref={menuToggle} type="button"
          aria-label={menuOpen ? "전체 메뉴 닫기" : "전체 메뉴 열기"}
          aria-expanded={menuOpen} aria-controls="landing-full-menu"
          onClick={() => setMenuOpen(open => !open)}><span /><span /><span /></button>
      </div>
      <nav id="landing-full-menu" className="landing-full-menu" aria-label="전체 메뉴" hidden={!menuOpen}>
        {navigation.map((item, index) => <a key={item.href} href={item.href} onClick={() => setMenuOpen(false)}>
          {item.label}<span>0{index + 1}</span>
        </a>)}
      </nav>
    </header>
    <main id="main-content" tabIndex={-1}>
      <section className="landing-hero" aria-labelledby="landing-hero-title">
        <img className="landing-hero-image" src="/brand/incheon-bridge.jpg" alt="" fetchPriority="high" width="1200" height="801" />
        <div className="landing-hero-overlay" />
        <div className="landing-hero-content">
          <p className="landing-eyebrow">CONNECTING INCHEON</p>
          <h1 id="landing-hero-title">인천의 맛과 멋,<br />사람과 거리를<br />연결합니다.</h1>
          <p className="landing-hero-desc">지역의 가게와 사람, 새로운 가능성을 잇는<br />맛&멋 AI Street</p>
          <a className="landing-start-button" href={appUrl("customer")}>지금 시작하기 <ArrowRight size={24} aria-hidden="true" /></a>
        </div>
        <div className="landing-hero-bottom"><span>사람과 도시 사이, 새로운 연결</span><a href="#services" aria-label="주요 서비스로 내려가기">SCROLL TO EXPLORE <ArrowDown size={20} aria-hidden="true" /></a></div>
      </section>
      <section id="services" className="landing-services" aria-label="주요 서비스">
        <a href={appUrl("customer")} className="landing-service-card">
          <svg viewBox="0 0 64 64" fill="none" aria-hidden="true"><path d="M12 55V22L32 8l20 14v33H12Z" /><path d="M19 55V30a5 5 0 0 1 10 0v25m6 0V30a5 5 0 0 1 10 0v25M19 45h10m6-7h10" /></svg>
          <h2>인천의 이야기</h2><p>지역의 맛과 멋을 탐색</p><ArrowUpRight className="landing-card-arrow" size={18} aria-hidden="true" />
        </a>
        <a href={appUrl("owner")} className="landing-service-card">
          <svg viewBox="0 0 64 64" fill="none" aria-hidden="true"><circle cx="32" cy="18" r="9" /><path d="M11 55v-7c0-10 8-16 21-16s21 6 21 16v7M22 39v16m20-16v16M11 47h11m20 0h11" /></svg>
          <h2>함께하는 성장</h2><p>상인이 만드는 변화</p><ArrowUpRight className="landing-card-arrow" size={18} aria-hidden="true" />
        </a>
        <a href="#future" className="landing-service-card">
          <svg viewBox="0 0 64 64" fill="none" aria-hidden="true"><circle cx="32" cy="32" r="24" /><path d="m32 16 6 9 10 1-6 8 2 11-12-5-12 5 2-11-6-8 10-1 6-9Z" /></svg>
          <h2>더 나은 내일</h2><p>인천과 함께</p><ArrowUpRight className="landing-card-arrow" size={18} aria-hidden="true" />
        </a>
      </section>
      <section id="about" className="landing-about landing-content-section">
        <div><p className="landing-section-label">ABOUT US</p><h2>가까운 일상에서 시작되는<br /><span>인천의 새로운 가능성.</span></h2></div>
        <p>우리가 살아가는 도시의 이야기를 발견하고,<br />지역의 가치를 함께 이어갑니다.<br />사람과 사람을 잇는 작은 연결이<br />인천의 더 나은 내일이 됩니다.</p>
      </section>
      <section className="landing-stories landing-content-section" aria-label="서비스 소개">
        <article id="story"><span className="landing-number">01 / LOCAL STORY</span><h3>인천의 이야기</h3><p>익숙한 골목의 새로운 모습.<br />지도로 가게를 찾고 층별 위치와<br />거리 사진을 만나보세요.</p><a className="landing-detail-link" href={appUrl("customer")}>거리 탐색하기 <ArrowUpRight size={17} aria-hidden="true" /></a></article>
        <article id="growth"><span className="landing-number">02 / TOGETHER</span><h3>함께하는 성장</h3><p>상점의 매력과 사람들의 발걸음이 만나<br />지역에 새로운 활기를 더합니다.<br />가게 홍보 문구와 프로모션을 시범 제작해 보세요.</p><a className="landing-detail-link" href={appUrl("owner")}>점주용 서비스 이용하기 <ArrowUpRight size={17} aria-hidden="true" /></a></article>
        <article id="future"><span className="landing-number">03 / NEXT INCHEON</span><h3>더 나은 내일</h3><p>송도 타임스페이스에서 시작하는 연결.<br />지역의 맛과 멋을 발견하며<br />인천의 새로운 일상을 함께 그려갑니다.</p><a className="landing-detail-link" href="#news">서비스 소식 보기 <ArrowUpRight size={17} aria-hidden="true" /></a></article>
      </section>
      <section id="news" className="landing-news landing-content-section">
        <div className="landing-section-heading"><div><p className="landing-section-label">WHAT&apos;S NEW</p><h2>새로운 연결의 소식</h2></div><span className="landing-demo-label">시범 서비스</span></div>
        <button type="button" className="landing-news-item" onClick={() => newsDialog.current?.showModal()} aria-haspopup="dialog">
          <span className="landing-news-type">안내</span><strong>송도 타임스페이스에서 맛&멋 AI Street를 만나보세요.</strong><ArrowUpRight className="landing-news-arrow" size={18} aria-hidden="true" />
        </button>
        <p className="landing-sample-note">현재 등록된 가게와 행사는 시연용 데이터입니다. 실제 영업 정보와 AI 자동 업데이트 기능은 아직 연동되지 않았습니다.</p>
      </section>
      <section id="contact" className="landing-contact landing-content-section">
        <div><p className="landing-section-label">LET&apos;S CONNECT</p><h2>함께 잇는<br />우리 동네의 가능성.</h2><p>가게를 찾는 즐거움부터 우리 가게를 알리는 일까지.</p></div>
        <a className="landing-contact-button" href="#services">서비스 선택하기 <ArrowUpRight size={18} aria-hidden="true" /></a>
      </section>
    </main>
    <footer className="landing-footer">
      <a className="landing-footer-logo" href={appUrl("landing")}>ITDA</a>
      <div><p>사람과 도시, 그리고 가능성을 잇습니다.</p><small>© ITDA · 맛&멋 AI Street</small><small>배너 사진: <a href="https://www.ito.or.kr/bbs/bbsMsgDetail.do?bcd=galleryko&msg_seq=264&pgno=17" target="_blank" rel="noreferrer">인천관광공사 · 인천관광 갤러리</a></small></div>
      <div className="landing-footer-links"><a href={appUrl("editor")}>관리자</a><a href="#top">맨 위로 ↑</a></div>
    </footer>
    <dialog className="landing-dialog" ref={newsDialog} aria-labelledby="landing-dialog-title" aria-describedby="landing-dialog-text"
      onClick={event => {
        if (event.target !== event.currentTarget) return;
        const rect = event.currentTarget.getBoundingClientRect();
        if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) event.currentTarget.close();
      }}>
      <button type="button" className="landing-dialog-close" aria-label="닫기" onClick={() => newsDialog.current?.close()}>×</button>
      <p className="landing-section-label">ITDA · CONNECTING INCHEON</p><h2 id="landing-dialog-title">새로운 연결의 시작</h2>
      <p id="landing-dialog-text">맛&멋 AI Street는 송도 타임스페이스의 가게와 사람을 연결하는 시범 서비스입니다.<br /><br />소비자용 화면에서는 지도와 층별 위치, 거리 사진을 탐색할 수 있습니다. 점주용 화면에서는 홍보 문구와 프로모션을 시범 제작하고 검토할 수 있습니다.<br /><br />현재 가게·행사 정보와 문구 생성은 시연용이며, 실제 영업 정보와 AI 자동 업데이트는 아직 연동되지 않았습니다.</p>
      <button type="button" className="landing-dialog-confirm" onClick={() => newsDialog.current?.close()}>확인</button>
    </dialog>
  </div>;
}
