import { AnimatePresence, motion, useSpring, useTransform } from "framer-motion";
import { useEffect, useState } from "react";
import { useFileDrop } from "../../hooks/useFileDrop";
import { useHitRegion } from "../../hooks/useHitRegion";
import { useMobileDrag } from "../../hooks/useMobile";
import { useNotchHover } from "../../hooks/useNotchHover";
import { useArrivalPeek, useStash } from "../../hooks/useStash";
import { HIT_PADDING, OPEN, PEEK, REST } from "../../lib/notchGeometry";
import { NotchExpanded } from "./NotchExpanded";
import { NotchIdle } from "./NotchIdle";
import { NotchPeek } from "./NotchPeek";
import { NotchShape } from "./NotchShape";

const SPRING = { stiffness: 320, damping: 30, mass: 0.9 };
const SIZES = { open: OPEN, peek: PEEK, rest: REST };

export function Notch() {
  const hovered = useNotchHover();
  const dropping = useFileDrop() !== null;
  const receiving = useMobileDrag();
  const items = useStash();
  const arrival = useArrivalPeek();

  const open = hovered || dropping || receiving;

  // Un aperçu déjà vu Notch ouvert ne réapparaît pas à la fermeture.
  const [seen, setSeen] = useState<string | null>(null);
  useEffect(() => {
    if (open && arrival) setSeen(arrival.id);
  }, [open, arrival]);
  const peek = arrival && arrival.id !== seen ? arrival : null;

  const state = open ? "open" : peek ? "peek" : "rest";
  const target = SIZES[state];

  const width = useSpring(REST.width, SPRING);
  const height = useSpring(REST.height, SPRING);
  const radius = useSpring(REST.radius, SPRING);
  const ear = useSpring(REST.ear, SPRING);

  useEffect(() => {
    width.set(target.width);
    height.set(target.height);
    radius.set(target.radius);
    ear.set(target.ear);
  }, [target, width, height, radius, ear]);

  useHitRegion(width, height, radius, ear, open ? HIT_PADDING.open : HIT_PADDING.rest);

  const total = useTransform(() => width.get() + ear.get() * 2);

  return (
    <motion.div className="absolute top-0 left-1/2" style={{ width: total, height, x: "-50%" }}>
      <NotchShape width={width} height={height} radius={radius} ear={ear} />

      {/* Zone de contenu = corps du Notch (hors oreilles concaves), clippée par le rayon animé. */}
      <motion.div
        className="absolute top-0 overflow-hidden"
        style={{
          left: ear,
          width,
          height,
          borderBottomLeftRadius: radius,
          borderBottomRightRadius: radius,
        }}
      >
        <AnimatePresence initial={false}>
          <motion.div
            key={state}
            className="absolute top-0 left-1/2"
            style={{ x: "-50%" }}
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1, transition: { duration: 0.22, delay: open ? 0.04 : 0.08 } }}
            exit={{ opacity: 0, scale: 0.96, transition: { duration: 0.12 } }}
          >
            {state === "open" && <NotchExpanded items={items} dropping={dropping} receiving={receiving} />}
            {state === "peek" && peek && <NotchPeek item={peek} />}
            {state === "rest" && <NotchIdle />}
          </motion.div>
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}
