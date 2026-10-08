import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import "./index.css";

import App from "./pages/Customer.tsx";
import Owner from "./pages/Owner.tsx";

const isOwnerPage =
  window.location.pathname.startsWith(
    "/owner"
  );

createRoot(
  document.getElementById("root")!
).render(
  <StrictMode>
    {isOwnerPage ? <Owner /> : <App />}
  </StrictMode>
);