import AsyncStorage from "@react-native-async-storage/async-storage";

/** Port fixe du serveur Ellipse sur le PC (voir src-tauri/src/mobile/server.rs). */
export const PC_PORT = 47821;

export interface Pairing {
  token: string;
  /** Dernière adresse Wi-Fi connue du PC (peut changer : on la redécouvre au besoin). */
  host: string;
  port: number;
  /** Nom du PC, renvoyé par `/ping`. */
  name?: string;
}

const KEY = "ellipse.pairing";

/** Lit l'URL du QR code affiché par le Notch : `http://<ip>:<port>/?t=<jeton>`. */
export function parsePairingUrl(data: string): Pairing | null {
  const match = data.trim().match(/^https?:\/\/([^/:?#]+)(?::(\d+))?\/?\?(?:.*&)?t=([0-9a-f]{16,})/i);
  if (!match) return null;
  return { host: match[1], port: match[2] ? Number(match[2]) : PC_PORT, token: match[3] };
}

export async function loadPairing(): Promise<Pairing | null> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Pairing) : null;
  } catch {
    return null;
  }
}

export async function savePairing(pairing: Pairing) {
  await AsyncStorage.setItem(KEY, JSON.stringify(pairing));
}

export async function forgetPairing() {
  await AsyncStorage.removeItem(KEY);
}
