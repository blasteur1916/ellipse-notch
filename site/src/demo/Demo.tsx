/**
 * The page's demo: Ellipse's Notch at the top of a Windows desktop, playing
 * each feature in a loop (rest, Stash, shake, drop, downloads, phone). The
 * scenes advance by themselves until someone picks one.
 *
 * Everything is drawn on a 960 × 600 stage, scaled to the laptop's screen.
 */
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useTr, type Tr } from "../i18n";
import "./ellipse.css";

const W = 960;

const SPRING = { type: "spring", stiffness: 300, damping: 30, mass: 0.9 } as const;
const GLIDE = { type: "spring", stiffness: 90, damping: 18 } as const;

const SHAPES = {
  rest: { w: 132, h: 30, r: 13, ear: 9 },
  peek: { w: 400, h: 104, r: 28, ear: 16 },
  open: { w: 620, h: 300, r: 40, ear: 26 },
};
type Shape = keyof typeof SHAPES;

export type SceneId = "repos" | "stash" | "secouer" | "deposer" | "telechargements" | "telephone";

interface Scene {
  id: SceneId;
  label: string;
  title: string;
  desc: string;
}

export function scenes(tr: Tr): Scene[] {
  return [
    {
      id: "repos",
      label: tr("Repos", "Rest"),
      title: tr("Une pilule discrète, qui s'ouvre au survol.", "A discreet pill that opens on hover."),
      desc: tr(
        "Au repos, Ellipse n'affiche que l'heure, collée au bord de l'écran. Approchez la souris du haut : le Notch s'ouvre sur vos fichiers, et se referme quand vous partez. Fermé, il laisse passer les clics.",
        "At rest, Ellipse only shows the time, stuck to the edge of the screen. Bring the pointer to the top: the Notch opens on your files, and closes when you leave. Closed, it lets clicks through.",
      ),
    },
    {
      id: "stash",
      label: "Stash",
      title: tr("Vos fichiers du moment, toujours à portée.", "The files you're working with, always within reach."),
      desc: tr(
        "Le Stash garde les fichiers que vous y déposez et vos derniers téléchargements, avec leur vrai aperçu. Glissez une carte vers un mail, une conversation ou un dossier : le fichier part, le Stash reste rangé.",
        "The Stash keeps the files you drop in and your latest downloads, with their real preview. Drag a card into an email, a chat or a folder: the file goes there, and the Stash stays tidy.",
      ),
    },
    {
      id: "secouer",
      label: tr("Secouer", "Shake"),
      title: tr("Secouez un fichier, il file dans le Notch.", "Shake a file, and it flies into the Notch."),
      desc: tr(
        "Pendant que vous glissez un fichier, secouez la souris : une orbe apparaît sous le curseur et le suit. Lâchez où vous voulez, le fichier rejoint le Stash. Plus besoin de viser.",
        "While you drag a file, shake the mouse: an orb appears under the pointer and follows it. Let go anywhere, and the file joins the Stash. No more aiming.",
      ),
    },
    {
      id: "deposer",
      label: tr("Déposer", "Drop"),
      title: tr("Ou glissez-le jusqu'en haut de l'écran.", "Or drag it to the top of the screen."),
      desc: tr(
        "Le Notch s'ouvre dès qu'un fichier l'approche et devient une zone de dépôt. Le fichier reste à sa place sur le disque : le Stash n'en garde qu'un raccourci.",
        "The Notch opens as soon as a file comes near and turns into a drop zone. The file stays where it is on disk: the Stash only keeps a shortcut to it.",
      ),
    },
    {
      id: "telechargements",
      label: tr("Téléchargements", "Downloads"),
      title: tr("Chaque téléchargement s'annonce, puis s'en va.", "Every download announces itself, then leaves."),
      desc: tr(
        "Un fichier arrive dans Téléchargements : le Notch l'affiche avec son aperçu. Choisissez un minuteur (5 à 60 minutes) ou « après glisser », et il part à la Corbeille tout seul.",
        "A file lands in Downloads: the Notch shows it with its preview. Pick a timer (5 to 60 minutes) or “after drag”, and it goes to the Recycle Bin by itself.",
      ),
    },
    {
      id: "telephone",
      label: tr("Téléphone", "Phone"),
      title: tr("Une photo lancée du téléphone arrive sur le PC.", "A photo flicked from the phone lands on the PC."),
      desc: tr(
        "Scannez le QR code du Notch une fois, sur le même Wi-Fi. Glissez ensuite une photo vers le haut de l'écran du téléphone : le Notch du PC s'ouvre et la reçoit. Dans l'autre sens aussi, sans appli ni Internet.",
        "Scan the Notch's QR code once, on the same Wi-Fi. Then flick a photo to the top of the phone's screen: the PC's Notch opens and receives it. The other way round too, with no app and no Internet.",
      ),
    },
  ];
}

