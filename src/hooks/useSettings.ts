import { useCallback, useEffect, useState } from "react";
import { settings as api, type Settings } from "../lib/ipc";

export function useSettings() {
  const [value, setValue] = useState<Settings | null>(null);

  useEffect(() => {
    let alive = true;
    const unlisten = api.onChanged(setValue);
    api.get().then((s) => alive && setValue(s));
    return () => {
      alive = false;
      unlisten.then((off) => off());
    };
  }, []);

  const update = useCallback(
    (patch: Partial<Settings>) => {
      if (value) api.set({ ...value, ...patch });
    },
    [value],
  );

  return [value, update] as const;
}
