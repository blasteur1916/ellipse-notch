import { startDrag } from "@crabnebula/tauri-plugin-drag";
import { stash, type StashItem } from "./ipc";

const ICON_SIZE = 96;

// Pendant un drag sortant, la page voit aussi passer des « Files » : on les
// ignore pour ne pas afficher la zone de dépôt sous notre propre carte.
let outgoing = false;

export function isDraggingOut() {
  return outgoing;
}

/**
 * Lance un drag natif Windows (OLE) du fichier vers n'importe quelle application.
 * `preview` : la miniature déjà affichée dans la carte, si c'est une image.
 */
export function dragOut(item: StashItem, preview?: HTMLImageElement | null) {
  outgoing = true;
  return startDrag(
    { item: [item.path], icon: dragIcon(item, preview), mode: "copy" },
    ({ result }) => {
      outgoing = false;
      if (result === "Dropped") stash.draggedOut(item.id);
    },
  ).catch(() => {
    outgoing = false;
  });
}

/** Aperçu du drag dessiné au canvas (PNG base64, format attendu par le plugin). */
function dragIcon(item: StashItem, preview?: HTMLImageElement | null): string {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = ICON_SIZE;
  const ctx = canvas.getContext("2d")!;

  ctx.beginPath();
  ctx.roundRect(1, 1, ICON_SIZE - 2, ICON_SIZE - 2, 18);
  ctx.fillStyle = "#141414";
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = "#27272a";
  ctx.stroke();

  if (preview?.complete && preview.naturalWidth) {
    ctx.save();
    ctx.clip();
    const scale = Math.max(ICON_SIZE / preview.naturalWidth, ICON_SIZE / preview.naturalHeight);
    const w = preview.naturalWidth * scale;
    const h = preview.naturalHeight * scale;
    ctx.drawImage(preview, (ICON_SIZE - w) / 2, (ICON_SIZE - h) / 2, w, h);
    ctx.restore();
    try {
      return canvas.toDataURL("image/png");
    } catch {
      // Canvas « tainted » (image d'une autre origine) : on retombe sur l'icône générique.
      return dragIcon(item);
    }
  }

  const label = item.isDir ? "DOSSIER" : (item.extension || "FICHIER").toUpperCase().slice(0, 6);
  ctx.fillStyle = "#f8f7f4";
  ctx.font = "600 18px 'Segoe UI Variable Display', 'Segoe UI', sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(label, ICON_SIZE / 2, ICON_SIZE / 2);
  return canvas.toDataURL("image/png");
}
