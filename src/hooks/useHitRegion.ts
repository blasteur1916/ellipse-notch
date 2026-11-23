import { useEffect } from "react";
import type { MotionValue } from "framer-motion";
import { setHitRegion } from "../lib/ipc";

/**
 * Envoie à Rust, au plus une fois par frame :
 * - la forme exacte du Notch, qui découpe la fenêtre (rien n'est affiché ni
 *   cliquable en dehors) ;
 * - le rectangle de survol, un peu plus large, qui ouvre et ferme le Notch.
 */
export function useHitRegion(
  width: MotionValue<number>,
  height: MotionValue<number>,
  radius: MotionValue<number>,
  ear: MotionValue<number>,
  padding: { x: number; bottom: number },
) {
  const { x: padX, bottom: padBottom } = padding;
  useEffect(() => {
    let frame = 0;

    const push = () => {
      frame = 0;
      const e = ear.get();
      const total = width.get() + e * 2;
      const left = (window.innerWidth - total) / 2;
      setHitRegion(
        { x: left - padX, y: 0, width: total + padX * 2, height: height.get() + padBottom },
        { x: left, width: width.get(), height: height.get(), radius: radius.get(), ear: e },
      );
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(push);
    };

    push();
    const offs = [width, height, radius, ear].map((v) => v.on("change", schedule));
    window.addEventListener("resize", schedule);
    return () => {
      offs.forEach((off) => off());
      window.removeEventListener("resize", schedule);
      cancelAnimationFrame(frame);
    };
  }, [width, height, radius, ear, padX, padBottom]);
}
