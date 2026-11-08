import "../styles/ServiceUpgrade.css";
import { useEffect, useState } from "react";
import { ArrowRight, Store } from "lucide-react";
import { appUrl } from "../config/site";
import { useAdminAuth } from "../auth/adminAuth";
import EditorShell from "../components/EditorShell";
import { readStreetNodes } from "../data/streetNetwork";
import { useStoreDraft } from "../data/storeDraft";
import { usePublicSite } from "../data/sitePublication";
import { fetchPromotionPolicy, type PromotionPolicy } from "../data/promotionWorkflow";

/**
 * The admin front page: four key numbers, the floor counts and a short store list.
 * Sources, backup and editing tools live on their own menu pages.
 */
export default function EditorDashboard() {
  const { getSession, demo } = useAdminAuth();
  const drafts = useStoreDraft();
  const publication = usePublicSite();
  const stores = publication.data?.stores || drafts;
  const source = publication.data ? "서버 게시본" : "브라우저 초안";
  const pointCount = publication.data?.nodes.length ?? readStreetNodes().length;
  const [policy,setPolicy] = useState<PromotionPolicy | null>(null);
  const [policyNotice,setPolicyNotice] = useState("");
  useEffect(() => {
    document.title = "맛&멋 AI Street | 관리자";
    if (demo) return;
    let active = true;
    void getSession().then(current => fetchPromotionPolicy(current.token)).then(next => { if(active) setPolicy(next); }).catch(error => { if(active) setPolicyNotice(error instanceof Error ? error.message : "게시 정책을 불러오지 못했습니다."); });
    return () => {active=false;};
  },[getSession, demo]);
  const floors = [1,2,3].map(floor => ({floor,count:stores.filter(store => store.floor===floor).length}));
  const maximum = Math.max(1,...floors.map(item => item.count));
  const publishedOn = publication.publishedAt ? new Date(publication.publishedAt).toLocaleDateString("ko-KR") : "—";
  return <EditorShell title="대시보드">
    <section className="editor-dashboard-metrics" aria-label="운영 현황">
      <article className="editor-dashboard-metric"><p>점포 수</p><strong>{stores.length}</strong><small>{source} 기준</small></article>
      <article className="editor-dashboard-metric"><p>거리 사진 촬영 지점</p><strong>{pointCount}</strong><small>{publication.data ? "서버 게시본" : "브라우저 초안"}</small></article>
      <article className="editor-dashboard-metric"><p>마지막 전체 게시</p><strong className="editor-dashboard-date">{publishedOn}</strong><small>{publication.data ? "손님 화면에 공개 중" : "아직 게시본 없음"}</small></article>
      <article className="editor-dashboard-metric"><p>점포당 게시 한도</p><strong>{policy ? `${policy.daily_limit}회` : "—"}</strong><small>{demo ? "관리자 로그인 후 확인" : policy ? policy.enabled ? "하루 · 한국시간 자정 초기화" : "직접 게시 일시 중지" : policyNotice ? "불러오지 못함" : "확인 중…"}</small></article>
    </section>
    {policyNotice && !demo && <p className="editor-notice" role="status">{policyNotice}</p>}
    <div className="editor-dashboard-bottom">
      <section className="editor-panel"><div className="editor-panel-heading"><h2>층별 점포 현황</h2><span>{source} · 총 {stores.length}곳</span></div>
        <div className="editor-dashboard-chart" role="img" aria-label={floors.map(item=>`${item.floor}층 ${item.count}곳`).join(", ")}>
          {floors.map(item => <div className="editor-dashboard-chart-row" key={item.floor}><span>{item.floor}층</span><div className="editor-dashboard-chart-track"><div className="editor-dashboard-chart-fill" style={{width:`${item.count/maximum*100}%`}} /></div><strong>{item.count}곳</strong></div>)}
        </div>
      </section>
      <section className="editor-panel"><div className="editor-panel-heading"><h2>점포 목록</h2><a className="editor-more" href={appUrl("editor","/catalog")}>전체 {stores.length}곳 관리 <ArrowRight size={15}/></a></div>
        {stores.slice(0,4).map(store => <a className="editor-dashboard-store" href={appUrl("editor","/catalog")} key={store.id}><span className="editor-dashboard-store-icon"><Store size={25}/></span><span><strong>{store.name}</strong><small>{store.category} · {store.building} {store.floor}층</small></span><ArrowRight size={18}/></a>)}
        {!stores.length && <p>아직 등록된 점포가 없습니다.</p>}
      </section>
    </div>
  </EditorShell>;
}