/** Steps of a scene: how long each lasts, the Notch's shape, where the pointer is. */
interface Frame {
  ms: number;
  shape: Shape;
  cursor: [number, number];
  file?: [number, number] | null;
  orb?: "hidden" | "cursor" | "home";
  grab?: boolean;
  hot?: boolean;
  fresh?: boolean;
  phone?: "idle" | "lift" | "fly" | "sent";
}

const FRAMES: Record<SceneId, Frame[]> = {
  repos: [
    { ms: 1800, shape: "rest", cursor: [700, 420] },
    { ms: 700, shape: "rest", cursor: [486, 8] },
    { ms: 2600, shape: "open", cursor: [430, 220] },
    { ms: 900, shape: "rest", cursor: [700, 440] },
  ],
  stash: [
    { ms: 900, shape: "rest", cursor: [486, 8] },
    { ms: 1500, shape: "open", cursor: [330, 150] },
    { ms: 900, shape: "open", cursor: [330, 150], file: [300, 112], grab: true },
    { ms: 1100, shape: "open", cursor: [200, 420], file: [170, 380], grab: true },
    { ms: 900, shape: "rest", cursor: [150, 500], file: [120, 460], grab: true },
    { ms: 700, shape: "rest", cursor: [700, 440] },
  ],
  secouer: [
    { ms: 1200, shape: "rest", cursor: [650, 300], file: [620, 260] },
    { ms: 260, shape: "rest", cursor: [520, 360], file: [490, 320], grab: true },
    { ms: 200, shape: "rest", cursor: [640, 360], file: [610, 320], grab: true },
    { ms: 200, shape: "rest", cursor: [520, 360], file: [490, 320], grab: true },
    { ms: 200, shape: "rest", cursor: [640, 360], file: [610, 320], grab: true },
    { ms: 1300, shape: "rest", cursor: [590, 380], file: [560, 340], orb: "cursor", grab: true },
    { ms: 2200, shape: "peek", cursor: [590, 380], orb: "home" },
    { ms: 700, shape: "rest", cursor: [660, 440] },
  ],
  deposer: [
    { ms: 1200, shape: "rest", cursor: [300, 520], file: [270, 480] },
    { ms: 900, shape: "rest", cursor: [470, 60], file: [440, 20], grab: true },
    { ms: 1300, shape: "open", cursor: [480, 160], file: [450, 120], grab: true, hot: true },
    { ms: 2600, shape: "open", cursor: [560, 240], fresh: true },
    { ms: 800, shape: "rest", cursor: [700, 440] },
  ],
  telechargements: [
    { ms: 1600, shape: "rest", cursor: [700, 440] },
    { ms: 3600, shape: "peek", cursor: [700, 440] },
    { ms: 900, shape: "rest", cursor: [700, 440] },
  ],
  telephone: [
    { ms: 1400, shape: "rest", cursor: [380, 470], phone: "idle" },
    { ms: 700, shape: "rest", cursor: [380, 470], phone: "lift" },
    { ms: 900, shape: "open", cursor: [380, 470], phone: "fly" },
    { ms: 2600, shape: "peek", cursor: [380, 470], phone: "sent" },
    { ms: 700, shape: "rest", cursor: [380, 470], phone: "idle" },
  ],
};

const sceneLength = (id: SceneId) => FRAMES[id].reduce((sum, f) => sum + f.ms, 0) * 2;

