import { useEffect, useState, type ReactNode } from "react";
import { fetchPublication, publicationConfigured } from "../data/sitePublication";
import { applyPublicationToDrafts, hasEditorDrafts } from "../data/editorDrafts";

/**
 * A browser that has never edited (a fresh laptop, the presentation machine) would otherwise open the
 * editors on the built-in sample stores, and a full publish from there would replace the real catalog.
 * Before the admin page mounts, such a browser copies the server publication into its drafts.
 * Browsers that already hold drafts are left untouched.
 */
export default function EditorDraftSeed({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(() => !publicationConfigured || hasEditorDrafts());
  useEffect(() => {
    if (ready) return;
    let active = true;
    fetchPublication()
      .then(published => { if (published && !hasEditorDrafts()) applyPublicationToDrafts(published.data); })
      .catch(() => { /* Server unreachable: the editors fall back to their built-in samples as before. */ })
      .finally(() => { if (active) setReady(true); });
    return () => { active = false; };
  }, [ready]);
  if (!ready) return <main className="itda-auth-page"><p className="itda-auth-status" role="status">서버 게시본을 불러오는 중…</p></main>;
  return <>{children}</>;
}
