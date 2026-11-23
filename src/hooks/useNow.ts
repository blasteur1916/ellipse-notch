import { useEffect, useState } from "react";

/** Horloge locale pour les comptes à rebours ; ne tourne que si `active`. */
export function useNow(active: boolean, interval = 1000) {
  const [now, setNow] = useState(Date.now);

  useEffect(() => {
    if (!active) return;
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), interval);
    return () => clearInterval(id);
  }, [active, interval]);

  return now;
}
