import React from "react";
import ReactDOM from "react-dom/client";
import "@fontsource-variable/inter";
import "@fontsource-variable/urbanist";
import App from "./App";
import type { Lang } from "./i18n";
import "./styles.css";

const root = document.getElementById("root") as HTMLElement;
// Each language has its own page: the site's root in French, /en/ in English.
const lang: Lang = document.documentElement.lang === "en" || /\/en\/$/.test(location.pathname) ? "en" : "fr";
const app = (
  <React.StrictMode>
    <App lang={lang} />
  </React.StrictMode>
);

// The built page arrives already rendered (scripts/prerender.mjs): take it over.
if (root.hasChildNodes()) ReactDOM.hydrateRoot(root, app);
else ReactDOM.createRoot(root).render(app);
