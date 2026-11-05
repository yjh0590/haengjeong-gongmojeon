import { useEffect, useRef, useState } from "react";
import { ArrowDown, ArrowRight, ArrowUpRight, MapPinned, Store, Settings2 } from "lucide-react";
import { appUrl } from "../config/site";
import "../styles/Landing.css";
import SiteBrand from "../components/SiteBrand";
import CharacterAccent from "../components/CharacterAccent";
import GuideLibrary from "../components/GuideLibrary";

const navigation = [
  { href: "#services", label: "서비스 둘러보기" },
  { href: "#guide", label: "이용 방법" },
];

export default function Landing() {
  const [menuOpen, setMenuOpen] = useState(false);
  const guideTrigger = useRef<HTMLButtonElement>(null);
  const header = useRef<HTMLElement>(null);
  const menuToggle = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    document.title = "맛&멋 AI Street | 메인";
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
        <a className="landing-brand-link" href={appUrl("landing")} aria-label="맛&멋 AI Street 홈">
          <SiteBrand role="landing" />
        </a>
        <nav className="landing-desktop-nav" aria-label="주 메뉴">
          {navigation.map(item => <a key={item.href} href={item.href} aria-haspopup={item.href === "#guide" ? "dialog" : undefined} onClick={event => { if (item.href === "#guide") { event.preventDefault(); guideTrigger.current?.click(); } }}>{item.label}</a>)}
        </nav>
        <button className="landing-menu-toggle" ref={menuToggle} type="button"
          aria-label={menuOpen ? "전체 메뉴 닫기" : "전체 메뉴 열기"}
          aria-expanded={menuOpen} aria-controls="landing-full-menu"
          onClick={() => setMenuOpen(open => !open)}><span /><span /><span /></button>
      </div>
      <nav id="landing-full-menu" className="landing-full-menu" aria-label="전체 메뉴" hidden={!menuOpen}>
        {navigation.map((item, index) => <a key={item.href} href={item.href} aria-haspopup={item.href === "#guide" ? "dialog" : undefined} onClick={event => { setMenuOpen(false); if (item.href === "#guide") { event.preventDefault(); guideTrigger.current?.click(); } }}>
          {item.label}<span>0{index + 1}</span>
        </a>)}
      </nav>
    </header>
    <main id="main-content" tabIndex={-1}>
      <section className="landing-hero" aria-labelledby="landing-hero-title">
        <img className="landing-hero-image" src="/brand/incheon-bridge.jpg" alt="" fetchPriority="high" width="1200" height="801" />
        <div className="landing-hero-overlay" />
        <CharacterAccent scene="together" className="landing-hero-characters" priority />
        <div className="landing-hero-content">
          <p className="landing-eyebrow">CONNECTING INCHEON</p>
          <h1 id="landing-hero-title">인천의 맛과 멋,<br />사람과 거리를<br />연결합니다.</h1>
          <p className="landing-hero-desc">가고 싶은 가게를 찾고, 우리 가게의 소식을 전하는<br />송도 타임스페이스 상권 서비스</p>
          <a className="landing-start-button" href="#services">나에게 맞는 서비스 찾기 <ArrowRight size={24} aria-hidden="true" /></a>
        </div>
        <div className="landing-hero-bottom"><span>사람과 도시 사이, 새로운 연결</span><a href="#services" aria-label="주요 서비스로 내려가기">SCROLL TO EXPLORE <ArrowDown size={20} aria-hidden="true" /></a></div>
      </section>
      <section id="services" className="landing-services" aria-label="주요 서비스">
        <a href={appUrl("customer")} className="landing-service-card">
          <MapPinned aria-hidden="true" /><span className="landing-card-role">손님용 서비스</span>
          <h2>가게·거리 탐색</h2><p>가게 정보부터 층별 위치,<br />거리 사진까지 한곳에서.</p>
          <span className="landing-card-cta">가게 둘러보기 <ArrowUpRight size={17} aria-hidden="true" /></span>
        </a>
        <a href={appUrl("owner")} className="landing-service-card">
          <Store aria-hidden="true" /><span className="landing-card-role">점주용 서비스</span>
          <h2>우리 가게 홍보</h2><p>홍보 문구를 만들고,<br />가게의 새로운 소식을 전하세요.</p>
          <span className="landing-card-cta">점주용 서비스 열기 <ArrowUpRight size={17} aria-hidden="true" /></span>
        </a>
        <a href={appUrl("editor")} className="landing-service-card">
          <Settings2 aria-hidden="true" /><span className="landing-card-role">관리자를 위한 서비스</span>
          <h2>상권 정보 관리</h2><p>점포와 지도, 거리 사진을<br />관리하고 게시하세요.</p>
          <span className="landing-card-cta">관리자 로그인 <ArrowUpRight size={17} aria-hidden="true" /></span>
        </a>
      </section>
      <GuideLibrary triggerRef={guideTrigger}>
      <section id="faq" className="landing-faq landing-content-section" aria-labelledby="landing-faq-title">
        <div><p className="landing-section-label">QUICK ANSWERS</p><h2 id="landing-faq-title">이용 전 궁금한 점</h2><p className="landing-faq-intro">처음 이용하신다면 확인해 보세요.</p></div>
        <div className="landing-faq-list">
          <details><summary>어느 지역의 가게를 볼 수 있나요?</summary><p>현재 송도 타임스페이스를 중심으로 가게와 층별 위치, 거리 사진을 탐색할 수 있습니다. 등록된 정보와 사진이 있는 구역부터 확인할 수 있습니다.</p></details>
          <details><summary>로그인이 필요한가요?</summary><p>가게와 거리 탐색은 로그인 없이 이용할 수 있습니다. 가게 소식 게시는 담당 점포가 배정된 점주 계정이 필요하며, 상권 정보 관리는 관리자 로그인 후 이용할 수 있습니다.</p></details>
          <details><summary>홍보 문구는 어떻게 만들어지나요?</summary><p>현재 홍보 문구는 입력한 내용과 예시를 바탕으로 만드는 시연 기능입니다. 생성된 문구의 메뉴, 가격, 행사 조건을 확인하고 수정한 뒤 사용해 주세요.</p></details>
          <details><summary>점포 정보를 새로 등록하거나 수정하고 싶어요.</summary><p>점포 등록과 기본 정보 수정은 관리자가 진행합니다. 점주용 서비스에서는 담당 가게의 홍보 문구를 만들고 소식을 게시할 수 있습니다.</p></details>
        </div>
      </section>
      </GuideLibrary>
    </main>
    <footer className="landing-footer">
      <a className="landing-footer-logo" href={appUrl("landing")}>ITDA</a>
      <div><p>사람과 도시, 그리고 가능성을 잇습니다.</p><small>© ITDA · 맛&멋 AI Street</small><small>배너 사진: <a href="https://www.ito.or.kr/bbs/bbsMsgDetail.do?bcd=galleryko&msg_seq=264&pgno=17" target="_blank" rel="noreferrer">인천관광공사 · 인천관광 갤러리</a></small></div>
      <div className="landing-footer-links"><a href={appUrl("editor")}>관리자</a><a href="#top">맨 위로 ↑</a></div>
    </footer>
  </div>;
}
