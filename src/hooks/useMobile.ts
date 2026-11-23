import { useEffect, useState } from "react";
import { mobile, type MobileStatus } from "../lib/ipc";

const OFFLINE: MobileStatus = { url: null, qr: null, devices: [] };

export function useMobile() {
  const [status, setStatus] = useState<MobileStatus>(OFFLINE);

  useEffect(() => {
    let alive = true;
    const unlisten = mobile.onStatus(setStatus);
    mobile.status().then((s) => alive && setStatus(s));
    return () => {
      alive = false;
      unlisten.then((off) => off());
    };
  }, []);

  return { ...status, connected: status.devices.length > 0 };
}

/** Vrai tant que le téléphone fait glisser un fichier vers son île. */
export function useMobileDrag() {
  const [active, setActive] = useState(false);

  useEffect(() => {
    const unlisten = mobile.onDrag(setActive);
    return () => {
      unlisten.then((off) => off());
    };
  }, []);

  return active;
}
