import { useEffect, useState } from "react";

const format = (d: Date) =>
  d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });

/** Heure HH:MM, rafraîchie pile au changement de minute. */
export function useClock() {
  const [time, setTime] = useState(() => format(new Date()));

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const tick = () => {
      const now = new Date();
      setTime(format(now));
      timer = setTimeout(tick, 60_000 - (now.getSeconds() * 1000 + now.getMilliseconds()));
    };
    tick();
    return () => clearTimeout(timer);
  }, []);

  return time;
}
