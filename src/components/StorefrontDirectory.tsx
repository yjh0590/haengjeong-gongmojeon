import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowUpRight, Camera, ChevronLeft, ChevronRight, MapPin, Search, Store, X, ZoomIn } from 'lucide-react';
import catalog from '../data/storefrontCatalog.json';
import '../styles/StorefrontDirectory.css';

type Entry = typeof catalog.records[number];
const PAGE_SIZE = 18;
function floorLabel(floor: number | null) {
  return floor === null ? '층 미확인' : floor < 0 ? `지하 ${Math.abs(floor)}층` : `${floor}층`;
}
function EntryPhoto({ entry }: { entry: Entry }) {
  const [failed, setFailed] = useState(false);
  if (!entry.photo || failed) return <div className="sign-photo-missing"><Store size={30}/><span>{failed ? '사진을 불러오지 못했어요' : '간판 사진 확인 전'}</span></div>;
  return <img src={entry.photo.path} alt={`${entry.name} 간판과 입구`} width={entry.photo.width} height={entry.photo.height} loading="lazy" onError={() => setFailed(true)}/>;
}

export default function StorefrontDirectory() {
  const [query, setQuery] = useState('');
  const [floor, setFloor] = useState('전체');
  const [building, setBuilding] = useState('전체');
  const [allRecords, setAllRecords] = useState(false);
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState<Entry | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const rows = useMemo(() => catalog.records.filter(entry => {
    if (!allRecords && !entry.photo) return false;
    if (building !== '전체' && entry.building !== building) return false;
    if (floor === '그 외' ? [1, 2, 3].includes(entry.floor ?? 0) : floor !== '전체' && entry.floor !== Number(floor)) return false;
    return [entry.name, entry.category, entry.location].join(' ').toLocaleLowerCase().includes(query.trim().toLocaleLowerCase());
  }).sort((a, b) => (a.floor ?? 99) - (b.floor ?? 99) || a.building.localeCompare(b.building, 'ko') || a.rooms.localeCompare(b.rooms, 'ko', {numeric:true}) || a.name.localeCompare(b.name, 'ko')), [query, floor, building, allRecords]);
  const pages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const currentPage = Math.min(page, pages - 1);
  const visible = rows.slice(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE);
  useEffect(() => {
    const dialog = dialogRef.current;
    if (selected && dialog && !dialog.open) dialog.showModal();
  }, [selected]);
  const reset = () => { setQuery(''); setFloor('전체'); setBuilding('전체'); setPage(0); };
  const changePage = (next: number) => { setPage(next); resultsRef.current?.scrollIntoView({behavior:'instant',block:'start'}); };

  return <section className="sign-directory" aria-labelledby="sign-directory-title">
    <header className="sign-heading"><div><span className="sign-eyebrow">송도 타임스페이스 · 하모니로 158</span><h1 id="sign-directory-title">간판으로 찾는 우리 동네</h1><p>가게 앞 모습을 먼저 보고, 층과 동을 확인해 보세요.</p></div><div className="sign-photo-count"><Camera size={22}/><strong>{catalog.records.filter(entry => entry.photo).length}</strong><span>사진 연결 매장</span></div></header>
    <div className="sign-toolbar">
      <label className="sign-search"><Search size={20}/><input aria-label="간판 가게 검색" placeholder="가게명·업종·호수 검색" value={query} onChange={event => {setQuery(event.target.value);setPage(0);}}/>{query && <button type="button" aria-label="간판 검색어 지우기" onClick={() => {setQuery('');setPage(0);}}><X size={17}/></button>}</label>
      <div className="sign-filters"><div role="group" aria-label="간판 층 선택">{['전체','1','2','3','그 외'].map(value => <button type="button" key={value} aria-pressed={floor===value} onClick={() => {setFloor(value);setPage(0);}}>{value==='전체'?'전체 층':value==='그 외'?'그 외 층':`${value}층`}</button>)}</div><label>건물<select aria-label="간판 건물 선택" value={building} onChange={event => {setBuilding(event.target.value);setPage(0);}}>{['전체','A','B','C','D','미확인'].map(value => <option key={value} value={value}>{value==='전체'?'전체 동':value==='미확인'?'동 미확인':`${value}동`}</option>)}</select></label></div>
      <label className="sign-record-toggle"><input type="checkbox" checked={allRecords} onChange={event => {setAllRecords(event.target.checked);setPage(0);}}/> 사진 없는 수집 기록도 보기</label>
    </div>
    <div className="sign-result-heading" ref={resultsRef}><p role="status"><strong>{rows.length}</strong>{allRecords ? '개 출처별 기록 · 중복 포함' : '개 사진 카드'}<span>층 → 동 → 호수 순</span></p><button type="button" onClick={reset}>조건 초기화</button></div>
    <p className="sign-data-note">{catalog.collectedOn} 수집 자료입니다. 현재 영업 여부와 외관은 달라질 수 있습니다. {allRecords ? '전체 387건은 출처별 기록이며 가게 수가 아닙니다. ' : ''}실제 거리의 좌우 순서는 아직 확인되지 않았습니다.</p>
    <div className="sign-grid">{visible.map(entry => <article className="sign-card" key={entry.id}>
      <button type="button" className="sign-photo" onClick={() => setSelected(entry)} aria-label={`${entry.name} 사진과 정보 크게 보기`}><EntryPhoto entry={entry}/><span className="sign-floor-tag">{entry.building==='미확인'?'동 미확인':`${entry.building}동`} · {floorLabel(entry.floor)}</span>{entry.photo && <span className="sign-zoom"><ZoomIn size={16}/> 크게 보기</span>}</button>
      <div className="sign-card-body"><span className="sign-category">{entry.category==='미확인'?'업종 확인 전':entry.category}</span><button type="button" className="sign-card-title" onClick={() => setSelected(entry)}>{entry.name}</button><p className="sign-location"><MapPin size={15}/>{entry.rooms && entry.rooms!=='미기재' ? `${entry.rooms}호` : '호수 확인 전'}</p><p className="sign-location-basis">{entry.basis}</p><div className="sign-card-footer"><span>{entry.photo ? entry.photo.sourceUrl ? '인터넷 외관 사진' : '직접 촬영 사진' : '사진 미확보'}</span><a href={entry.photo?.sourceUrl || entry.source.url} target="_blank" rel="noopener noreferrer">출처 <ArrowUpRight size={14}/></a></div></div>
    </article>)}</div>
    {!rows.length && <div className="sign-empty"><Search size={28}/><h2>조건에 맞는 {allRecords ? '기록이' : '사진이'} 없어요</h2><p>{allRecords ? '검색어나 층·동을 바꿔 보세요.' : '사진 없는 수집 기록을 포함하거나 다른 층을 선택해 보세요.'}</p><button type="button" onClick={reset}>전체 층 보기</button></div>}
    {pages>1 && <nav className="sign-pagination" aria-label="간판 목록 페이지"><button type="button" disabled={currentPage===0} onClick={()=>changePage(currentPage-1)}><ChevronLeft size={18}/> 이전</button><span>{currentPage+1} / {pages}</span><button type="button" disabled={currentPage>=pages-1} onClick={()=>changePage(currentPage+1)}>다음 <ChevronRight size={18}/></button></nav>}
    <dialog aria-label={selected ? `${selected.name} 간판과 정보` : "간판 상세"} className="sign-dialog" ref={dialogRef} onClose={() => setSelected(null)} onClick={event => {if(event.target===event.currentTarget){const r=event.currentTarget.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)event.currentTarget.close();}}}>
      {selected && <><button type="button" autoFocus className="sign-dialog-close" aria-label="간판 상세 닫기" onClick={()=>dialogRef.current?.close()}><X size={22}/></button><div className="sign-dialog-image"><EntryPhoto key={selected.id} entry={selected}/></div><div className="sign-dialog-body"><span className="sign-category">{selected.category}</span><h2>{selected.name}</h2><p><MapPin size={16}/> 인천 연수구 하모니로 158</p><p>{selected.location}</p><p className="sign-data-note">위치 근거: {selected.basis}</p>{selected.photo && <p>{selected.photo.note}</p>}{selected.notes.map((note,index)=><p className="sign-data-note" key={index}>{note}</p>)}<div className="sign-detail-sources">{selected.photo && <span>사진: {selected.photo.credit}</span>}{selected.photo?.sourceUrl && <a href={selected.photo.sourceUrl} target="_blank" rel="noopener noreferrer">사진 게시 페이지 <ArrowUpRight size={15}/></a>}<a href={selected.source.url} target="_blank" rel="noopener noreferrer">정보 출처 확인 <ArrowUpRight size={15}/></a></div><small>사진의 촬영 시점과 현재 외관이 다를 수 있습니다. 메뉴·가격·영업시간은 방문 전 매장에 확인해 주세요.</small></div></>}
    </dialog>
  </section>;
}
