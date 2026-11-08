import { lazy, Suspense } from "react";

// Only admins open the development log, so it loads as its own chunk.
const DevLog = lazy(() => import("./DevLog"));

export default function LazyDevLog() {
  return <Suspense fallback={null}><DevLog /></Suspense>;
}
