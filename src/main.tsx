import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { currentSurface } from "./config/site";
import Landing from "./pages/Landing.tsx";
import EditorDashboard from "./pages/EditorDashboard.tsx";
import Customer from "./pages/Customer.tsx";
import Owner from "./pages/Owner.tsx";
import StreetEditor from "./pages/StreetEditor.tsx";
import MapEditor from "./pages/MapEditor.tsx";
import CatalogEditor from "./pages/CatalogEditor.tsx";

/** Each subdomain uses the same build but opens its own role. Legacy Vercel paths still work. */
function resolvePage() {
  const path = window.location.pathname.replace(/\/+$/, "") || "/";
  const surface = currentSurface();
  if (path === "/preview/customer" && (surface === "editor" || surface === "owner" || surface === "legacy")) return <Customer />;
  if (surface === "customer") return <Customer />;
  if (surface === "owner") return <Owner />;
  if (surface === "editor") {
    if (path === "/map-editor") return <MapEditor />;
    if (path === "/street-editor") return <StreetEditor />;
    if (path === "/catalog") return <CatalogEditor />;
    return <EditorDashboard />;
  }
  if (surface === "landing") {
    if (path === "/customer") return <Customer />;
    return <Landing />;
  }
  if (path === "/owner") return <Owner />;
  if (path === "/map-editor") return <MapEditor />;
  if (path === "/street-editor") return <StreetEditor />;
  if (path === "/editor") return <EditorDashboard />;
  if (path === "/catalog") return <CatalogEditor />;
  if (path === "/welcome") return <Landing />;
  return <Customer />;
}

createRoot(document.getElementById("root")!).render(<StrictMode>{resolvePage()}</StrictMode>);
