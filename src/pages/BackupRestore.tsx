import { useEffect, useRef, useState } from "react";
import { CheckCircle2, Download, FileUp } from "lucide-react";
import EditorShell from "../components/EditorShell";
import { readMapGeometry } from "../data/mapGeometry";
import { getFacadeAnnotations } from "../data/facadeAnnotations";
import { listDraftPhotos } from "../data/localStreetPhotos";
import { readStreetNodes } from "../data/streetNetwork";
import { downloadEditorBackup, importEditorBackup } from "../data/editorBackup";
import { useStoreDraft } from "../data/storeDraft";
import { useMediaDraft } from "../data/mediaStorage";

/** Browser drafts (stores, map, photo points, temporary images) and their JSON backup. Separate from the server publication. */
export default function BackupRestore() {
  const drafts = useStoreDraft();
  const media = useMediaDraft();
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("점포와 지도·거리 사진 초안은 이 브라우저에 저장됩니다. 서버 게시본과는 별개입니다.");
  const [photoCount, setPhotoCount] = useState<number | null>(null);
  const [metrics, setMetrics] = useState(() => ({ nodes: readStreetNodes().length, facades: getFacadeAnnotations().length, boundary: readMapGeometry().boundary.length }));
  const refresh = () => {
    setMetrics({ nodes: readStreetNodes().length, facades: getFacadeAnnotations().length, boundary: readMapGeometry().boundary.length });
    void listDraftPhotos().then(photos => setPhotoCount(photos.length)).catch(() => setPhotoCount(0));
  };
  useEffect(() => {
    document.title = "맛&멋 AI Street | 백업·복원";
    let active = true;
    void listDraftPhotos().then(photos => { if (active) setPhotoCount(photos.length); }).catch(() => { if (active) setPhotoCount(0); });
    return () => { active = false; };
  }, []);
  const backup = async () => {
    setBusy(true);
    try { const count = await downloadEditorBackup(); setNotice(`점포·지도·외곽선·촬영 지점과 이미지 ${count}개를 포함한 백업을 다운로드했습니다.`); }
    catch (error) { setNotice(error instanceof Error ? error.message : "백업을 만들지 못했습니다."); }
    finally { setBusy(false); }
  };
  const restore = async (file?: File) => {
    if (!file || !window.confirm("현재 브라우저의 지도·사진·초안 정보를 백업 파일로 덮어쓸까요? 기존 초안을 먼저 백업해 주세요.")) return;
    setBusy(true);
    try { const count = await importEditorBackup(file); setNotice(`백업을 복원했습니다. 이미지 ${count}개를 포함한 설정이 이 브라우저에 저장됐습니다.`); refresh(); }
    catch (error) { setNotice(error instanceof Error ? error.message : "백업을 복원하지 못했습니다."); }
    finally { setBusy(false); if (input.current) input.current.value = ""; }
  };
  const waiting = Object.keys(media.photos).length + (media.map ? 1 : 0);
  return <EditorShell title="백업·복원" active="backup">
    <section className="editor-dashboard-metrics" aria-label="브라우저 초안 현황">
      <article className="editor-dashboard-metric"><p>초안 점포</p><strong>{drafts.length}</strong><small>이 브라우저의 점포 초안</small></article>
      <article className="editor-dashboard-metric"><p>촬영 지점 초안</p><strong>{metrics.nodes}</strong><small>외곽선 {metrics.facades}개 · 경계점 {metrics.boundary}개</small></article>
      <article className="editor-dashboard-metric"><p>임시 이미지</p><strong>{photoCount ?? "…"}</strong><small>현재 브라우저에 저장</small></article>
      <article className="editor-dashboard-metric"><p>게시 대기 이미지</p><strong>{waiting}</strong><small>서버에 올렸고 전체 게시 전</small></article>
    </section>
    <section className="editor-panel"><div className="editor-panel-heading"><h2>작업 백업·복원</h2></div>
      <p>점포와 지도·거리 사진을 JSON 파일로 내보내거나 다른 브라우저로 옮길 수 있습니다. 브라우저 초안은 서버 백업과 별개입니다.</p>
      <div className="editor-dashboard-tools"><button className="editor-button" type="button" disabled={busy} onClick={() => void backup()}><Download size={16}/> 사진 포함 전체 백업</button><label><FileUp size={16}/> 백업 가져오기<input ref={input} type="file" accept=".json,application/json" disabled={busy} onChange={event => void restore(event.target.files?.[0])}/></label><button className="editor-button" type="button" onClick={refresh}><CheckCircle2 size={16}/> 현황 새로고침</button></div>
      <p className="editor-notice" role="status">{notice}</p>
    </section>
  </EditorShell>;
}
