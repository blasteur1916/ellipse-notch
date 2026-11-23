import { useEffect, useState } from "react";
import { onHover } from "../lib/ipc";

/**
 * Le survol est détecté côté Rust (polling du curseur global) car la fenêtre
 * ignore les événements souris tant que le curseur est hors du Notch :
 * le WebView ne reçoit alors ni mouseenter ni mouseleave fiables.
 *
 * Petits délais asymétriques : ouverture quasi immédiate, fermeture tolérante
 * pour qu'un léger dépassement du curseur ne referme pas le panneau.
 */
export function useNotchHover(openDelay = 40, closeDelay = 220) {
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const unlisten = onHover((inside) => {
      clearTimeout(timer);
      timer = setTimeout(() => setHovered(inside), inside ? openDelay : closeDelay);
    });
    return () => {
      clearTimeout(timer);
      unlisten.then((off) => off());
    };
  }, [openDelay, closeDelay]);

  return hovered;
}
