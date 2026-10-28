import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import Customer from "./pages/Customer.tsx";
import Owner from "./pages/Owner.tsx";
import StreetEditor from "./pages/StreetEditor.tsx";

const path = window.location.pathname;
const page = path.startsWith("/owner") ? <Owner /> : path.startsWith("/street-editor") ? <StreetEditor /> : <Customer />;

createRoot(document.getElementById("root")!).render(<StrictMode>{page}</StrictMode>);
