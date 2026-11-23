import { Suspense, lazy, useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import type { SceneId } from "./demo/Demo";
import { DOWNLOAD, RELEASES, REPO, faqs } from "./content";
import { LangContext, rootOf, useLang, useTr, type Lang, type Tr } from "./i18n";

type Theme = "dark" | "system" | "light";

// The demo is the page's heaviest part: it comes in its own file, and React keeps
// its prerendered HTML on screen until that file has arrived.
const Demo = lazy(() => import("./demo/Demo").then((m) => ({ default: m.Demo })));

/* ---------------------------------------------------------------- Bits */

function Logo({ size = 34 }: { size?: number }) {
  return <img className="logo" src={`${useRoot()}favicon-48.png`} width={size} height={size} alt="" />;
}

/** The site's root from this page (the English page is one folder down). */
function useRoot() {
  return rootOf(useLang());
}

function WindowsIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">
      <path d="M3 5.45 10.35 4v7.15H3V5.45Zm8.35-1.65L21 2v9.15h-9.65V3.8ZM3 12.15h7.35v7.4L3 17.85v-5.7Zm8.35 0H21V22l-9.65-2.22v-7.63Z" />
    </svg>
  );
}

function GitHubIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">
      <path d="M12 2a10 10 0 0 0-3.16 19.49c.5.09.68-.22.68-.48v-1.7c-2.78.6-3.37-1.34-3.37-1.34-.45-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.9 1.52 2.34 1.08 2.91.83.09-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.94 0-1.09.39-1.98 1.03-2.68-.1-.25-.45-1.27.1-2.64 0 0 .84-.27 2.75 1.02a9.5 9.5 0 0 1 5 0c1.91-1.29 2.75-1.02 2.75-1.02.55 1.37.2 2.39.1 2.64.64.7 1.03 1.59 1.03 2.68 0 3.84-2.34 4.68-4.57 4.93.36.31.68.92.68 1.85v2.74c0 .27.18.58.69.48A10 10 0 0 0 12 2Z" />
    </svg>
  );
}

function scrollToId(e: React.MouseEvent, href: string) {
  if (!href.startsWith("#")) return;
  e.preventDefault();
  const target = href === "#top" ? null : document.querySelector(href);
  const top = target ? target.getBoundingClientRect().top + window.scrollY - 96 : 0;
  window.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
}

/** Fades sections in as they come into view. */
function useReveal() {
  useEffect(() => {
    const items = document.querySelectorAll(".reveal");
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            e.target.classList.add("is-revealed");
            io.unobserve(e.target);
          }
        }
      },
      { threshold: 0.08, rootMargin: "0px 0px -24px 0px" },
    );
    items.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);
}

/** The same page in the other language. */
function LangSwitch() {
  const lang = useLang();
  const other: Lang = lang === "fr" ? "en" : "fr";
  return (
    <a
      className="lang-switch"
      href={lang === "fr" ? "./en/" : "../"}
      hrefLang={other}
      lang={other}
      title={lang === "fr" ? "English version" : "Version française"}
    >
      {other.toUpperCase()}
    </a>
  );
}

/* ---------------------------------------------------------------- Nav */

const nav = (tr: Tr) => [
  { label: tr("Aperçu", "Preview"), href: "#demo" },
  { label: tr("Fonctionnalités", "Features"), href: "#features" },
  { label: "FAQ", href: "#faq" },
  { label: "Guides", href: "./guides/" },
  { label: tr("Téléchargement", "Download"), href: "#download" },
];

