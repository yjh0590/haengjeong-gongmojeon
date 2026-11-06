import { useCallback, useEffect, useState } from "react";

/** Changes page content without scrolling through the homepage. Keeps browser Back working. */
export function usePageTab<T extends string>(allowed: readonly T[], defaultTab: T) {
  const fromUrl = useCallback((): T => {
    const current = new URLSearchParams(window.location.search).get("view");
    return allowed.find(tab => tab === current) ?? defaultTab;
  }, [allowed, defaultTab]);
  const [tab, setTab] = useState<T>(fromUrl);
  useEffect(() => {
    const onBack = () => setTab(fromUrl());
    window.addEventListener("popstate", onBack);
    return () => window.removeEventListener("popstate", onBack);
  }, [fromUrl]);
  const openTab = useCallback((next: T) => {
    // Already on this tab: keep the scroll position (moving between street photos must not jump to the banner).
    if (next === fromUrl()) { setTab(next); return; }
    const url = new URL(window.location.href);
    if (next === defaultTab) url.searchParams.delete("view");
    else url.searchParams.set("view", next);
    if (url.href !== window.location.href) window.history.pushState({}, "", url);
    setTab(next);
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [defaultTab, fromUrl]);
  return { tab, openTab };
}
