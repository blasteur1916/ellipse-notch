import {
  File,
  FileArchive,
  FileAudio,
  FileCode,
  FileImage,
  FileSpreadsheet,
  FileText,
  FileVideo,
  Folder,
  type LucideIcon,
} from "lucide-react";
import type { StashItem } from "./ipc";

const IMAGE_PREVIEW = new Set(["png", "jpg", "jpeg", "gif", "webp", "bmp", "avif", "svg", "ico"]);

const CATEGORIES: [LucideIcon, string[]][] = [
  [FileImage, [...IMAGE_PREVIEW, "heic", "tif", "tiff", "psd", "raw"]],
  [FileVideo, ["mp4", "mov", "mkv", "avi", "webm", "m4v"]],
  [FileAudio, ["mp3", "wav", "flac", "aac", "ogg", "m4a"]],
  [FileArchive, ["zip", "rar", "7z", "tar", "gz", "iso", "dmg"]],
  [FileSpreadsheet, ["xls", "xlsx", "csv", "ods", "numbers"]],
  [FileCode, ["js", "ts", "tsx", "json", "html", "css", "rs", "py", "sh", "xml", "yml", "yaml"]],
  [FileText, ["pdf", "txt", "md", "doc", "docx", "rtf", "odt", "pages", "ppt", "pptx", "key"]],
];

export function fileIcon(item: StashItem): LucideIcon {
  return iconFor(item.extension, item.isDir);
}

export function iconFor(extension: string, isDir = false): LucideIcon {
  if (isDir) return Folder;
  return CATEGORIES.find(([, exts]) => exts.includes(extension))?.[0] ?? File;
}

/** Icône d'après un type MIME (seule info disponible pendant le survol). */
export function iconForMime(mime: string): LucideIcon {
  if (mime.startsWith("image/")) return FileImage;
  if (mime.startsWith("video/")) return FileVideo;
  if (mime.startsWith("audio/")) return FileAudio;
  if (mime.includes("zip") || mime.includes("compressed")) return FileArchive;
  if (mime.startsWith("text/") || mime.includes("pdf") || mime.includes("document")) return FileText;
  return File;
}

export function extensionOf(path: string) {
  const name = path.split(/[\\/]/).pop() ?? "";
  const dot = name.lastIndexOf(".");
  return dot > 0 ? name.slice(dot + 1).toLowerCase() : "";
}

const UNITS = ["o", "Ko", "Mo", "Go", "To"];

export function formatSize(bytes: number) {
  let value = bytes;
  let unit = 0;
  while (value >= 1024 && unit < UNITS.length - 1) {
    value /= 1024;
    unit++;
  }
  const digits = unit === 0 || value >= 10 ? 0 : 1;
  return `${value.toFixed(digits).replace(".", ",")} ${UNITS[unit]}`;
}

export function formatCountdown(ms: number) {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function formatAge(ms: number) {
  const min = Math.floor(ms / 60_000);
  if (min < 1) return "à l'instant";
  if (min < 60) return `il y a ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `il y a ${h} h`;
  return `il y a ${Math.floor(h / 24)} j`;
}