function Nav() {
  const tr = useTr();
  const menu = useRef<HTMLDetailsElement>(null);
  const go = (e: React.MouseEvent, href: string) => {
    scrollToId(e, href);
    menu.current?.removeAttribute("open");
  };
  const links = nav(tr);
  return (
    <header className="nav">
      <div className="nav-row">
        <a className="brand" href="#top" onClick={(e) => go(e, "#top")} aria-label={tr("Ellipse, accueil", "Ellipse, home")}>
          <Logo />
          <span>Ellipse</span>
        </a>
        <nav className="nav-links" aria-label="Sections">
          {links.map((l) => (
            <a key={l.href} href={l.href} onClick={(e) => go(e, l.href)}>
              {l.label}
            </a>
          ))}
        </nav>
        <LangSwitch />
        <a className="btn btn--light nav-cta" href={DOWNLOAD}>
          {tr("Télécharger", "Download")}
        </a>
        <details className="nav-menu" ref={menu}>
          <summary aria-label="Menu">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true">
              <path d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </summary>
          <div className="nav-menu-panel">
            {links.map((l) => (
              <a key={l.href} href={l.href} onClick={(e) => go(e, l.href)}>
                {l.label}
              </a>
            ))}
            <a className="btn btn--light" href={DOWNLOAD}>
              {tr("Télécharger", "Download")}
            </a>
          </div>
        </details>
      </div>
    </header>
  );
}

/* ---------------------------------------------------------------- Hero */

function DownloadMenu() {
  const tr = useTr();
  const ref = useRef<HTMLDetailsElement>(null);
  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (ref.current?.open && !ref.current.contains(e.target as Node)) ref.current.removeAttribute("open");
    };
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, []);
  return (
    <details className="download" ref={ref}>
      <summary aria-label={tr("Télécharger pour Windows, ou choisir une autre plateforme", "Download for Windows, or pick another platform")}>
        <a className="download-main" href={DOWNLOAD} onClick={(e) => e.stopPropagation()}>
          <WindowsIcon />
          {tr("Télécharger pour Windows", "Download for Windows")}
        </a>
        <span className="download-chevron" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m7 9 5 5 5-5" />
          </svg>
        </span>
      </summary>
      <div className="download-panel">
        <div className="download-head">{tr("Choisissez votre plateforme", "Choose your platform")}</div>
        <a className="download-option" href={DOWNLOAD}>
          <span className="download-icon">
            <WindowsIcon />
          </span>
          <span>
            <strong>Windows 10 · 11</strong>
            <small>{tr("Installateur · téléchargement direct", "Installer · direct download")}</small>
          </span>
          <em>.exe</em>
        </a>
        <a className="download-option" href={REPO}>
          <span className="download-icon">
            <GitHubIcon />
          </span>
          <span>
            <strong>{tr("Code source", "Source code")}</strong>
            <small>{tr("GitHub · licence GPL-3.0", "GitHub · GPL-3.0 licence")}</small>
          </span>
          <em>Git</em>
        </a>
      </div>
    </details>
  );
}

