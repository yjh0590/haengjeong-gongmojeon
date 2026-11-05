import { useEffect, useRef, useState, type MouseEvent } from "react";
import { ArrowLeft, ArrowRight, BookOpen, Check, LayoutGrid, X } from "lucide-react";
import { appUrl } from "../config/site";
import { guidebooks, type GuidebookId } from "../data/guidebooks";
import "../styles/GuideLibrary.css";

export default function GuideLibrary() {
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
    <section className="guide-library landing-content-section" id="guide" aria-labelledby="guide-library-title">
      <div className="guide-library-heading"><div><p className="landing-section-label">ITDA GUIDEBOOK</p><h2 id="guide-library-title">포물이·도송이와 함께 읽는 안내서</h2><p>손님용·점주용·관리자, 그리고 두 캐릭터의 이야기를 한 권씩 펼쳐보세요.</p></div><img src="/brand/characters/together-avatar-v3.webp" alt="" width="88" height="88" loading="lazy"/></div>
      <div className="guide-library-grid">{guidebooks.map(item => <button key={item.id} type="button" className={`guide-cover guide-cover-${item.id}`} onClick={event => open(event, item.id)} aria-haspopup="dialog" aria-controls="itda-guide-dialog">
        <span className="guide-cover-top"><BookOpen size={17} aria-hidden="true"/><span>{item.label}</span></span><img src={item.face} alt="" width="100" height="100" loading="lazy"/><strong>{item.subtitle}</strong><span className="guide-cover-description">{item.description}</span><span className="guide-cover-open">안내서 펼치기<ArrowRight size={17} aria-hidden="true"/></span>
      </button>)}</div>
      <p className="guide-library-purpose">점주의 소식이 손님의 발견으로, 한 번의 발견이 다음 방문으로 이어지는 동네를 만듭니다.</p>
    </section>

    <button className="guide-floating-widget" type="button" onClick={event => open(event)} aria-haspopup="dialog" aria-controls="itda-guide-dialog" aria-label="포물이와 도송이의 홈페이지 가이드북 열기">
      <img src="/brand/characters/together-avatar-v3.webp" alt="" width="52" height="52"/><span><small>처음 오셨나요?</small><strong>우리 동네 안내서</strong></span><BookOpen size={20} aria-hidden="true"/>
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
      <header className="guide-dialog-header"><div><p>포물이 · 도송이 GUIDEBOOK</p><h2 id="guide-dialog-title">{book ? `${book.label} 안내서` : "우리 동네 안내서"}</h2></div><button type="button" className="guide-dialog-close" aria-label="안내서 닫기" onClick={() => dialog.current?.close()}><X size={22}/></button></header>
      <p id="guide-dialog-description" className="guide-sr-only">목차에서 안내서를 선택한 뒤 이전·다음 페이지 버튼으로 읽을 수 있습니다. Escape 키로 닫을 수 있습니다.</p>
      {book && page ? <div className="guide-reader-layout">
        <nav className="guide-reader-nav" aria-label="가이드북 선택"><button type="button" onClick={() => select(null)}><LayoutGrid size={16} aria-hidden="true"/>전체 목차</button>{guidebooks.map(item => <button key={item.id} type="button" aria-current={selected === item.id ? "page" : undefined} onClick={() => select(item.id)}><img src={item.face} alt="" width="32" height="32"/>{item.label}</button>)}</nav>
        <div className="guide-reader-main">
          <div className="guide-reader-content" ref={reader} key={book.id} tabIndex={-1} aria-label={`${book.label} 안내서 본문`}>
            <article className={`guide-reader-page guide-page-${book.id}`}>
              <div className="guide-page-art"><img src={page.image} alt={page.imageAlt} width="600" height="320"/><span>{book.subtitle}</span></div>
              <div className="guide-page-copy"><p className="guide-page-number" aria-live="polite">{book.label} · {pageIndex + 1} / {book.pages.length}</p><h3>{page.title}</h3><p className="guide-page-lead">{page.lead}</p>{page.paragraphs.map(text => <p key={text}>{text}</p>)}
                {page.steps && <ol className="guide-page-steps">{page.steps.map((text, index) => <li key={text}><span aria-hidden="true">{index + 1}</span>{text}</li>)}</ol>}
                {page.note && <p className="guide-page-note"><Check size={17} aria-hidden="true"/>{page.note}</p>}
              </div>
            </article>
          </div>
          <footer className="guide-page-controls"><button type="button" disabled={pageIndex === 0} onClick={() => setPageIndex(index => index - 1)}><ArrowLeft size={17} aria-hidden="true"/>이전</button><span>{pageIndex + 1} / {book.pages.length}</span>{pageIndex < book.pages.length - 1 ? <button type="button" onClick={() => setPageIndex(index => index + 1)}>다음<ArrowRight size={17} aria-hidden="true"/></button> : book.action ? <a href={appUrl(book.action.surface)}>{book.action.label}<ArrowRight size={17} aria-hidden="true"/></a> : <button type="button" onClick={() => select(null)}>목차로<LayoutGrid size={16} aria-hidden="true"/></button>}</footer>
        </div>
      </div> : <div className="guide-dialog-library"><div className="guide-dialog-welcome"><img src="/brand/characters/together.png" alt="형 포물이와 동생 도송이" width="185" height="139"/><div><h3>어떤 이야기가 궁금하세요?</h3><p>가게와 사람을 잇는 서비스, 네 권의 안내서로 만나보세요.</p></div></div><div className="guide-dialog-book-grid">{guidebooks.map(item => <button key={item.id} type="button" className={`guide-dialog-book guide-cover-${item.id}`} onClick={() => select(item.id)}><img src={item.face} alt="" width="64" height="64"/><span><strong>{item.label}</strong><small>{item.description}</small></span><ArrowRight size={18} aria-hidden="true"/></button>)}</div></div>}
    </dialog>
  </>;
}
