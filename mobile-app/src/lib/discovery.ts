import * as Network from "expo-network";
import { Platform } from "react-native";
import { PC_PORT, type Pairing } from "./pairing";

export type Transport = "usb" | "wifi";

export interface Endpoint {
  /** `http://hôte:port` */
  base: string;
  transport: Transport;
  name: string;
}

const PROBE_TIMEOUT = 1200;
const SCAN_CONCURRENCY = 48;

/** `/ping` ne répond qu'avec le bon jeton : on ne trouve que *son* PC. */
async function probe(host: string, port: number, token: string, timeout = PROBE_TIMEOUT) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  try {
    const res = await fetch(`http://${host}:${port}/ping?t=${token}`, { signal: controller.signal });
    if (!res.ok) return null;
    const body = (await res.json()) as { app?: string; name?: string };
    return body.app === "ellipse" ? (body.name ?? "PC") : null;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Trouve le PC appairé, du plus direct au plus lent :
 * 1. câble USB (Android : `adb reverse` côté PC expose le serveur sur 127.0.0.1) ;
 * 2. dernière adresse Wi-Fi connue ;
 * 3. balayage du sous-réseau Wi-Fi du téléphone (l'IP du PC a pu changer).
 */
export async function findPc(pairing: Pairing): Promise<Endpoint | null> {
  if (Platform.OS === "android") {
    const name = await probe("127.0.0.1", PC_PORT, pairing.token, 600);
    if (name) return { base: `http://127.0.0.1:${PC_PORT}`, transport: "usb", name };
  }

  const known = await probe(pairing.host, pairing.port, pairing.token);
  if (known) return { base: `http://${pairing.host}:${pairing.port}`, transport: "wifi", name: known };

  const ip = await Network.getIpAddressAsync().catch(() => "0.0.0.0");
  const prefix = ip.split(".").slice(0, 3).join(".");
  if (!prefix || ip === "0.0.0.0") return null;

  const hosts = Array.from({ length: 254 }, (_, i) => `${prefix}.${i + 1}`).filter((h) => h !== ip);
  let found: Endpoint | null = null;
  for (let i = 0; i < hosts.length && !found; i += SCAN_CONCURRENCY) {
    const batch = hosts.slice(i, i + SCAN_CONCURRENCY);
    const results = await Promise.all(batch.map((h) => probe(h, PC_PORT, pairing.token, 900)));
    const hit = results.findIndex(Boolean);
    if (hit >= 0) {
      found = { base: `http://${batch[hit]}:${PC_PORT}`, transport: "wifi", name: results[hit]! };
    }
  }
  return found;
}
