import { listen } from "@tauri-apps/api/event";
import { AnimatePresence, motion, type Variants } from "framer-motion";
import { ArrowUp, Check } from "lucide-react";
import { useEffect, useState } from "react";
import { useFileDrop, type DropHover } from "../../hooks/useFileDrop";
import { iconForMime } from "../../lib/files";
import { EVENTS } from "../../lib/ipc";

type Phase = "shown" | "dropped" | "leaving";

const ORB = 88;

const orb: Variants = {
  shown: { scale: 1, opacity: 1, filter: "blur(0px)" },
  // Aspiré vers le Notch pendant que Rust fait voler la fenêtre.
  dropped: {
    scale: 0.3,
    opacity: 0,
    filter: "blur(2px)",
    transition: { delay: 0.12, duration: 0.32, ease: [0.55, 0, 1, 0.45] },
  },
  leaving: { scale: 0.6, opacity: 0, filter: "blur(6px)", transition: { duration: 0.2 } },
};

/** Orbe de dépôt accrochée au curseur : relâcher envoie le fichier dans l'île. */
export function Satellite() {
  const [round, setRound] = useState(0);
  const [phase, setPhase] = useState<Phase>("shown");
  const hover = useFileDrop();
  // Mémorise le dernier survol : l'icône reste affichée pendant l'envol.
  const [seen, setSeen] = useState<DropHover | null>(null);

  useEffect(() => {
    const offs = [
      listen(EVENTS.satelliteShow, () => {
        setRound((r) => r + 1);
        setPhase("shown");
        setSeen(null);
      }),
      listen(EVENTS.satelliteHide, () => setPhase("leaving")),
      listen(EVENTS.satelliteDropped, () => setPhase("dropped")),
    ];
    return () => {
      offs.forEach((off) => off.then((f) => f()));
    };
  }, []);

  useEffect(() => {
    if (hover) setSeen(hover);
  }, [hover]);

  const Icon = seen ? iconForMime(seen.mime) : ArrowUp;
  const done = phase === "dropped";

  return (
    <div className="grid h-full place-items-center">
      <motion.div
        key={round}
        variants={orb}
        initial={{ scale: 0, opacity: 0, filter: "blur(8px)" }}
        animate={phase}
        transition={{ type: "spring", stiffness: 460, damping: 24 }}
        className="relative grid place-items-center"
        style={{ width: ORB + 40, height: ORB + 40 }}
      >
        {/* Ondes qui s'éloignent : « il y a quelque chose ici ». */}
        {[0, 1].map((i) => (
          <motion.span
            key={i}
            className="absolute rounded-full border border-paper/25"
            style={{ width: ORB, height: ORB }}
            initial={{ scale: 1, opacity: 0.6 }}
            animate={{ scale: 1.45, opacity: 0 }}
            transition={{ duration: 1.6, repeat: Infinity, delay: i * 0.8, ease: "easeOut" }}
          />
        ))}

        {/* Anneau lumineux en rotation. */}
        <motion.span
          className="absolute rounded-full"
          style={{
            width: ORB + 4,
            height: ORB + 4,
            background:
              "conic-gradient(from 0deg, transparent 0deg, rgba(248,247,244,0.85) 70deg, transparent 140deg, transparent 360deg)",
          }}
          animate={{ rotate: 360 }}
          transition={{ duration: 2.4, repeat: Infinity, ease: "linear" }}
        />

        <div
          className="relative grid place-items-center overflow-hidden rounded-full bg-ink shadow-[0_10px_30px_rgba(0,0,0,0.55)]"
          style={{ width: ORB, height: ORB }}
        >
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.span
              key={done ? "done" : seen ? "file" : "idle"}
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.6 }}
              className="text-paper"
            >
              {done ? (
                <Check size={26} strokeWidth={2.5} />
              ) : (
                <Icon size={26} strokeWidth={seen ? 1.6 : 2.25} />
              )}
            </motion.span>
          </AnimatePresence>
        </div>

        {seen && seen.count > 1 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute top-3 right-3 grid h-6 min-w-6 place-items-center rounded-full bg-paper px-1.5 text-[12px] font-semibold text-ink tabular-nums"
          >
            {seen.count}
          </motion.span>
        )}
      </motion.div>
    </div>
  );
}
