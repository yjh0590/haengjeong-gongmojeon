import { StrictMode } from "react";
import type { ReactNode } from "react";
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
import PasswordSetup from "./pages/PasswordSetup.tsx";
import AdminGate from "./auth/AdminGate.tsx";
import PromotionReview from "./pages/PromotionReview.tsx";
import "./styles/IncheonBrand.css";

/** Each subdomain uses the same build but opens its own role. Legacy Vercel paths still work. */
function protect(page: ReactNode) { return <AdminGate>{page}</AdminGate>; }

function resolvePage() {
  const path = window.location.pathname.replace(/\/+$/, "") || "/";
  // Prioritize the email callback over domain-specific pages: Dashboard emails
  // may redirect to the Site URL root with tokens in the URL fragment.
  const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
  if (path === "/reset-password" || (hash.has("access_token") && ["recovery", "invite"].includes(hash.get("type") || ""))) return <PasswordSetup />;
  const surface = currentSurface();
  if (path === "/preview/customer" && (surface === "editor" || surface === "legacy")) return protect(<Customer />);
  if (path === "/preview/customer" && surface === "owner") return <Customer />;
  if (surface === "customer") return <Customer />;
  if (surface === "owner") return <Owner />;
  if (surface === "editor") {
    if (path === "/map-editor") return protect(<MapEditor />);
    if (path === "/street-editor") return protect(<StreetEditor />);
    if (path === "/catalog") return protect(<CatalogEditor />);
    if (path === "/promotions") return protect(<PromotionReview />);
    return protect(<EditorDashboard />);
  }
  if (surface === "landing") {
    if (path === "/customer") return <Customer />;
    return <Landing />;
  }
  if (path === "/owner") return <Owner />;
  if (path === "/map-editor") return protect(<MapEditor />);
  if (path === "/street-editor") return protect(<StreetEditor />);
  if (path === "/editor") return protect(<EditorDashboard />);
  if (path === "/catalog") return protect(<CatalogEditor />);
  if (path === "/promotions") return protect(<PromotionReview />);
  if (path === "/welcome") return <Landing />;
  return <Customer />;
}

createRoot(document.getElementById("root")!).render(<StrictMode>{resolvePage()}</StrictMode>);
