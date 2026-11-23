import { useEffect, useState } from "react";
import { stash, type Preview, type StashItem } from "../lib/ipc";

// Partagé entre la grille et le peek : chaque aperçu n'est généré qu'une fois.
const cache = new Map<string, Promise<Preview>>();

function load(item: StashItem) {
  const key = `${item.path}:${item.size}`;
  let pending = cache.get(key);
  if (!pending) {
    pending = item.isDir ? Promise.resolve({ kind: "none" }) : stash.preview(item.path);
    pending = pending.catch((): Preview => ({ kind: "none" }));
    cache.set(key, pending);
  }
  return pending;
}

/** `undefined` tant que l'aperçu est en cours de génération. */
export function usePreview(item: StashItem) {
  const [preview, setPreview] = useState<Preview>();

  useEffect(() => {
    let alive = true;
    load(item).then((p) => alive && setPreview(p));
    return () => {
      alive = false;
    };
  }, [item.path, item.size, item.isDir]);

  return preview;
}