export function Demo({ scene, onScene }: { scene: SceneId; onScene(id: SceneId): void }) {
  const tr = useTr();
  const SCENES = useMemo(() => scenes(tr), [tr]);
  const screenRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [visible, setVisible] = useState(false);
  const [interacted, setInteracted] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    const el = screenRef.current!;
    const ro = new ResizeObserver(([e]) => setScale(e.contentRect.width / W));
    ro.observe(el);
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { threshold: 0.25 });
    io.observe(el);
    return () => {
      ro.disconnect();
      io.disconnect();
    };
  }, []);

  // Each scene restarts from its first step.
  useEffect(() => setStep(0), [scene]);

  useEffect(() => {
    if (!visible) return;
    const frames = FRAMES[scene];
    const timer = setTimeout(() => setStep((s) => (s + 1) % frames.length), frames[step % frames.length].ms);
    return () => clearTimeout(timer);
  }, [scene, step, visible]);

  // Nobody has picked a scene: the next one comes after two loops of this one.
  useEffect(() => {
    if (interacted || !visible) return;
    const timer = setTimeout(() => {
      const i = SCENES.findIndex((s) => s.id === scene);
      onScene(SCENES[(i + 1) % SCENES.length].id);
    }, sceneLength(scene));
    return () => clearTimeout(timer);
  }, [scene, interacted, visible, SCENES, onScene]);

  const frame = FRAMES[scene][step % FRAMES[scene].length];
  const current = SCENES.find((s) => s.id === scene)!;

  return (
    <div className="demo">
      <div className="laptop">
        <div className="laptop-frame">
          <div className="laptop-screen" ref={screenRef}>
            <div className="wallpaper" aria-hidden="true" />
            <div className="e-stage" style={{ transform: `scale(${scale})` }} aria-hidden="true">
              <div className="e-window">
                <div className="e-window-bar" />
                <span />
                <span />
                <span />
              </div>
              <div className="e-taskbar">
                {[0, 1, 2, 3, 4].map((i) => (
                  <span key={i} />
                ))}
              </div>
              <SceneView scene={scene} frame={frame} tr={tr} />
            </div>
          </div>
        </div>
      </div>

      <div className="scene-bar">
        <div className="scene-pills" role="tablist" aria-label={tr("Démonstrations", "Demos")}>
          {SCENES.map((s) => (
            <button
              key={s.id}
              type="button"
              role="tab"
              aria-selected={s.id === scene}
              className={`scene-pill ${s.id === scene ? "is-active" : ""} ${s.id === scene && !interacted && visible ? "is-timed" : ""}`}
              style={{ "--scene-ms": `${sceneLength(s.id)}ms` } as React.CSSProperties}
              onClick={() => {
                setInteracted(true);
                onScene(s.id);
              }}
            >
              {s.label}
            </button>
          ))}
        </div>
        <div key={scene} className="scene-text">
          <h2 className="scene-title">{current.title}</h2>
          <p className="scene-desc">{current.desc}</p>
        </div>
      </div>
    </div>
  );
}

function SceneView({ scene, frame, tr }: { scene: SceneId; frame: Frame; tr: Tr }) {
  const [cx, cy] = frame.cursor;
  let content: ReactNode = <Clock />;
  if (frame.shape === "open") {
    if (scene === "deposer" && !frame.fresh) content = <DropZone hot={!!frame.hot} tr={tr} />;
    else if (scene === "telephone") content = <Receiving tr={tr} />;
    else content = <StashPanel fresh={frame.fresh} tr={tr} />;
  } else if (frame.shape === "peek") {
    if (scene === "telechargements")
      content = <Peek label={tr("Téléchargement terminé", "Download complete")} name="affiche-concert.png" meta={tr("2,4 Mo · Corbeille dans 10:00", "2.4 MB · Recycle Bin in 10:00")} tint="blue" />;
    else if (scene === "telephone")
      content = <Peek label={tr("Reçu du téléphone", "Received from phone")} name="IMG_2041.jpg" meta={tr("3,1 Mo · JPG", "3.1 MB · JPG")} tint="warm" />;
    else content = <Peek label={tr("Ajouté au Stash", "Added to the Stash")} name="vacances.jpg" meta={tr("2,4 Mo · JPG", "2.4 MB · JPG")} tint="warm" />;
  }

  return (
    <>
      <Notch shape={frame.shape}>{content}</Notch>
      {frame.file && <DesktopFile x={frame.file[0]} y={frame.file[1]} small={frame.orb === "cursor" || !!frame.hot} />}
      <AnimatePresence>
        {frame.orb && frame.orb !== "hidden" && (
          <motion.div
            key="orb"
            className="e-orb"
            initial={{ x: cx - 55, y: cy - 55, scale: 0 }}
            animate={
              frame.orb === "home"
                ? { x: 480 - 55, y: -40, scale: 0.15, transition: { duration: 0.5, ease: [0.55, 0, 1, 0.45] } }
                : { x: cx - 55, y: cy - 55, scale: 1, transition: { type: "spring", stiffness: 260, damping: 18 } }
            }
            exit={{ opacity: 0, transition: { duration: 0.15 } }}
          >
            <motion.span className="e-orb-ring" animate={{ scale: [1, 1.35], opacity: [0.7, 0] }} transition={{ duration: 1.1, repeat: Infinity }} />
          </motion.div>
        )}
      </AnimatePresence>
      {scene === "telephone" && <Phone state={frame.phone ?? "idle"} tr={tr} />}
      {scene !== "telephone" && scene !== "telechargements" && <Cursor x={cx} y={cy} grab={!!frame.grab} />}
    </>
  );
}

