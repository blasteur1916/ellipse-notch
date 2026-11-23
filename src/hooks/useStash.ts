import { useEffect, useState } from "react";
import { stash, type StashItem } from "../lib/ipc";

export function useStash() {
  const [items, setItems] = useState<StashItem[]>([]);

  useEffect(() => {
    let alive = true;
    const unlisten = stash.onChanged(setItems);
    stash.list().then((list) => alive && setItems(list));
    return () => {
      alive = false;
      unlisten.then((off) => off());
    };
  }, []);

  return items;
}

/** Dernier élément arrivé (téléchargement ou dépôt Satellite), exposé quelques secondes. */
export function useArrivalPeek(duration = 4500) {
  const [peek, setPeek] = useState<StashItem | null>(null);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const unlisten = stash.onAdded((item) => {
      clearTimeout(timer);
      setPeek(item);
      timer = setTimeout(() => setPeek(null), duration);
    });
    return () => {
      clearTimeout(timer);
      unlisten.then((off) => off());
    };
  }, [duration]);

  return peek;
}
