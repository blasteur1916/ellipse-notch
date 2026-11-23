import Constants from "expo-constants";
import { Directory, File, Paths, UploadType } from "expo-file-system";
import * as Haptics from "expo-haptics";
import * as MediaLibrary from "expo-media-library";
import * as Sharing from "expo-sharing";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Platform } from "react-native";
import { findPc, type Endpoint } from "./discovery";
import { forgetPairing, loadPairing, savePairing, type Pairing } from "./pairing";

export type Status = "loading" | "unpaired" | "searching" | "connected";
export type Kind = "image" | "video" | "file";

export interface Outgoing {
  id: string;
  uri: string;
  name: string;
  size: number;
  mime: string;
  kind: Kind;
  width?: number;
  height?: number;
  state: "idle" | "sending" | "sent" | "error";
  progress: number;
}

export interface Incoming {
  id: string;
  name: string;
  size: number;
  kind: Kind;
  state: "new" | "saving" | "saved" | "error";
}

interface EllipseContext {
  status: Status;
  endpoint: Endpoint | null;
  outgoing: Outgoing[];
  incoming: Incoming[];
  pair(pairing: Pairing): Promise<void>;
  unpair(): Promise<void>;
  add(files: Omit<Outgoing, "id" | "state" | "progress">[]): void;
  remove(id: string): void;
  send(id: string): void;
  /** Le doigt soulève une carte (ouvre le Notch du PC) ou la relâche. */
  dragging(active: boolean): void;
  save(id: string): void;
  /** URL d'un fichier reçu (aperçu d'image). */
  incomingUrl(id: string): string | null;
}

const Context = createContext<EllipseContext | null>(null);

const RETRY_DELAY = 2500;
const IMAGE_EXT = /\.(png|jpe?g|gif|webp|heic|heif|avif|bmp)$/i;
const VIDEO_EXT = /\.(mp4|mov|m4v|webm|mkv|avi)$/i;

export function kindOf(name: string, mime = ""): Kind {
  if (mime.startsWith("image/") || IMAGE_EXT.test(name)) return "image";
  if (mime.startsWith("video/") || VIDEO_EXT.test(name)) return "video";
  return "file";
}

function deviceName() {
  const name = Constants.deviceName?.trim();
  if (name) return name.slice(0, 40);
  return Platform.OS === "ios" ? "iPhone" : "Téléphone Android";
}

let nextId = 0;
const newId = () => `${Date.now().toString(36)}-${(nextId++).toString(36)}`;