function Ear({ side, size }: { side: "left" | "right"; size: number }) {
  return (
    <motion.span
      className={`e-ear e-ear--${side}`}
      initial={false}
      animate={{ width: size, height: size, [side]: -size + 0.5 }}
      transition={SPRING}
    />
  );
}

function Notch({ shape, children }: { shape: Shape; children: ReactNode }) {
  const s = SHAPES[shape];
  return (
    <motion.div className="e-notch" initial={false} animate={{ width: s.w, height: s.h }} transition={SPRING}>
      <motion.div className="e-notch-body" initial={false} animate={{ borderBottomLeftRadius: s.r, borderBottomRightRadius: s.r }} transition={SPRING}>
        <AnimatePresence initial={false}>
          <motion.div
            key={shape}
            className="e-notch-content"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1, transition: { delay: 0.1, duration: 0.25 } }}
            exit={{ opacity: 0, transition: { duration: 0.1 } }}
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </motion.div>
      <Ear side="left" size={s.ear} />
      <Ear side="right" size={s.ear} />
    </motion.div>
  );
}

function Cursor({ x, y, grab }: { x: number; y: number; grab: boolean }) {
  return (
    <motion.svg className="e-cursor" width="22" height="30" viewBox="0 0 20 28" initial={false} animate={{ x, y, scale: grab ? 0.9 : 1 }} transition={GLIDE}>
      <path d="M1 1v22l6-6 4 9 4-2-4-9h8Z" fill="#fff" stroke="#000" strokeWidth="1.5" strokeLinejoin="round" />
    </motion.svg>
  );
}

function DesktopFile({ x, y, small }: { x: number; y: number; small: boolean }) {
  return (
    <motion.div className="e-file" initial={false} animate={{ x, y, scale: small ? 0.6 : 1 }} transition={GLIDE}>
      <div className="e-file-thumb" />
      <span>vacances.jpg</span>
    </motion.div>
  );
}

function Clock() {
  return <div className="e-clock">21:06</div>;
}

const Icon = ({ d }: { d: string }) => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
);

