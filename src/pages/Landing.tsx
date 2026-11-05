import { useEffect, useRef, useState } from "react";
import { ArrowDown, ArrowRight, ArrowUpRight, MapPinned, Store, Settings2, Check } from "lucide-react";
import { appUrl } from "../config/site";
import "../styles/Landing.css";

const navigation = [
  { href: "#services", label: "서비스 둘러보기" },
  { href: "#guide", label: "이용 방법" },
  { href: "#faq", label: "자주 묻는 질문" },
];

const guides = {
  customer: {
    label: "방문객", title: "어디에 갈지, 어떻게 찾을지 한눈에.",
    description: "송도 타임스페이스의 가게를 지도와 거리 사진으로 살펴보고 방문할 곳을 찾아보세요.",
    steps: [
      { title: "취향에 맞는 가게 찾기", text: "가게 목록에서 맛집과 볼거리를 살펴보고 관심 있는 가게를 선택하세요." },
      { title: "건물과 층별 위치 확인하기", text: "안내도에서 층을 바꾸며 가게가 있는 위치를 확인하세요." },
      { title: "거리 사진으로 주변 살펴보기", text: "촬영 지점을 선택해 가게 주변의 모습과 입구를 살펴보세요." },
    ], cta: "가게 탐색 시작하기",
  },
  owner: {
    label: "점주", title: "우리 가게의 소식, 더 쉽게 전해요.",
    description: "알리고 싶은 내용을 홍보 문구로 정리하고, 담당 가게의 소식을 직접 게시하세요.",
    steps: [
      { title: "가게와 홍보할 내용 선택하기", text: "우리 가게를 고르고 오늘 알리고 싶은 메뉴, 행사, 혜택을 입력하세요." },
      { title: "홍보 문구 만들고 다듬기", text: "예시 기반으로 만든 거리 안내 문구, SNS 문구와 숏폼 대본을 확인하세요." },
      { title: "확인한 소식 직접 게시하기", text: "담당 점포 계정으로 로그인한 뒤 게시 한도 안에서 가게 소식을 게시하세요." },
    ], cta: "우리 가게 홍보 시작하기",
  },
};

