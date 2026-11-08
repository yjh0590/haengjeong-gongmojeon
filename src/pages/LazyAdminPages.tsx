import { lazy, Suspense } from "react";

// Admin-only pages load as their own chunks so the public pages download less.
// StreetEditor stays in the main bundle: its stylesheet also sets global rules (body, :root, *).
const DevLogPage = lazy(() => import("./DevLog"));
const MapEditorPage = lazy(() => import("./MapEditor"));
const DataSourcesPage = lazy(() => import("./DataSources"));
const BackupRestorePage = lazy(() => import("./BackupRestore"));

export function LazyDevLog() {
  return <Suspense fallback={null}><DevLogPage /></Suspense>;
}
export function LazyMapEditor() {
  return <Suspense fallback={null}><MapEditorPage /></Suspense>;
}
export function LazyDataSources() {
  return <Suspense fallback={null}><DataSourcesPage /></Suspense>;
}
export function LazyBackupRestore() {
  return <Suspense fallback={null}><BackupRestorePage /></Suspense>;
}
