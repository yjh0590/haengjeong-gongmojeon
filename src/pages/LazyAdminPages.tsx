import { lazy, Suspense } from "react";

// Admin-only pages load as their own chunks so the public pages download less.
// StreetEditor stays in the main bundle: its stylesheet also sets global rules (body, :root, *).
const DevLogPage = lazy(() => import("./DevLog"));
const MapEditorPage = lazy(() => import("./MapEditor"));

export function LazyDevLog() {
  return <Suspense fallback={null}><DevLogPage /></Suspense>;
}
export function LazyMapEditor() {
  return <Suspense fallback={null}><MapEditorPage /></Suspense>;
}
