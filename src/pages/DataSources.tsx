import { useEffect } from "react";
import EditorShell from "../components/EditorShell";
import { usePublicSite } from "../data/sitePublication";
import { dataSources, researchFolders } from "../data/dataSources";

/** Where the customer site's information comes from (src/data/dataSources.ts). Admin only; customer screens do not show it. */
export default function DataSources() {
  const publication = usePublicSite();
  useEffect(() => { document.title = "맛&멋 AI Street | 정보 출처"; }, []);
  return <EditorShell title="정보 출처" active="sources">
    <section className="editor-panel editor-sources"><div className="editor-panel-heading"><h2>손님 화면 정보의 출처</h2><span>{publication.data && publication.publishedAt ? `${new Date(publication.publishedAt).toLocaleDateString("ko-KR")} 게시본` : "기본 자료"} · 손님 화면에는 표시하지 않아요</span></div>
      <ul className="editor-source-list">
        {dataSources.map(item => <li key={item.topic}>
          <div className="editor-source-head"><strong>{item.topic}</strong><small>{item.asOf}</small></div>
          <p>{item.detail}</p>
          {item.links && <p className="editor-source-links">{item.links.map(link => <a key={link.url} href={link.url} target="_blank" rel="noreferrer">{link.label}</a>)}</p>}
        </li>)}
      </ul>
      <p className="editor-source-folders">원자료: {researchFolders.join(" · ")}</p>
    </section>
  </EditorShell>;
}
