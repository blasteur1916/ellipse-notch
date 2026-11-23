import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import "./styles.css";

// Pas de menu contextuel WebView : l'app doit se comporter comme un élément système.
document.addEventListener("contextmenu", (e) => e.preventDefault());

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
