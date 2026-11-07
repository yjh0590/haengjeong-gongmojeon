import { useEffect, useRef, type MouseEvent } from "react";
import { ArrowRight, ArrowUpRight, MapPin, MapPinned, Store, Settings2 } from "lucide-react";
import { appUrl } from "../config/site";
import "../styles/Landing.css";
import SiteBrand from "../components/SiteBrand";
import CharacterAccent from "../components/CharacterAccent";
import GuideLibrary from "../components/GuideLibrary";

export default function Landing() {
  const services = useRef<HTMLElement>(null);

  useEffect(() => {
    document.title = "맛&멋 AI Street | 메인";
  }, []);

  /**
   * The cards are already on screen, so "find a service" points at them instead of opening anything.
   * Each card grows and settles back one after another, so the eye lands on the three choices.
   */
  function showServices(event: MouseEvent<HTMLAnchorElement>) {
    event.preventDefault();
    const cards = Array.from(services.current?.querySelectorAll("a") ?? []);
    cards[0]?.focus({ preventScroll: true });
    services.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const ring = "0 0 0 3px rgba(68,108,194,.55), 0 16px 34px rgba(42,82,170,.26)";
    cards.forEach((card, index) => {
      card.style.zIndex = "2";
      card.animate(
        [
          { transform: "scale(1)", boxShadow: "0 0 0 0 rgba(68,108,194,0)" },
          { transform: "scale(1.1)", boxShadow: ring, offset: 0.35 },
          { transform: "scale(0.97)", boxShadow: ring, offset: 0.6 },
          { transform: "scale(1.02)", offset: 0.8 },
          { transform: "scale(1)", boxShadow: "0 0 0 0 rgba(68,108,194,0)" },
        ],
        { duration: 900, delay: index * 140, easing: "ease-in-out" },
      ).finished.then(() => { card.style.zIndex = ""; }, () => { card.style.zIndex = ""; });
    });
  }

  return <div className="itda-landing">
    <a className="landing-skip" href="#main-content">본문 바로가기</a>
    <header className="landing-header">
      <a className="landing-brand-link" href={appUrl("landing")} aria-label="맛&멋 AI Street 홈">
        <SiteBrand role="landing" />
      </a>
      <span className="location-pill"><MapPin size={15} aria-hidden="true" /> 송도 타임스페이스 <span className="demo-dot">시범 구역</span></span>
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
          <a className="landing-start-button" href="#services" onClick={showServices}>나에게 맞는 서비스 찾기 <ArrowRight size={24} aria-hidden="true" /></a>
        </div>
        <GuideLibrary />
      </section>
      <section id="services" ref={services} className="landing-services" aria-label="주요 서비스">
        <a href={appUrl("customer")} className="landing-service-card">
          <MapPinned aria-hidden="true" /><span className="landing-card-role">손님용 서비스</span>
          <h2>가게·거리 탐색</h2><p>가게 정보부터 층별 위치, <br />거리 사진까지 한곳에서.</p>
          <span className="landing-card-cta"><span className="landing-card-cta-label">가게 둘러보기</span> <ArrowUpRight size={17} aria-hidden="true" /></span>
        </a>
        <a href={appUrl("owner")} className="landing-service-card">
          <Store aria-hidden="true" /><span className="landing-card-role">점주용 서비스</span>
          <h2>우리 가게 홍보</h2><p>홍보 문구를 만들고, <br />가게의 새로운 소식을 전하세요.</p>
          <span className="landing-card-cta"><span className="landing-card-cta-label">점주용 서비스 열기</span> <ArrowUpRight size={17} aria-hidden="true" /></span>
        </a>
        <a href={appUrl("editor")} className="landing-service-card">
          <Settings2 aria-hidden="true" /><span className="landing-card-role">관리자용 서비스</span>
          <h2>상권 정보 관리</h2><p>점포와 지도, 거리 사진을 <br />관리하고 게시하세요.</p>
          <span className="landing-card-cta"><span className="landing-card-cta-label">관리자 로그인</span> <ArrowUpRight size={17} aria-hidden="true" /></span>
        </a>
      </section>
    </main>
    <footer className="landing-footer">
      <a className="landing-footer-logo" href={appUrl("landing")}>ITDA</a>
      <p>사람과 도시, 그리고 가능성을 잇습니다.</p>
      <small>© ITDA · 맛&멋 AI Street</small>
      <small>배너 사진: <a href="https://www.ito.or.kr/bbs/bbsMsgDetail.do?bcd=galleryko&msg_seq=264&pgno=17" target="_blank" rel="noreferrer">인천관광공사 · 인천관광 갤러리</a></small>
      <a className="landing-footer-admin" href={appUrl("editor")}>관리자용</a>
    </footer>
  </div>;
}