export function EllipseProvider({ children }: { children: ReactNode }) {
  const [pairing, setPairing] = useState<Pairing | null | undefined>(undefined);
  const [endpoint, setEndpoint] = useState<Endpoint | null>(null);
  const [outgoing, setOutgoing] = useState<Outgoing[]>([]);
  const [incoming, setIncoming] = useState<Incoming[]>([]);
  const socket = useRef<WebSocket | null>(null);
  // Les fichiers déjà partagés renvoyés à la (re)connexion ne sont pas annoncés.
  const openedAt = useRef(0);

  useEffect(() => {
    loadPairing().then(setPairing);
  }, []);

  // Boucle de connexion : découverte du PC, WebSocket, reprise après coupure.
  useEffect(() => {
    if (!pairing) return;
    let cancelled = false;
    let retry: ReturnType<typeof setTimeout> | undefined;

    const connect = async () => {
      const found = await findPc(pairing);
      if (cancelled) return;
      if (!found) {
        retry = setTimeout(connect, RETRY_DELAY);
        return;
      }
      if (found.transport === "wifi" && found.base !== `http://${pairing.host}:${pairing.port}`) {
        // Le PC a changé d'adresse : on retient la nouvelle.
        const host = found.base.replace(/^http:\/\//, "").split(":")[0];
        savePairing({ ...pairing, host, name: found.name });
      }
      const ws = new WebSocket(`${found.base.replace(/^http/, "ws")}/ws?t=${pairing.token}`);
      socket.current = ws;
      ws.onopen = () => {
        openedAt.current = Date.now();
        setEndpoint(found);
        ws.send(JSON.stringify({ type: "hello", device: deviceName() }));
      };
      ws.onmessage = (event) => {
        const message = JSON.parse(String(event.data)) as { type: string; id: string; name: string; size: number };
        if (message.type !== "file") return;
        setIncoming((list) =>
          list.some((f) => f.id === message.id)
            ? list
            : [{ id: message.id, name: message.name, size: message.size, kind: kindOf(message.name), state: "new" }, ...list],
        );
        if (Date.now() - openedAt.current > 1000) {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
      };
      ws.onclose = () => {
        if (socket.current === ws) socket.current = null;
        setEndpoint(null);
        if (!cancelled) retry = setTimeout(connect, RETRY_DELAY);
      };
    };

    connect();
    return () => {
      cancelled = true;
      clearTimeout(retry);
      socket.current?.close();
      socket.current = null;
    };
  }, [pairing]);

  const message = useCallback((payload: object) => {
    const ws = socket.current;
    if (ws?.readyState === WebSocket.OPEN) ws.send(JSON.stringify(payload));
  }, []);

  const patchOutgoing = useCallback((id: string, patch: Partial<Outgoing>) => {
    setOutgoing((list) => list.map((f) => (f.id === id ? { ...f, ...patch } : f)));
  }, []);

  const send = useCallback(
    async (id: string) => {
      const item = outgoing.find((f) => f.id === id);
      if (!item || !endpoint || !pairing || item.state === "sending" || item.state === "sent") return;
      patchOutgoing(id, { state: "sending", progress: 0 });
      try {
        const url = `${endpoint.base}/upload?t=${pairing.token}&name=${encodeURIComponent(item.name)}`;
        const task = new File(item.uri).createUploadTask(url, {
          httpMethod: "POST",
          uploadType: UploadType.BINARY_CONTENT,
          onProgress: ({ bytesSent, totalBytes }) =>
            patchOutgoing(id, { progress: totalBytes > 0 ? bytesSent / totalBytes : 0 }),
        });
        const result = await task.uploadAsync();
        if (result.status !== 200) throw new Error(`HTTP ${result.status}`);
        patchOutgoing(id, { state: "sent", progress: 1 });
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch {
        patchOutgoing(id, { state: "error", progress: 0 });
        message({ type: "drag_end" });
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    },
    [outgoing, endpoint, pairing, patchOutgoing, message],
  );

  const incomingUrl = useCallback(
    (id: string) => (endpoint && pairing ? `${endpoint.base}/files/${id}?t=${pairing.token}&inline=1` : null),
    [endpoint, pairing],
  );

  const save = useCallback(
    async (id: string) => {
      const item = incoming.find((f) => f.id === id);
      if (!item || !endpoint || !pairing || item.state === "saving") return;
      const patch = (state: Incoming["state"]) =>
        setIncoming((list) => list.map((f) => (f.id === id ? { ...f, state } : f)));
      patch("saving");
      try {
        const dir = new Directory(Paths.cache, "ellipse");
        if (!dir.exists) dir.create();
        const target = new File(dir, item.name);
        if (target.exists) target.delete();
        const file = await File.downloadFileAsync(`${endpoint.base}/files/${id}?t=${pairing.token}`, target);
        if (item.kind === "file") {
          await Sharing.shareAsync(file.uri);
        } else {
          const permission = await MediaLibrary.requestPermissionsAsync(true);
          if (!permission.granted) throw new Error("permission");
          await MediaLibrary.Asset.create(file.uri);
        }
        patch("saved");
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch {
        patch("error");
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    },
    [incoming, endpoint, pairing],
  );

  const value = useMemo<EllipseContext>(
    () => ({
      status:
        pairing === undefined ? "loading" : pairing === null ? "unpaired" : endpoint ? "connected" : "searching",
      endpoint,
      outgoing,
      incoming,
      pair: async (next) => {
        await savePairing(next);
        setPairing(next);
      },
      unpair: async () => {
        await forgetPairing();
        setPairing(null);
        setIncoming([]);
      },
      add: (files) =>
        setOutgoing((list) => [
          ...files.map((f) => ({ ...f, id: newId(), state: "idle" as const, progress: 0 })),
          ...list,
        ]),
      remove: (id) => setOutgoing((list) => list.filter((f) => f.id !== id)),
      send,
      dragging: (active) => message({ type: active ? "drag_start" : "drag_end" }),
      save,
      incomingUrl,
    }),
    [pairing, endpoint, outgoing, incoming, send, message, save, incomingUrl],
  );

  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export function useEllipse() {
  const ctx = useContext(Context);
  if (!ctx) throw new Error("useEllipse doit être utilisé dans <EllipseProvider>");
  return ctx;
}
