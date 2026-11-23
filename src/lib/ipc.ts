import { invoke } from "@tauri-apps/api/core";
import { listen, type UnlistenFn } from "@tauri-apps/api/event";

/** Rectangle en pixels CSS, relatif au coin haut-gauche de la fenêtre. */
export interface CssRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export type AutoDelete =
  | { kind: "off" }
  | { kind: "timer"; minutes: number; expiresAt: number }
  | { kind: "afterDragOut" };

export type AutoDeleteRequest =
  | { kind: "off" }
  | { kind: "timer"; minutes?: number }
  | { kind: "afterDragOut" };

export interface StashItem {
  id: string;
  path: string;
  name: string;
  extension: string;
  isDir: boolean;
  size: number;
  source: "download" | "dropped" | "mobile";
  addedAt: number;
  autoDelete: AutoDelete;
}

export type Preview =
  | { kind: "image"; src: string; width: number; height: number }
  | { kind: "text"; text: string }
  | { kind: "none" };

export interface Settings {
  timerMinutes: number;
  autoDeleteDownloads: boolean;
  paused: boolean;
  shakeToStash: boolean;
}

export interface MobileStatus {
  url: string | null;
  qr: string | null;
  devices: string[];
}

export const EVENTS = {
  /** Émis par Rust quand le curseur entre (true) ou sort (false) de la zone du Notch. */
  hover: "notch://hover",
  /** Liste complète du Stash après chaque modification. */
  stashChanged: "stash://changed",
  /** Un élément vient d'être ajouté (téléchargement ou dépôt). */
  stashAdded: "stash://added",
  settingsChanged: "settings://changed",
  satelliteShow: "satellite://show",
  satelliteHide: "satellite://hide",
  satelliteDropped: "satellite://dropped",
  mobileStatus: "mobile://status",
  /** Le téléphone soulève une carte vers son île (true) ou l'a relâchée (false). */
  mobileDrag: "mobile://drag",
} as const;

/** Forme du Notch en pixels CSS : `x` est le bord gauche des oreilles concaves. */
export interface NotchShape {
  x: number;
  width: number;
  height: number;
  radius: number;
  ear: number;
}

export function setHitRegion(rect: CssRect, shape: NotchShape): Promise<void> {
  return invoke("set_hit_region", { rect, shape });
}

export function onHover(cb: (inside: boolean) => void): Promise<UnlistenFn> {
  return listen<boolean>(EVENTS.hover, (e) => cb(e.payload));
}

export const stash = {
  list: () => invoke<StashItem[]>("stash_list"),
  remove: (id: string) => invoke<void>("stash_remove", { id }),
  clear: () => invoke<void>("stash_clear"),
  setAutoDelete: (id: string, mode: AutoDeleteRequest) =>
    invoke<void>("stash_set_auto_delete", { id, mode }),
  draggedOut: (id: string) => invoke<void>("stash_dragged_out", { id }),
  preview: (path: string) => invoke<Preview>("stash_preview", { path }),
  onChanged: (cb: (items: StashItem[]) => void) =>
    listen<StashItem[]>(EVENTS.stashChanged, (e) => cb(e.payload)),
  onAdded: (cb: (item: StashItem) => void) =>
    listen<StashItem>(EVENTS.stashAdded, (e) => cb(e.payload)),
};

export const settings = {
  get: () => invoke<Settings>("settings_get"),
  set: (value: Settings) => invoke<void>("settings_set", { settings: value }),
  onChanged: (cb: (value: Settings) => void) =>
    listen<Settings>(EVENTS.settingsChanged, (e) => cb(e.payload)),
};

export const mobile = {
  status: () => invoke<MobileStatus>("mobile_status"),
  send: (paths: string[]) => invoke<void>("mobile_send", { paths }),
  onStatus: (cb: (status: MobileStatus) => void) =>
    listen<MobileStatus>(EVENTS.mobileStatus, (e) => cb(e.payload)),
  onDrag: (cb: (active: boolean) => void) =>
    listen<boolean>(EVENTS.mobileDrag, (e) => cb(e.payload)),
};
