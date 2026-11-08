import { useEffect, useMemo, useState } from "react";
import { CalendarDays, CheckCircle2, GitCommitHorizontal, Lightbulb, ListTodo, Milestone } from "lucide-react";
import EditorShell from "../components/EditorShell";
import { devAreas, devLogAsOf, devNextSteps, devPhases, devVersions, repositoryUrl, type DevArea } from "../data/devLog";
import "../styles/DevLog.css";

const weekdays = ["일", "월", "화", "수", "목", "금", "토"];
function dayLabel(date: string) {
  const [year, month, day] = date.split("-").map(Number);
  return `${month}월 ${day}일 (${weekdays[new Date(year, month - 1, day).getDay()]})`;
}

export default function DevLog() {
  const [area, setArea] = useState<DevArea | "전체">("전체");
  useEffect(() => { document.title = "맛&멋 AI Street | 개발일지"; }, []);

  const days = devPhases.flatMap(phase => phase.days);
  const commitCount = new Set(days.flatMap(day => day.commits || [])).size;
  const itemCount = days.reduce((sum, day) => sum + day.items.length, 0);
  const counts = useMemo(() => {
    const result = new Map<DevArea, number>();
    for (const day of devPhases.flatMap(phase => phase.days)) for (const item of day.items) result.set(item.area, (result.get(item.area) || 0) + 1);
    return result;
  }, []);
  const phases = devPhases.map(phase => ({ ...phase, days: phase.days
    .map(day => ({ ...day, items: area === "전체" ? day.items : day.items.filter(item => item.area === area) }))
    .filter(day => day.items.length) })).filter(phase => phase.days.length);

  return <EditorShell title="개발일지" active="devlog">
    <section className="devlog-hero">
      {/* guide-widget-v7 is used nowhere else; history-* already belongs to the owner account page. */}
      <img className="devlog-hero-art" src="/brand/characters/guide-widget-v7.webp" alt="" width="360" height="360" aria-hidden="true" />
      <div className="devlog-hero-copy">
        <p>ITDA DEVELOPMENT LOG</p>
        <h2>맛&amp;멋 AI Street를 만든 기록</h2>
        <span>첫 프로토타입부터 오늘까지, 날짜별로 무엇을 만들고 왜 그렇게 정했는지 정리했어요.</span>
        <dl>
          <div><dt>기간</dt><dd>10.08 – {devLogAsOf.slice(5).replace("-", ".")}</dd></div>
          <div><dt>작업한 날</dt><dd>{days.length}일</dd></div>
          <div><dt>기록한 커밋</dt><dd>{commitCount}개</dd></div>
          <div><dt>작업 항목</dt><dd>{itemCount}개</dd></div>
        </dl>
      </div>
    </section>

    <section className="editor-panel devlog-filter" aria-label="분야별 보기">
      <div className="editor-panel-heading"><h2>분야별 보기</h2><span>{devLogAsOf} 기준 · git 이력과 버전 문서 정리</span></div>
      <div className="devlog-chips">
        <button type="button" aria-pressed={area === "전체"} onClick={() => setArea("전체")}>전체 <b>{itemCount}</b></button>
        {devAreas.filter(name => counts.get(name)).map(name => <button key={name} type="button" data-area={name} aria-pressed={area === name} onClick={() => setArea(name)}>{name} <b>{counts.get(name)}</b></button>)}
      </div>
    </section>

    <div className="devlog-timeline">
      {phases.map((phase, index) => <section key={phase.id} className="devlog-phase" aria-labelledby={`devlog-${phase.id}`}>
        <header className="devlog-phase-head">
          <span className="devlog-phase-index">{String(index + 1).padStart(2, "0")}</span>
          <div><h2 id={`devlog-${phase.id}`}>{phase.name}</h2><p><CalendarDays size={14} aria-hidden="true" />{phase.period} · {phase.goal}</p></div>
        </header>
        {phase.days.map(day => <article key={day.date} className="devlog-day">
          <div className="devlog-day-date"><time dateTime={day.date}>{dayLabel(day.date)}</time></div>
          <div className="devlog-day-body">
            <h3>{day.title}</h3>
            <p className="devlog-day-summary">{day.summary}</p>
            <ul className="devlog-items">{day.items.map(item => <li key={item.text}><span className="devlog-tag" data-area={item.area}>{item.area}</span><span>{item.text}</span></li>)}</ul>
            {area === "전체" && day.notes && <div className="devlog-notes"><strong><Lightbulb size={15} aria-hidden="true" />판단과 배운 점</strong><ul>{day.notes.map(note => <li key={note}>{note}</li>)}</ul></div>}
            {day.commits && <details className="devlog-commits"><summary><GitCommitHorizontal size={15} aria-hidden="true" />커밋 {day.commits.length}개</summary><p>{day.commits.map(hash => <a key={hash} href={`${repositoryUrl}/commit/${hash}`} target="_blank" rel="noreferrer"><code>{hash}</code></a>)}</p></details>}
          </div>
        </article>)}
      </section>)}
    </div>

    <div className="devlog-bottom">
      <section className="editor-panel"><div className="editor-panel-heading"><h2><Milestone size={19} aria-hidden="true" /> 버전 흐름</h2><span>docs/의 버전 문서 기준</span></div>
        <ol className="devlog-versions">{devVersions.map(item => <li key={item.version} className={item.applied === false ? "is-skipped" : undefined}><b>{item.version}</b><small>{item.date}</small><span>{item.text}</span></li>)}</ol>
      </section>
      <section className="editor-panel"><div className="editor-panel-heading"><h2><ListTodo size={19} aria-hidden="true" /> 남은 과제</h2><span>아직 구현하지 않은 것</span></div>
        <ul className="devlog-next">{devNextSteps.map(item => <li key={item.title}><CheckCircle2 size={17} aria-hidden="true" /><span><strong>{item.title}</strong>{item.detail}</span></li>)}</ul>
      </section>
    </div>
  </EditorShell>;
}
