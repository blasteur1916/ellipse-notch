// Writes the rendered page into dist/index.html (French) and dist/en/index.html
// (English), with their structured data, so search engines and link previews
// read them without running JavaScript.
//
// The site's address (SITE_URL overrides it, e.g. for a preview) gives the
// canonical links, og:url and og:image, sitemap.xml and its line in robots.txt.
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync, rmSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import { dirname, join } from "node:path";
import { guidePages, pathOf } from "./guide-pages.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dist = join(root, "dist");
const server = join(root, "dist-ssr", "entry-server.js");
const { render, faqs, REPO, DOWNLOAD, GUIDES, GUIDES_INDEX, GUIDE_CATEGORIES, FEATURED_GUIDES } = await import(pathToFileURL(server).href);

const site = (process.env.SITE_URL || "https://blasteur1916.github.io/ellipse-notch/").replace(/\/?$/, "/");
const version = JSON.parse(readFileSync(join(root, "..", "src-tauri", "tauri.conf.json"), "utf8")).version;

/** What changes from one language to the other in the page's head. */
const LANGS = {
  fr: {
    url: site,
    dir: dist,
    image: `${site}og-image.png`,
    locale: "fr_FR",
    title: "Ellipse (bêta) : le Notch pour Windows, gratuit et open source",
    description:
      "Ellipse ajoute un Notch en haut de l'écran de Windows : vos fichiers et vos téléchargements à portée de souris avec leur aperçu, secouer un fichier pour le ranger, minuteur d'auto-suppression, et transfert de photos avec l'iPhone ou l'Android sur le Wi-Fi. Gratuit et open source.",
    ogTitle: "Ellipse (bêta) : le Notch pour Windows",
    ogDescription: "Vos fichiers, vos téléchargements et votre téléphone au sommet de l'écran Windows. Gratuit et open source.",
    twitterDescription: "Vos fichiers, vos téléchargements et votre téléphone au sommet de l'écran Windows.",
    imageAlt: "Ellipse, le Notch pour Windows",
    features: [
      "Notch en haut de l'écran, qui s'ouvre au survol",
      "Stash : fichiers du moment et derniers téléchargements, avec aperçu",
      "Glisser-déposer des fichiers du Notch vers n'importe quelle application",
      "Secouer la souris pendant un glisser pour ranger un fichier",
      "Minuteur d'auto-suppression des téléchargements (Corbeille)",
      "Envoi de photos du téléphone au PC sur le Wi-Fi, sans appli",
      "Envoi de fichiers du PC au téléphone",
      "Lancement au démarrage de Windows",
    ],
  },
  en: {
    url: `${site}en/`,
    dir: join(dist, "en"),
    image: `${site}og-image-en.png`,
    locale: "en_GB",
    title: "Ellipse (beta): the Notch for Windows, free and open source",
    description:
      "Ellipse adds a Notch at the top of the Windows screen: your files and downloads within reach with their preview, shake a file to put it away, an auto-delete timer, and photo transfers with your iPhone or Android over Wi-Fi. Free and open source.",
    ogTitle: "Ellipse (beta): the Notch for Windows",
    ogDescription: "Your files, your downloads and your phone at the top of the Windows screen. Free and open source.",
    twitterDescription: "Your files, your downloads and your phone at the top of the Windows screen.",
    imageAlt: "Ellipse, the Notch for Windows",
    features: [
      "A Notch at the top of the screen that opens on hover",
      "Stash: the files you're working with and your latest downloads, with a preview",
      "Drag and drop files from the Notch into any app",
      "Shake the mouse while dragging to put a file away",
      "An auto-delete timer for downloads (Recycle Bin)",
      "Send photos from the phone to the PC over Wi-Fi, with no app",
      "Send files from the PC to the phone",
      "Launch at Windows startup",
    ],
  },
};