function Hero({ scene, onScene }: { scene: SceneId; onScene(id: SceneId): void }) {
  const tr = useTr();
  return (
    <section className="hero" id="top">
      <div className="shell">
        <div className="hero-copy">
          <h1>{tr("Le Notch qui manquait à Windows", "The Notch Windows was missing")}</h1>
          <p>
            {tr(
              "Ellipse ajoute un Notch en haut de l'écran. Survolez-le : vos fichiers du moment et vos derniers téléchargements sont là, avec leur aperçu, prêts à être glissés dans n'importe quelle appli. Secouez un fichier pour l'y ranger, et échangez des photos avec votre téléphone sur le Wi-Fi.",
              "Ellipse adds a Notch at the top of the screen. Hover it: the files you're working with and your latest downloads are there, with their preview, ready to drag into any app. Shake a file to put it away, and swap photos with your phone over Wi-Fi.",
            )}
            <br />
            <strong>{tr("Léger, open source et 100 % gratuit.", "Lightweight, open source and 100% free.")}</strong>
          </p>
          <div className="hero-actions">
            <DownloadMenu />
            <a className="btn btn--ghost btn--lg" href="#features" onClick={(e) => scrollToId(e, "#features")}>
              {tr("Explorer les fonctionnalités", "Explore the features")}
            </a>
          </div>
        </div>
        <div className="hero-demo" id="demo">
          {/* Its own boundary: hydrated after the text, so the page answers sooner. */}
          <Suspense>
            <Demo scene={scene} onScene={onScene} />
          </Suspense>
        </div>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------- Platforms */

const PLATFORMS = (tr: Tr) => [tr("Explorateur", "File Explorer"), "Outlook", "Gmail", "WhatsApp", "Discord", "Teams", "Word"];

function PlatformBand() {
  const tr = useTr();
  return (
    <section className="band" aria-label={tr("Compatibilité", "Compatibility")}>
      <p className="band-lead reveal">{tr("Glissez vos fichiers du Notch vers toutes vos applis", "Drag your files from the Notch into all your apps")}</p>
      <div className="band-logos">
        {PLATFORMS(tr).map((name, i) => (
          <span key={name} className="band-logo reveal" style={{ "--stagger": `${i * 45}ms` } as React.CSSProperties}>
            {name}
          </span>
        ))}
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------- Features */

const icon = (d: ReactNode) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {d}
  </svg>
);

function features(tr: Tr): { title: string; desc: string; icon: ReactNode; scene?: SceneId }[] {
  return [
    {
      title: tr("Le Stash", "The Stash"),
      desc: tr(
        "Un tiroir en haut de l'écran pour vos fichiers du moment. Il s'ouvre au survol, et se referme quand la souris repart.",
        "A drawer at the top of the screen for the files you're working with. It opens on hover, and closes when the pointer leaves.",
      ),
      icon: icon(<path d="M12 3 3 8l9 5 9-5-9-5ZM3 13l9 5 9-5M3 18l9 5 9-5" />),
      scene: "stash",
    },
    {
      title: tr("Secouer pour ranger", "Shake to stash"),
      desc: tr(
        "Secouez la souris en glissant un fichier : une orbe apparaît sous le curseur. Lâchez n'importe où, le fichier file dans le Notch.",
        "Shake the mouse while dragging a file: an orb appears under the pointer. Let go anywhere, and the file flies into the Notch.",
      ),
      icon: icon(
        <>
          <circle cx="12" cy="12" r="4" />
          <path d="M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M5.6 18.4 7 17M17 7l1.4-1.4" />
        </>,
      ),
      scene: "secouer",
    },
    {
      title: tr("Déposer en haut", "Drop at the top"),
      desc: tr(
        "Glissez un fichier jusqu'en haut de l'écran : le Notch s'ouvre et devient une zone de dépôt. Le fichier reste à sa place sur le disque.",
        "Drag a file to the top of the screen: the Notch opens and turns into a drop zone. The file stays where it is on disk.",
      ),
      icon: icon(<path d="M12 19V5M5 12l7-7 7 7" />),
      scene: "deposer",
    },
    {
      title: tr("Glisser vers vos applis", "Drag into your apps"),
      desc: tr(
        "Chaque carte du Stash se glisse dans un mail, une conversation, un document ou un dossier, comme depuis l'Explorateur.",
        "Every Stash card drags into an email, a chat, a document or a folder, just like from File Explorer.",
      ),
      icon: icon(<path d="M7 17 17 7M8 7h9v9" />),
      scene: "stash",
    },
    {
      title: tr("Téléchargements éphémères", "Short-lived downloads"),
      desc: tr(
        "Chaque téléchargement s'affiche avec son aperçu. Un minuteur de 5 à 60 minutes, ou « après glisser », et il part à la Corbeille.",
        "Every download shows up with its preview. A 5 to 60-minute timer, or “after drag”, and it goes to the Recycle Bin.",
      ),
      icon: icon(<path d="M12 4v11m-5-5 5 5 5-5M5 20h14" />),
      scene: "telechargements",
    },
    {
      title: tr("De vrais aperçus", "Real previews"),
      desc: tr(
        "Les mêmes miniatures que l'Explorateur : photos, PDF, vidéos, documents. Les fichiers texte montrent leurs premières lignes.",
        "The same thumbnails as File Explorer: photos, PDFs, videos, documents. Text files show their first lines.",
      ),
      icon: icon(
        <>
          <rect x="3.5" y="4.5" width="17" height="15" rx="2.5" />
          <circle cx="9" cy="10" r="1.6" />
          <path d="m20.5 15.5-4.5-4.5-8 8" />
        </>,
      ),
      scene: "stash",
    },
    {
      title: tr("Du téléphone au PC", "From phone to PC"),
      desc: tr(
        "Glissez une photo vers le haut de l'écran du téléphone : le Notch du PC s'ouvre et la reçoit. iPhone ou Android, sans appli.",
        "Flick a photo to the top of the phone's screen: the PC's Notch opens and receives it. iPhone or Android, with no app.",
      ),
      icon: icon(
        <>
          <rect x="7" y="2.5" width="10" height="19" rx="2.5" />
          <path d="M11 18.5h2" />
        </>,
      ),
      scene: "telephone",
    },
    {
      title: tr("Du PC au téléphone", "From PC to phone"),
      desc: tr(
        "Déposez un fichier sur la zone Téléphone du Notch : il apparaît aussitôt sur le téléphone, prêt à être enregistré.",
        "Drop a file on the Notch's Phone zone: it shows up at once on the phone, ready to be saved.",
      ),
      icon: icon(<path d="M4 12h12M12 6l6 6-6 6M20 5v14" />),
      scene: "telephone",
    },
    {
      title: tr("Appairé une fois", "Paired once"),
      desc: tr(
        "Un QR code à scanner, une seule fois. Ensuite, le téléphone retrouve le PC tout seul sur le Wi-Fi.",
        "One QR code to scan, once. After that, the phone finds the PC by itself on the Wi-Fi.",
      ),
      icon: icon(<path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h2v2h-2zM18 18h2v2h-2zM14 18h2M18 14h2" />),
    },
    {
      title: tr("Discret", "Out of the way"),
      desc: tr(
        "Fermé, il ne fait que 132 × 30 pixels et laisse passer les clics autour de lui. Rien ne s'ouvre tant que la souris ne monte pas.",
        "Closed, it's only 132 × 30 pixels and lets clicks through around it. Nothing opens until the pointer goes up.",
      ),
      icon: icon(<path d="M3 12s3.5-6 9-6 9 6 9 6-3.5 6-9 6-9-6-9-6ZM12 14.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z" />),
      scene: "repos",
    },
    {
      title: tr("Au démarrage", "At startup"),
      desc: tr(
        "Une case dans l'icône près de l'horloge, et le Notch est prêt dès l'ouverture de session.",
        "One tick in the icon near the clock, and the Notch is ready as soon as you sign in.",
      ),
      icon: icon(<path d="M12 3v8M6.3 7.3a8 8 0 1 0 11.4 0" />),
    },
    {
      title: tr("Léger", "Lightweight"),
      desc: tr(
        "Un installateur de moins de 2 Mo, écrit en Rust. Au repos, Ellipse attend un téléchargement ou votre souris, et c'est tout.",
        "An installer under 2 MB, written in Rust. At rest, Ellipse waits for a download or your pointer, and that's it.",
      ),
      icon: icon(<path d="M13 2 4 14h7l-1 8 9-12h-7l1-8Z" />),
    },
  ];
}

function Features({ onScene }: { onScene(id: SceneId): void }) {
  const tr = useTr();
  return (
    <section className="features" id="features" aria-labelledby="features-title">
      <div className="section-head reveal">
        <h2 id="features-title">{tr("Tout ce qu'un Notch peut faire de vos fichiers", "Everything a Notch can do with your files")}</h2>
        <p>
          {tr(
            "Ellipse ajoute à Windows un endroit pour vos fichiers, sans fenêtre de plus : le Notch s'ouvre quand vous en avez besoin, et se fait oublier le reste du temps.",
            "Ellipse gives Windows a place for your files, with no extra window: the Notch opens when you need it, and stays out of the way the rest of the time.",
          )}
        </p>
      </div>
      <div className="features-grid">
        {features(tr).map((f, i) => {
          const body = (
            <>
              <span className="feat-icon">{f.icon}</span>
              <h3>{f.title}</h3>
              <p>{f.desc}</p>
              {f.scene && <span className="feat-try">{tr("Voir dans l'aperçu →", "See it in the preview →")}</span>}
            </>
          );
          const style = { "--stagger": `${(i % 3) * 70}ms` } as React.CSSProperties;
          return f.scene ? (
            <a
              key={f.title}
              className="feat reveal"
              href="#demo"
              style={style}
              onClick={(e) => {
                onScene(f.scene!);
                scrollToId(e, "#demo");
              }}
            >
              {body}
            </a>
          ) : (
            <div key={f.title} className="feat reveal" style={style}>
              {body}
            </div>
          );
        })}
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------- Numbers */

const numbers = (tr: Tr) => [
  { value: tr("1,7 Mo", "1.7 MB"), label: tr("pour l'installateur", "for the installer") },
  { value: "132 × 30", label: tr("pixels au repos", "pixels at rest") },
  { value: "0", label: tr("compte, serveur ou télémétrie", "account, server or telemetry") },
  { value: "GPL-3.0", label: tr("code ouvert à tous", "code open to all") },
];

function Numbers() {
  const tr = useTr();
  return (
    <section className="numbers" aria-label={tr("En chiffres", "In numbers")}>
      {numbers(tr).map((n, i) => (
        <div key={n.label} className="number reveal" style={{ "--stagger": `${i * 60}ms` } as React.CSSProperties}>
          <strong>{n.value}</strong>
          <span>{n.label}</span>
        </div>
      ))}
    </section>
  );
}

/* ---------------------------------------------------------------- FAQ */

function Faq() {
  const lang = useLang();
  const tr = useTr();
  const [open, setOpen] = useState<number | null>(null);
  return (
    <section className="faq reveal" id="faq" aria-labelledby="faq-title">
      <h2 id="faq-title">{tr("Questions fréquentes", "Frequently asked questions")}</h2>
      <div className="faq-list">
        {faqs(lang).map((f, i) => (
          <div key={f.q} className={`faq-item ${open === i ? "is-open" : ""}`}>
            <button type="button" className="faq-q" aria-expanded={open === i} onClick={() => setOpen(open === i ? null : i)}>
              <span>{f.q}</span>
              <span className="faq-plus" aria-hidden="true" />
            </button>
            <div className="faq-a">
              <div>
                <p>{f.a}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------- CTA, footer */

function Cta() {
  const tr = useTr();
  return (
    <section className="cta-wrap" id="download">
      <div className="shell">
        <div className="cta reveal">
          <div className="cta-badge">{tr("Natif, léger et gratuit", "Native, light and free")}</div>
          <h2>{tr("Prêt à installer Ellipse ?", "Ready to install Ellipse?")}</h2>
          <p>
            {tr(
              "Un installateur pour Windows 10 et 11, sans inscription. Le Notch apparaît en haut de l'écran dès le premier lancement.",
              "One installer for Windows 10 and 11, no sign-up. The Notch appears at the top of the screen from the first launch.",
            )}
          </p>
          <div className="cta-actions">
            <a className="btn btn--light btn--lg" href={DOWNLOAD}>
              <WindowsIcon />
              {tr("Télécharger pour Windows", "Download for Windows")}
            </a>
            <a className="btn btn--ghost btn--lg" href={REPO}>
              <GitHubIcon />
              {tr("Voir le code sur GitHub", "View the code on GitHub")}
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

function ThemeSwitch({ theme, onTheme }: { theme: Theme; onTheme(t: Theme): void }) {
  const tr = useTr();
  const options: { id: Theme; label: string; icon: ReactNode }[] = [
    { id: "dark", label: tr("Thème sombre", "Dark theme"), icon: <path d="M20.2 14.4A8.5 8.5 0 0 1 9.6 3.8a8.5 8.5 0 1 0 10.6 10.6Z" /> },
    {
      id: "system",
      label: tr("Thème du système", "System theme"),
      icon: (
        <>
          <rect height="11.5" rx="2.2" width="16.5" x="3.75" y="4.5" />
          <path d="M9 19.5h6M12 16v3.5" />
        </>
      ),
    },
    {
      id: "light",
      label: tr("Thème clair", "Light theme"),
      icon: (
        <>
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2.75V5.1M12 18.9v2.35M21.25 12H18.9M5.1 12H2.75M18.54 5.46l-1.66 1.66M7.12 16.88l-1.66 1.66M18.54 18.54l-1.66-1.66M7.12 7.12 5.46 5.46" />
        </>
      ),
    },
  ];
  return (
    <div className="theme-switch" role="radiogroup" aria-label={tr("Thème", "Theme")}>
      {options.map((o) => (
        <button key={o.id} type="button" role="radio" aria-checked={theme === o.id} aria-label={o.label} title={o.label} onClick={() => onTheme(o.id)}>
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            {o.icon}
          </svg>
        </button>
      ))}
    </div>
  );
}

/** The most searched guides, linked from every page's footer: [French slug, English slug, French label, English label]. */
const popularGuides: [string, string, string, string][] = [
  ["vider-telechargements-automatiquement-windows", "auto-clean-downloads-windows", "Vider Téléchargements automatiquement", "Clear Downloads automatically"],
  ["envoyer-photo-iphone-vers-pc", "send-photo-iphone-to-pc", "Photo de l'iPhone vers le PC", "Photo from iPhone to PC"],
  ["etagere-fichiers-windows", "file-shelf-windows", "Une étagère à fichiers pour Windows", "A file shelf for Windows"],
  ["notch-windows", "notch-for-windows", "Un Notch pour Windows", "A Notch for Windows"],
];

function Footer({ theme, onTheme, onScene }: { theme: Theme; onTheme(t: Theme): void; onScene(id: SceneId): void }) {
  const lang = useLang();
  const tr = useTr();
  const root = rootOf(lang);
  const show = (e: React.MouseEvent, id: SceneId) => {
    onScene(id);
    scrollToId(e, "#demo");
  };
  const product: [SceneId, string][] = [
    ["stash", "Stash"],
    ["secouer", tr("Secouer pour ranger", "Shake to stash")],
    ["deposer", tr("Déposer en haut", "Drop at the top")],
    ["telechargements", tr("Téléchargements éphémères", "Short-lived downloads")],
    ["telephone", tr("Téléphone et PC", "Phone and PC")],
  ];
  return (
    <footer className="footer">
      <div className="shell">
        <div className="footer-grid">
          <a className="brand brand--big" href="#top" onClick={(e) => scrollToId(e, "#top")} aria-label={tr("Ellipse, accueil", "Ellipse, home")}>
            <Logo size={38} />
            <span>Ellipse</span>
          </a>
          <div>
            <h3>{tr("Produit", "Product")}</h3>
            <nav className="footer-links" aria-label={tr("Produit", "Product")}>
              {product.map(([id, label]) => (
                <a key={id} href="#demo" onClick={(e) => show(e, id)}>
                  {label}
                </a>
              ))}
            </nav>
          </div>
          <div>
            <h3>{tr("Téléchargement", "Download")}</h3>
            <nav className="footer-links" aria-label={tr("Téléchargement", "Download")}>
              <a href={DOWNLOAD}>Windows 10 · 11 (.exe)</a>
              <a href={RELEASES}>{tr("Toutes les versions", "All releases")}</a>
              <a href={REPO}>{tr("Code source", "Source code")}</a>
            </nav>
          </div>
          <div>
            <h3>Guides</h3>
            <nav className="footer-links" aria-label="Guides">
              {popularGuides.map(([fr, en, frLabel, enLabel]) => (
                <a key={en} href={`./guides/${lang === "fr" ? fr : en}/`}>
                  {tr(frLabel, enLabel)}
                </a>
              ))}
              <a href="./guides/">{tr("Tous les guides", "All guides")}</a>
            </nav>
          </div>
          <div>
            <h3>{tr("Projet", "Project")}</h3>
            <nav className="footer-links" aria-label={tr("Projet", "Project")}>
              <a href={REPO}>GitHub</a>
              <a href={`${REPO}/issues`}>{tr("Signaler un problème", "Report a problem")}</a>
              <a href={`${REPO}/blob/main/LICENSE`}>{tr("Licence GPL-3.0", "GPL-3.0 licence")}</a>
              <a href={`${root}code-signing/`}>{tr("Compilation des versions", "How releases are built")}</a>
              <a href="#faq" onClick={(e) => scrollToId(e, "#faq")}>
                {tr("Questions fréquentes", "FAQ")}
              </a>
            </nav>
          </div>
        </div>
        <div className="footer-bottom">
          <span>{tr("© 2026 Ellipse · logiciel libre sous licence GPL-3.0", "© 2026 Ellipse · free software under the GPL-3.0 licence")}</span>
          <nav className="footer-legal" aria-label={tr("Informations légales", "Legal")}>
            <a href={lang === "fr" ? "./mentions-legales/" : "./legal-notice/"}>{tr("Mentions légales", "Legal notice")}</a>
            <a href={lang === "fr" ? "./conditions-utilisation/" : "./terms/"}>{tr("Conditions d'utilisation", "Terms of use")}</a>
            <a href={lang === "fr" ? "./confidentialite/" : "./privacy/"}>{tr("Confidentialité", "Privacy")}</a>
          </nav>
          <div className="footer-tools">
            <LangSwitch />
            <ThemeSwitch theme={theme} onTheme={onTheme} />
          </div>
        </div>
      </div>
    </footer>
  );
}

/* ---------------------------------------------------------------- App */

function readTheme(): Theme {
  try {
    const t = localStorage.getItem("ellipse-theme");
    if (t === "dark" || t === "light") return t;
  } catch {
    /* storage blocked: follow the system */
  }
  return "system";
}

export default function App({ lang }: { lang: Lang }) {
  // The page is prerendered without a stored choice: read it once hydrated.
  const [theme, setTheme] = useState<Theme>("system");
  const themeRead = useRef(false);
  const [scene, setScene] = useState<SceneId>("repos");
  const onScene = useCallback((id: SceneId) => setScene(id), []);
  useReveal();

  useEffect(() => setTheme(readTheme()), []);

  useEffect(() => {
    // The first pass would undo the theme the page's head script applied.
    if (!themeRead.current) {
      themeRead.current = true;
      return;
    }
    const root = document.documentElement;
    if (theme === "system") root.removeAttribute("data-theme");
    else root.setAttribute("data-theme", theme);
    try {
      if (theme === "system") localStorage.removeItem("ellipse-theme");
      else localStorage.setItem("ellipse-theme", theme);
    } catch {
      /* storage blocked: the choice lasts for this visit */
    }
  }, [theme]);

  return (
    <LangContext.Provider value={lang}>
      <Nav />
      <main>
        <Hero scene={scene} onScene={onScene} />
        <Suspense>
          <PlatformBand />
          <Features onScene={onScene} />
          <Numbers />
        </Suspense>
        <Suspense>
          <Faq />
          <Cta />
        </Suspense>
      </main>
      <Suspense>
        <Footer theme={theme} onTheme={setTheme} onScene={onScene} />
      </Suspense>
    </LangContext.Provider>
  );
}
