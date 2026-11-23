import { motion, useTransform, type MotionValue } from "framer-motion";
import { fillPath, strokePath } from "../../lib/notchGeometry";

interface Props {
  width: MotionValue<number>;
  height: MotionValue<number>;
  radius: MotionValue<number>;
  ear: MotionValue<number>;
}

/** Silhouette SVG recalculée à chaque frame à partir des springs (aucun re-render React). */
export function NotchShape({ width, height, radius, ear }: Props) {
  const fill = useTransform(() => fillPath(width.get(), height.get(), radius.get(), ear.get()));
  const stroke = useTransform(() =>
    strokePath(width.get(), height.get(), radius.get(), ear.get()),
  );
  const total = useTransform(() => width.get() + ear.get() * 2);

  return (
    <motion.svg
      className="pointer-events-none absolute top-0 left-0 overflow-visible"
      style={{ width: total, height }}
    >
      <motion.path d={fill} fill="var(--color-ink)" />
      <motion.path
        d={stroke}
        fill="none"
        stroke="var(--color-line)"
        strokeWidth={1}
        vectorEffect="non-scaling-stroke"
      />
    </motion.svg>
  );
}
