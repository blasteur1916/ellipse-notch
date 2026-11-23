import { useClock } from "../../hooks/useClock";
import { REST } from "../../lib/notchGeometry";

export function NotchIdle() {
  const time = useClock();

  return (
    <div
      className="flex items-center justify-center"
      style={{ width: REST.width, height: REST.height }}
    >
      <span className="font-display text-[13px] font-semibold tracking-wide text-paper tabular-nums">
        {time}
      </span>
    </div>
  );
}
