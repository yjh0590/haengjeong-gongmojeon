import { useEffect, useRef, useState, type MouseEvent, type RefObject, type ReactNode } from "react";
import { ArrowLeft, ArrowRight, BookOpen, Check, LayoutGrid, MapPinned, ShieldCheck, Store, X } from "lucide-react";
import { appUrl } from "../config/site";
import { guidebooks, type GuidebookId } from "../data/guidebooks";
import "../styles/GuideLibrary.css";
import GuidePicture from "./GuidePicture";

const coverIcons = { customer: MapPinned, owner: Store, admin: ShieldCheck, characters: BookOpen };

export default function GuideLibrary({ triggerRef, children }: { triggerRef: RefObject<HTMLButtonElement | null>; children?: ReactNode }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const opener = useRef<HTMLElement | null>(null);
  const reader = useRef<HTMLDivElement>(null);
  const [selected, setSelected] = useState<GuidebookId | null>(null);
  const [pageIndex, setPageIndex] = useState(0);
  const book = guidebooks.find(item => item.id === selected);
  const page = book?.pages[pageIndex];

  useEffect(() => {
    if (reader.current) reader.current.scrollTop = 0;
    if (dialog.current?.open) {
      const target = selected ? reader.current : dialog.current.querySelector<HTMLButtonElement>(".guide-dialog-close");
      target?.focus({ preventScroll: true });
    }
  }, [selected, pageIndex]);

  function open(event: MouseEvent<HTMLButtonElement>, id: GuidebookId | null = null) {
    opener.current = event.currentTarget;
    setSelected(id); setPageIndex(0);
    if (!dialog.current?.open) dialog.current?.showModal();
  }
  function select(id: GuidebookId | null) { setSelected(id); setPageIndex(0); }

  return <>
    <button ref={triggerRef} id="guide" className="guide-floating-widget" type="button" onClick={event => open(event)} aria-haspopup="dialog" aria-controls="itda-guide-dialog" aria-label="홈페이지 사용 안내서 열기">
      <span className="guide-widget-cover"><BookOpen size={15} aria-hidden="true"/><strong>홈페이지<br/>사용법</strong><img src="/brand/characters/guide-widget-v7.webp" alt="" width="110" height="100"/><small>사용 안내서 펼치기 →</small></span>
    </button>

    <dialog ref={dialog} id="itda-guide-dialog" className="guide-dialog" aria-labelledby="guide-dialog-title" aria-describedby="guide-dialog-description"
      onClose={() => window.requestAnimationFrame(() => opener.current?.focus())}
      onKeyDown={event => {
        if (event.key !== "Tab") return;
        const controls = Array.from(event.currentTarget.querySelectorAll<HTMLElement>('button:not([disabled]), a[href], [tabindex="0"]'))
          .filter(element => element.getClientRects().length > 0);
        const first = controls[0], last = controls[controls.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
      }}
      onClick={event => {
        if (event.target !== event.currentTarget) return;
        const rect = event.currentTarget.getBoundingClientRect();
        if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) event.currentTarget.close();
      }}>
      <header className="guide-dialog-header"><div><p>ITDA · 홈페이지 사용법</p><h2 id="guide-dialog-title">{book ? `${book.label} 안내서` : "홈페이지 사용 안내서"}</h2></div><button type="button" className="guide-dialog-close" aria-label="안내서 닫기" onClick={() => dialog.current?.close()}><X size={22}/></button></header>
      <p id="guide-dialog-description" className="guide-sr-only">목차에서 안내서를 선택한 뒤 이전·다음 페이지 버튼으로 읽을 수 있습니다. Escape 키로 닫을 수 있습니다.</p>
      {book && page ? <div className="guide-reader-layout">
        <nav className="guide-reader-nav" aria-label="가이드북 선택"><button type="button" onClick={() => select(null)}><LayoutGrid size={16} aria-hidden="true"/>전체 목차</button>{guidebooks.map(item => <button key={item.id} type="button" aria-current={selected === item.id ? "page" : undefined} onClick={() => select(item.id)}>{(() => { const Icon = coverIcons[item.id]; return <Icon size={22} aria-hidden="true"/>; })()}{item.label}</button>)}</nav>
        <div className="guide-reader-main">
          <div className="guide-reader-content" ref={reader} key={book.id} tabIndex={-1} aria-label={`${book.label} 안내서 본문`}>
            <article className={`guide-reader-page guide-page-${book.id}`}>
              {page.image && <div className="guide-page-art"><img src={page.image} alt={page.imageAlt || ""} width="600" height="400"/></div>}
              <div className="guide-page-copy"><p className="guide-page-number" aria-live="polite">{book.label} · {pageIndex + 1} / {book.pages.length}</p><h3>{page.title}</h3><p className="guide-page-lead">{page.lead}</p>
                <ol className="guide-picture-steps">{page.steps.map((step, index) => <li key={step.title}><GuidePicture picture={step.picture}/><span className="guide-picture-number">{index + 1}</span><strong>{step.title}</strong><p>{step.caption}</p></li>)}</ol>
                {page.note && <p className="guide-page-note"><Check size={17} aria-hidden="true"/>{page.note}</p>}
              </div>
            </article>
          </div>
          <footer className="guide-page-controls"><button type="button" disabled={pageIndex === 0} onClick={() => setPageIndex(index => index - 1)}><ArrowLeft size={17} aria-hidden="true"/>이전</button><span>{pageIndex + 1} / {book.pages.length}</span>{pageIndex < book.pages.length - 1 ? <button type="button" onClick={() => setPageIndex(index => index + 1)}>다음<ArrowRight size={17} aria-hidden="true"/></button> : book.action ? <a href={appUrl(book.action.surface)}>{book.action.label}<ArrowRight size={17} aria-hidden="true"/></a> : <button type="button" onClick={() => select(null)}>목차로<LayoutGrid size={16} aria-hidden="true"/></button>}</footer>
        </div>
      </div> : <div className="guide-dialog-library"><div className="guide-dialog-welcome"><BookOpen size={42} aria-hidden="true"/><div><h3>어떤 화면을 사용하시나요?</h3><p>화면별 사용법을 그림으로 확인하세요.</p></div></div><div className="guide-dialog-book-grid">{guidebooks.map(item => <button key={item.id} type="button" className={`guide-dialog-book guide-cover-${item.id}`} onClick={() => select(item.id)}><span className="guide-book-symbol">{(() => { const Icon = coverIcons[item.id]; return <Icon size={46} strokeWidth={1.4} aria-hidden="true"/>; })()}</span><span className="guide-cover-top"><BookOpen size={16} aria-hidden="true"/>{item.label}</span><span className="guide-book-title">{item.subtitle}</span><span className="guide-book-description">{item.description}</span><span className="guide-book-open">책 펼치기<ArrowRight size={16} aria-hidden="true"/></span></button>)}</div>{children}</div>}
    </dialog>
  </>;
}