// "<" escaped so no text can close the script element.
const ld = (data) => `<script type="application/ld+json">${JSON.stringify(data).replace(/</g, "\\u003c")}</script>`;
// Quotes and ampersands, for text put in an attribute.
const attr = (text) => text.replace(/&/g, "&amp;").replace(/"/g, "&quot;");

// The two fonts the first screen uses, fetched with the page instead of after its CSS.
const fonts = readdirSync(join(dist, "assets")).filter((f) => /^(inter|urbanist)-latin-wght-normal-.*\.woff2$/.test(f));
if (fonts.length !== 2) throw new Error(`expected 2 fonts to preload, found ${fonts.length}`);

const template = readFileSync(join(dist, "index.html"), "utf8");
if (!template.includes('<div id="root"></div>')) throw new Error("dist/index.html: root element not found");

/** Replaces one element of the head, which must be there exactly once. */
function swap(html, pattern, by) {
  const found = html.match(new RegExp(pattern, "g"));
  if (found?.length !== 1) throw new Error(`index.html: expected one ${pattern}, found ${found?.length ?? 0}`);
  return html.replace(new RegExp(pattern), by);
}

const sizes = [];
for (const [lang, page] of Object.entries(LANGS)) {
  const image = existsSync(join(dist, page.image.slice(site.length))) ? page.image : LANGS.fr.image;

  const app = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Ellipse",
    alternateName: ["Ellipse Notch", "Ellipse pour Windows"],
    description: page.description,
    applicationCategory: "UtilitiesApplication",
    applicationSubCategory: "File manager",
    operatingSystem: "Windows 10, Windows 11",
    softwareVersion: `${version}-beta`,
    inLanguage: lang,
    isAccessibleForFree: true,
    license: "https://www.gnu.org/licenses/gpl-3.0.html",
    offers: { "@type": "Offer", price: "0", priceCurrency: "EUR" },
    downloadUrl: DOWNLOAD,
    sameAs: [REPO],
    featureList: page.features,
    url: page.url,
    image,
    screenshot: image,
  };
  const faq = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    inLanguage: lang,
    mainEntity: faqs(lang).map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
  };
  const website = { "@context": "https://schema.org", "@type": "WebSite", name: "Ellipse", url: page.url, inLanguage: lang };

  // The English page is one folder down: its relative links climb one level.
  const up = lang === "fr" ? "./" : "../";
  const head = [
    ...fonts.map((f) => `<link rel="preload" href="${up}assets/${f}" as="font" type="font/woff2" crossorigin />`),
    `<link rel="canonical" href="${page.url}" />`,
    `<link rel="alternate" hreflang="fr" href="${LANGS.fr.url}" />`,
    `<link rel="alternate" hreflang="en" href="${LANGS.en.url}" />`,
    `<link rel="alternate" hreflang="x-default" href="${LANGS.fr.url}" />`,
    `<meta property="og:url" content="${page.url}" />`,
    `<meta property="og:locale:alternate" content="${lang === "fr" ? LANGS.en.locale : LANGS.fr.locale}" />`,
    `<meta property="og:image" content="${image}" />`,
    `<meta name="twitter:image" content="${image}" />`,
    ld(app),
    ld(faq),
    ld(website),
  ].join("\n    ");

  let html = template;
  html = swap(html, '<html lang="[a-z]+">', `<html lang="${lang}">`);
  html = swap(html, "<title>[^<]*</title>", `<title>${page.title}</title>`);
  html = swap(html, '<meta name="description" content="[^"]*" />', `<meta name="description" content="${attr(page.description)}" />`);
  html = swap(html, '<meta property="og:locale" content="[^"]*" />', `<meta property="og:locale" content="${page.locale}" />`);
  html = swap(html, '<meta property="og:title" content="[^"]*" />', `<meta property="og:title" content="${attr(page.ogTitle)}" />`);
  html = swap(html, '<meta property="og:description" content="[^"]*" />', `<meta property="og:description" content="${attr(page.ogDescription)}" />`);
  html = swap(html, '<meta property="og:image:alt" content="[^"]*" />', `<meta property="og:image:alt" content="${attr(page.imageAlt)}" />`);
  html = swap(html, '<meta name="twitter:title" content="[^"]*" />', `<meta name="twitter:title" content="${attr(page.ogTitle)}" />`);
  html = swap(html, '<meta name="twitter:description" content="[^"]*" />', `<meta name="twitter:description" content="${attr(page.twitterDescription)}" />`);
  if (lang !== "fr") html = html.replace(/(href|src)="\.\//g, `$1="${up}`);
  html = html.replace('<div id="root"></div>', `<div id="root">${await render(lang)}</div>`).replace("</head>", `    ${head}\n  </head>`);

  mkdirSync(page.dir, { recursive: true });
  writeFileSync(join(page.dir, "index.html"), html);
  sizes.push(`${lang} ${Math.round(html.length / 1024)} kB`);
}

// Served on unknown paths by Vercel, GitHub Pages, Netlify…
writeFileSync(
  join(dist, "404.html"),
  `<!doctype html>
<html lang="fr">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="robots" content="noindex" />
    <title>Page introuvable · Ellipse</title>
    <link rel="icon" href="${site}favicon-48.png" type="image/png" />
    <style>
      body { margin: 0; min-height: 100vh; display: grid; place-items: center; background: #212121; color: #f3f3f3; font-family: "Segoe UI", system-ui, sans-serif; text-align: center; }
      a { display: inline-block; margin: 24px 6px 0; padding: 12px 22px; border-radius: 999px; background: #fff; color: #111; font-weight: 600; text-decoration: none; }
      p { color: #b4b4b8; }
    </style>
  </head>
  <body>
    <main>
      <h1>Page introuvable</h1>
      <p>Cette page n'existe pas, ou plus. <span lang="en">This page doesn't exist, or no longer does.</span></p>
      <a href="${site}">Revenir à Ellipse</a>
      <a href="${site}en/" lang="en">Back to Ellipse</a>
    </main>
  </body>
</html>
`,
);

/* ---------------------------------------------------------------- Guides */
// Static pages from src/guides.ts (see scripts/guide-pages.mjs).

const guides = guidePages({ GUIDES, GUIDES_INDEX, GUIDE_CATEGORIES, FEATURED_GUIDES, site, DOWNLOAD, REPO, englishImage: existsSync(join(dist, "og-image-en.png")) });
for (const { path, html } of guides) {
  mkdirSync(join(dist, path), { recursive: true });
  writeFileSync(join(dist, path, "index.html"), html);
}

const robots = ["User-agent: *", "Allow: /", "", `Sitemap: ${site}sitemap.xml`].join("\n") + "\n";
writeFileSync(join(dist, "robots.txt"), robots);

/* ---------------------------------------------------------------- sitemap.xml */
// Each page with the date it last changed, and its other language when it has one.
const today = new Date().toISOString().slice(0, 10);
const LEGAL_UPDATED = "2026-11-23";
const pairs = [
  { alternates: { fr: "", en: "en/" }, lastmod: today },
  { alternates: { fr: "mentions-legales/", en: "en/legal-notice/" }, lastmod: LEGAL_UPDATED },
  { alternates: { fr: "conditions-utilisation/", en: "en/terms/" }, lastmod: LEGAL_UPDATED },
  { alternates: { fr: "confidentialite/", en: "en/privacy/" }, lastmod: LEGAL_UPDATED },
];
const entries = [
  ...pairs.flatMap((p) => ["fr", "en"].map((lang) => ({ path: p.alternates[lang], ...p }))),
  { path: "code-signing/", lastmod: LEGAL_UPDATED },
  ...guides,
];
const hreflangs = (alternates) =>
  [...["fr", "en"].map((l) => [l, alternates[l]]), ["x-default", alternates.fr]]
    .map(([l, p]) => `    <xhtml:link rel="alternate" hreflang="${l}" href="${site}${p}" />\n`)
    .join("");
const url = ({ path, alternates, lastmod }) =>
  `  <url>\n    <loc>${site}${path}</loc>\n${alternates ? hreflangs(alternates) : ""}    <lastmod>${lastmod}</lastmod>\n  </url>\n`;
writeFileSync(
  join(dist, "sitemap.xml"),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${entries.map(url).join("")}</urlset>\n`,
);

/* ---------------------------------------------------------------- llms.txt */
// public/llms.txt, then every guide by family, for AI assistants that read it.
const family = (c) =>
  `### ${c.fr.name} / ${c.en.name}\n\n` +
  GUIDES.filter((g) => g.category === c.id)
    .map((g) => `- [${g.fr.title}](${site}${pathOf("fr", g)}): ${g.fr.description} English: [${g.en.title}](${site}${pathOf("en", g)})`)
    .join("\n");
const llms = `${readFileSync(join(dist, "llms.txt"), "utf8").trimEnd()}\n\n## Guides\n\n${GUIDE_CATEGORIES.map(family).join("\n\n")}\n`;
writeFileSync(join(dist, "llms.txt"), llms);

rmSync(join(root, "dist-ssr"), { recursive: true, force: true });
console.log(`prerendered ${sizes.join(", ")}, and ${GUIDES.length * 2} guides, for ${site}`);
