import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Camera, CheckCircle2, Download, FileUp, Info, MapPinned, ShieldAlert, Store } from "lucide-react";
import { appUrl, currentSurface, sameOriginPreview } from "../config/site";
import { readMapGeometry } from "../data/mapGeometry";
import { getFacadeAnnotations } from "../data/facadeAnnotations";
import { listDraftPhotos } from "../data/localStreetPhotos";
import { readStreetNodes } from "../data/streetNetwork";
import { downloadEditorBackup, importEditorBackup } from "../data/editorBackup";
import { readStoreDraft } from "../data/storeDraft";
import { publicationConfigured } from "../data/sitePublication";
import "../styles/Portal.css";

export default function EditorDashboard(){
  const [photoCount,setPhotoCount]=useState<number|null>(null);
  const [busy,setBusy]=useState(false);
  const [notice,setNotice]=useState("수정 내용은 브라우저 초안에 저장됩니다. 점포 데이터 관리에서 관리자 승인 후 서버로 게시할 수 있어요.");
  const input=useRef<HTMLInputElement>(null);
  const [metrics,setMetrics]=useState(()=>({nodes:readStreetNodes().length,facades:getFacadeAnnotations().length,boundary:readMapGeometry().boundary.length}));
  const refresh=()=>{
    setMetrics({nodes:readStreetNodes().length,facades:getFacadeAnnotations().length,boundary:readMapGeometry().boundary.length});
    void listDraftPhotos().then(p=>setPhotoCount(p.length)).catch(()=>setPhotoCount(0));
  };
  useEffect(()=>{document.title="ITDA · 관리자 작업 공간";refresh();},[]);
  const backup=async()=>{
    setBusy(true);
    try{const count=await downloadEditorBackup();setNotice(`점포·지도·영역·촬영 지점·사진 ${count}개를 포함한 JSON 백업을 다운로드했어요.`);}
    catch(e){setNotice(e instanceof Error?e.message:"백업을 만들지 못했어요.");}
    finally{setBusy(false);}
  };
  const restore=async(file?:File)=>{
    if(!file)return;
    if(!window.confirm("현재 이 주소에 저장된 지도·사진·영역 설정을 백업 내용으로 덮어쓸까요? 기존 데이터는 되돌릴 수 없습니다."))return;
    setBusy(true);
    try{const count=await importEditorBackup(file);setNotice(`백업을 복원했어요. 이미지 ${count}개를 포함한 설정을 현재 주소에 저장했습니다.`);refresh();}
    catch(e){setNotice(e instanceof Error?e.message:"백업을 복원하지 못했어요.");}
    finally{setBusy(false);if(input.current)input.current.value="";}
  };
  return <div className="hub-page"><div className="hub-container">
    <header className="hub-top"><a href={appUrl("landing")}><ArrowLeft size={16}/> ITDA 메인</a><strong>관리자 작업 공간 · 시범 운영</strong><a href={sameOriginPreview()}>이 주소에서 미리보기 <ArrowRight size={15}/></a></header>
    <section className="hub-title"><span className="hub-eyebrow">ITDA STREET CONTROL</span><h1>전체 상권을 관리하는 작업 공간</h1><p>점포 정보를 등록하고 지도·촬영 지점·가게 외곽선을 편집한 뒤, 마지막에 검토하여 게시하세요.<br/><strong>{publicationConfigured?"Supabase 연결 설정 감지됨":"DB 연결 전 · 브라우저 초안 모드"}</strong> · 사진 파일의 서버 업로드는 아직 지원하지 않습니다.</p></section>
    <div className="hub-status"><div className="hub-metric"><strong>{metrics.nodes}</strong><small>촬영 지점</small></div><div className="hub-metric"><strong>{photoCount===null?"…":photoCount}</strong><small>임시 이미지(지도 포함)</small></div><div className="hub-metric"><strong>{metrics.facades}</strong><small>가게 외곽선</small></div></div>
    <div className="hub-grid">
      <section className="hub-card"><Store size={30}/><h2>01 · 점포 데이터·게시</h2><p>가게 이름, 동·층·호수, 업종, 이벤트를 수정하고 관리자 승인 후 소비자 페이지에 게시합니다. 초안 점포 {readStoreDraft().length}곳.</p><a className="hub-link" href="/catalog">점포 등록·게시 관리 <ArrowRight size={16}/></a></section>
      <section className="hub-card"><MapPinned size={30}/><h2>02 · 전체 지도 관리</h2><p>상권 경계·보행 통로를 그리고 촬영 지점, 가게 위치와 층별 연결을 지정합니다. 경계점 {metrics.boundary}개가 등록돼 있어요.</p><a className="hub-link" href="/map-editor">지도 편집 시작 <ArrowRight size={16}/></a></section>
      <section className="hub-card"><Camera size={30}/><h2>03 · 거리 사진 관리</h2><p>촬영한 사진을 지점별 앞·뒤·좌·우에 임시 등록하고, 가게 외관을 따라 강조 영역을 그립니다.</p><a className="hub-link" href="/street-editor">사진 편집 시작 <ArrowRight size={16}/></a></section>
    </div>
    <section className="hub-tools"><h2>작업 백업·복원</h2><p>점포 목록과 사진까지 포함된 JSON 파일로 내보내거나 다른 주소의 브라우저에서 복원할 수 있어요. 새로 연결한 <code>editor.itda.link</code>로 작업물을 옮길 때 사용하세요. 파일 크기는 사진 용량에 따라 커질 수 있습니다.</p><div className="hub-actions"><button type="button" onClick={()=>void backup()} disabled={busy}><Download size={16}/> 사진 포함 전체 백업</button><label><FileUp size={16}/> 전체 백업 가져오기<input ref={input} type="file" accept=".json,application/json" onChange={e=>void restore(e.target.files?.[0])} disabled={busy}/></label><button type="button" onClick={refresh}><CheckCircle2 size={16}/> 현황 새로고침</button></div><p className="hub-feedback" role="status">{notice}</p></section>
    <div className="hub-warning"><ShieldAlert size={16} style={{verticalAlign:"middle",marginRight:6}}/> <strong>공개 서비스 보안 주의:</strong> 현재 편집기에는 서버 인증이 없습니다. <code>editor.itda.link</code> 주소를 분리하는 것만으로 접근 제한은 되지 않습니다. 운영 전 Vercel 배포 보호 또는 서버 인증을 추가하세요.</div>
    <div className="hub-warning"><Info size={16} style={{verticalAlign:"middle",marginRight:6}}/> <strong>공개 반영 주의:</strong> 점포·지도·촬영 지점·외곽선은 Supabase 설정 후 점포 관리의 전체 게시 버튼으로 공개할 수 있습니다. 사진·지도 배경 이미지 업로드는 여전히 로컬 전용입니다. 동일 브라우저 초안 확인은 <a href={sameOriginPreview()}>편집 주소 미리보기</a>를 사용하세요. {currentSurface()==="legacy"?"현재 테스트 주소에서는 기존 경로도 계속 사용할 수 있어요.":""}</div>
  </div></div>;
}