export default function Landing() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [audience, setAudience] = useState<"customer" | "owner">("customer");
  const guide = guides[audience];
  const header = useRef<HTMLElement>(null);
  const menuToggle = useRef<HTMLButtonElement>(null);

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
          <p className="landing-hero-desc">가고 싶은 가게를 찾고, 우리 가게의 소식을 전하는<br />송도 타임스페이스 상권 서비스</p>
          <a className="landing-start-button" href="#services">나에게 맞는 서비스 찾기 <ArrowRight size={24} aria-hidden="true" /></a>
        </div>
        <div className="landing-hero-bottom"><span>사람과 도시 사이, 새로운 연결</span><a href="#services" aria-label="주요 서비스로 내려가기">SCROLL TO EXPLORE <ArrowDown size={20} aria-hidden="true" /></a></div>
      </section>
      <section id="services" className="landing-services" aria-label="주요 서비스">
        <a href={appUrl("customer")} className="landing-service-card">
          <MapPinned aria-hidden="true" /><span className="landing-card-role">방문객을 위한 서비스</span>
          <h2>가게·거리 탐색</h2><p>가게 정보부터 층별 위치,<br />거리 사진까지 한곳에서.</p>
          <span className="landing-card-cta">가게 둘러보기 <ArrowUpRight size={17} aria-hidden="true" /></span>
        </a>
        <a href={appUrl("owner")} className="landing-service-card">
          <Store aria-hidden="true" /><span className="landing-card-role">점주를 위한 서비스</span>
          <h2>우리 가게 홍보</h2><p>홍보 문구를 만들고,<br />가게의 새로운 소식을 전하세요.</p>
          <span className="landing-card-cta">점주 서비스 열기 <ArrowUpRight size={17} aria-hidden="true" /></span>
        </a>
        <a href={appUrl("editor")} className="landing-service-card">
          <Settings2 aria-hidden="true" /><span className="landing-card-role">관리자를 위한 서비스</span>
          <h2>상권 정보 관리</h2><p>점포와 지도, 거리 사진을<br />관리하고 게시하세요.</p>
          <span className="landing-card-cta">관리자 로그인 <ArrowUpRight size={17} aria-hidden="true" /></span>
        </a>
      </section>
      <section id="guide" className="landing-guide landing-content-section" aria-labelledby="landing-guide-title">
        <div className="landing-guide-heading">
          <div><p className="landing-section-label">HOW TO USE</p><h2 id="landing-guide-title">이렇게 시작해 보세요.</h2></div>
          <div className="landing-audience-switch" role="group" aria-label="이용자별 사용 방법">
            {(["customer", "owner"] as const).map(role => <button key={role} type="button" aria-pressed={audience === role}
              aria-controls="landing-guide-content" onClick={() => setAudience(role)}>{guides[role].label}</button>)}
          </div>
        </div>
        <div id="landing-guide-content" className={`landing-guide-panel landing-guide-${audience}`}>
          <div className="landing-guide-intro">
            <span className="landing-guide-badge"><Check size={14} aria-hidden="true" />{guide.label} 이용 가이드</span>
            <h3>{guide.title}</h3><p>{guide.description}</p>
            <a className="landing-guide-cta" href={appUrl(audience)}>{guide.cta}<ArrowRight size={18} aria-hidden="true" /></a>
          </div>
          <ol className="landing-guide-steps">
            {guide.steps.map((step, index) => <li key={step.title}><span aria-hidden="true">0{index + 1}</span><div><h4>{step.title}</h4><p>{step.text}</p></div></li>)}
          </ol>
        </div>
      </section>
      <section id="faq" className="landing-faq landing-content-section" aria-labelledby="landing-faq-title">
        <div><p className="landing-section-label">QUICK ANSWERS</p><h2 id="landing-faq-title">이용 전 궁금한 점</h2><p className="landing-faq-intro">처음 이용하신다면 확인해 보세요.</p></div>
        <div className="landing-faq-list">
          <details><summary>어느 지역의 가게를 볼 수 있나요?</summary><p>현재 송도 타임스페이스를 중심으로 가게와 층별 위치, 거리 사진을 탐색할 수 있습니다. 등록된 정보와 사진이 있는 구역부터 확인할 수 있습니다.</p></details>
          <details><summary>로그인이 필요한가요?</summary><p>가게와 거리 탐색은 로그인 없이 이용할 수 있습니다. 가게 소식 게시는 담당 점포가 배정된 점주 계정이 필요하며, 상권 정보 관리는 관리자 로그인 후 이용할 수 있습니다.</p></details>
          <details><summary>홍보 문구는 어떻게 만들어지나요?</summary><p>현재 홍보 문구는 입력한 내용과 예시를 바탕으로 만드는 시연 기능입니다. 생성된 문구의 메뉴, 가격, 행사 조건을 확인하고 수정한 뒤 사용해 주세요.</p></details>
          <details><summary>점포 정보를 새로 등록하거나 수정하고 싶어요.</summary><p>점포 등록과 기본 정보 수정은 관리자가 진행합니다. 점주 서비스에서는 담당 가게의 홍보 문구를 만들고 소식을 게시할 수 있습니다.</p></details>
        </div>
      </section>
    </main>
    <footer className="landing-footer">
      <a className="landing-footer-logo" href={appUrl("landing")}>ITDA</a>
      <div><p>사람과 도시, 그리고 가능성을 잇습니다.</p><small>© ITDA · 맛&멋 AI Street</small><small>배너 사진: <a href="https://www.ito.or.kr/bbs/bbsMsgDetail.do?bcd=galleryko&msg_seq=264&pgno=17" target="_blank" rel="noreferrer">인천관광공사 · 인천관광 갤러리</a></small></div>
      <div className="landing-footer-links"><a href={appUrl("editor")}>관리자</a><a href="#top">맨 위로 ↑</a></div>
    </footer>
  </div>;
}
