import { useEffect } from "react";
import { ArrowRight, Compass, MapPinned, Sparkles, Store, Users } from "lucide-react";
import { appUrl } from "../config/site";
import "../styles/Portal.css";

const cards = [
  { title: "소비자용 거리 탐색", label: "CUSTOMER", detail: "지도로 가게를 찾고 층별 위치와 거리 사진을 확인하세요.", icon: Compass, href: appUrl("customer"), button: "거리 탐색하기" },
  { title: "점주용 AI 마케팅", label: "OWNER", detail: "가게 홍보 문구와 프로모션을 시범 제작하고 검토하세요.", icon: Store, href: appUrl("owner"), button: "점주용 화면" },
];
export default function Landing() {
  useEffect(() => { document.title = "ITDA · 지역의 맛과 멋을 잇다"; }, []);
  return <div className="portal-page">
    <div className="portal-glow" aria-hidden="true"/>
    <header className="portal-top"><a className="portal-logo" href={appUrl("landing")}><span className="portal-mark"><Sparkles size={22}/></span><span><strong>ITDA</strong><small>맛&멋 AI Street</small></span></a><span className="portal-meta">송도 타임스페이스 · 시범 서비스</span></header>
    <main className="portal-content">
      <div className="portal-lead"><span className="portal-kicker"><MapPinned size={16}/> OUR LOCAL CONNECTION</span><h1>동네의 맛과 멋을,<br/><em>잇다.</em></h1><p>지역의 가게와 사람을 연결하는 AI Street.<br/>방문 목적에 맞는 서비스를 선택해 주세요.</p></div>
      <div className="portal-cards">{cards.map(({title,label,detail,icon:Icon,href,button})=><a className="portal-card" key={label} href={href}><span className="portal-card-icon"><Icon size={27}/></span><span className="portal-card-kicker">{label}</span><strong>{title}</strong><p>{detail}</p><span className="portal-card-cta">{button} <ArrowRight size={17}/></span></a>)}</div>
      <div className="portal-notice"><Users size={17}/><span>현재 등록된 가게와 행사는 시연용 데이터입니다. 실제 영업 정보와 AI 자동 업데이트 기능은 아직 연동되지 않았습니다.</span></div>
    </main>
    <footer className="portal-footer">ITDA · 맛&멋 AI Street <span>지역을 잇는 거리 탐색 프로젝트</span></footer>
  </div>;
}