function StashPanel({ fresh, tr }: { fresh?: boolean; tr: Tr }) {
  const cards: ReactNode[][] = [
    [<div key="a" className="e-card e-card--img e-tint-warm" style={{ height: 104 }} />, <div key="b" className="e-card e-card--text"><p>{tr("Notes de réunion : lancement jeudi, démo à 14 h.", "Meeting notes: launch on Thursday, demo at 2 pm.")}</p><small>notes.md</small></div>],
    [<div key="c" className="e-card e-card--text"><p>facture-novembre.pdf</p><small>184 Ko</small></div>, <div key="d" className="e-card e-card--img e-tint-blue" style={{ height: 92 }} />],
    [<div key="e" className="e-card e-card--img e-tint-green" style={{ height: 84 }} />, <div key="f" className="e-card e-card--text"><p>{tr("Billets train Paris – Lyon, voiture 7.", "Train tickets Paris – Lyon, coach 7.")}</p><small>billets.txt</small></div>],
  ];
  return (
    <div className="e-panel">
      <div className="e-toolbar">
        <div className="e-search">
          <Icon d="M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14Zm9 2-3.5-3.5" />
          {tr("Rechercher", "Search")}
        </div>
        <span className="e-tool"><Icon d="M8 5v14M16 5v14" /></span>
        <span className="e-tool"><Icon d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" /></span>
        <span className="e-tool"><Icon d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12M20 18h0" /></span>
      </div>
      <div className="e-grid">
        {cards.map((col, i) => (
          <div key={i} className="e-col">
            {fresh && i === 0 && (
              <motion.div className="e-card e-card--img e-tint-warm e-card--fresh" style={{ height: 96 }} initial={{ opacity: 0, y: -16, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={SPRING} />
            )}
            {col}
          </div>
        ))}
      </div>
    </div>
  );
}

function Peek({ label, name, meta, tint }: { label: string; name: string; meta: string; tint: "warm" | "blue" }) {
  return (
    <div className="e-peek">
      <div className={`e-peek-thumb e-tint-${tint}`} />
      <div className="e-peek-text">
        <small>{label}</small>
        <strong>{name}</strong>
        <span>{meta}</span>
      </div>
    </div>
  );
}

function DropZone({ hot, tr }: { hot: boolean; tr: Tr }) {
  return (
    <div className="e-drop-wrap">
      <div className={`e-drop ${hot ? "is-hot" : ""}`}>
        <span className="e-drop-icon"><Icon d="M12 3 3 8l9 5 9-5-9-5ZM3 13l9 5 9-5" /></span>
        <strong>{tr("Ajouter au Stash", "Add to the Stash")}</strong>
        <small>{tr("Le fichier reste à son emplacement d'origine", "The file stays where it is")}</small>
      </div>
    </div>
  );
}

function Receiving({ tr }: { tr: Tr }) {
  return (
    <div className="e-drop-wrap">
      <div className="e-drop is-hot">
        <motion.span className="e-drop-icon e-drop-icon--light" animate={{ y: [0, 5, 0] }} transition={{ duration: 1.1, repeat: Infinity }}>
          <Icon d="M12 4v12m-6-5 6 6 6-6M5 20h14" />
        </motion.span>
        <strong>{tr("iPhone envoie un fichier", "iPhone is sending a file")}</strong>
        <small>{tr("Sur votre Wi-Fi, sans passer par Internet", "Over your Wi-Fi, not through the Internet")}</small>
      </div>
    </div>
  );
}

function Phone({ state, tr }: { state: NonNullable<Frame["phone"]>; tr: Tr }) {
  const armed = state === "lift" || state === "fly";
  return (
    <div className="e-phone">
      <motion.div
        className="e-phone-island"
        animate={{
          width: armed ? 150 : 78,
          height: armed ? 36 : 22,
          backgroundColor: state === "fly" ? "#f8f7f4" : "#000000",
          color: state === "fly" ? "#000000" : "#f8f7f4",
        }}
        transition={{ type: "spring", stiffness: 300, damping: 24 }}
      >
        {state === "sent" ? tr("Envoyé", "Sent") : armed ? tr("Envoyer au PC", "Send to PC") : ""}
      </motion.div>
      <div className="e-phone-title">Ellipse</div>
      <div className="e-phone-grid">
        <motion.div
          className="e-phone-card e-tint-warm"
          animate={
            state === "fly"
              ? { y: -170, scale: 0.2, opacity: 0 }
              : state === "lift"
                ? { y: -8, scale: 1.06, opacity: 1 }
                : { y: 0, scale: 1, opacity: state === "sent" ? 0 : 1 }
          }
          transition={state === "fly" ? { duration: 0.5, ease: [0.55, 0, 1, 0.45] } : { type: "spring", stiffness: 260, damping: 22 }}
        />
        <div className="e-phone-card e-phone-card--text">{tr("Billets train", "Train tickets")}</div>
        <div className="e-phone-card e-tint-blue" />
        <div className="e-phone-card e-tint-green" />
      </div>
    </div>
  );
}
