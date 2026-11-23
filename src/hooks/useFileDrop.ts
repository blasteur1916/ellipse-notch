import { useEffect, useState } from "react";
import { isDraggingOut } from "../lib/dragOut";

declare global {
  interface Window {
    chrome?: {
      webview?: {
        postMessageWithAdditionalObjects(message: string, objects: FileList): void;
      };
    };
  }
}

export interface DropHover {
  count: number;
  /** Type MIME du premier fichier (les noms ne sont connus qu'au dépôt). */
  mime: string;
}

const MESSAGE_PREFIX = "ellipse-drop:";

/**
 * Glisser-déposer de fichiers depuis Windows (Explorateur, navigateur…).
 *
 * Le drop est reçu par WebView2 en HTML5 ; les `File` sont transmis à Rust via
 * `postMessageWithAdditionalObjects`, qui en lit les vrais chemins (voir
 * `src-tauri/src/drop.rs`). La cible est le `data-drop-target` le plus proche
 * de l'élément survolé, `stash` par défaut.
 */
export function useFileDrop() {
  const [hover, setHover] = useState<DropHover | null>(null);

  useEffect(() => {
    let depth = 0;
    const accepts = (e: DragEvent) =>
      !isDraggingOut() && (e.dataTransfer?.types.includes("Files") ?? false);

    const onEnter = (e: DragEvent) => {
      if (!accepts(e)) return;
      e.preventDefault();
      depth++;
      const items = e.dataTransfer!.items;
      setHover({ count: items.length, mime: items[0]?.type ?? "" });
    };
    const onOver = (e: DragEvent) => {
      if (!accepts(e)) return;
      e.preventDefault();
      e.dataTransfer!.dropEffect = "copy";
    };
    const onLeave = (e: DragEvent) => {
      if (!accepts(e)) return;
      depth = Math.max(0, depth - 1);
      if (depth === 0) setHover(null);
    };
    const onDrop = (e: DragEvent) => {
      if (!accepts(e)) return;
      e.preventDefault();
      depth = 0;
      setHover(null);
      const zone = (e.target as Element | null)?.closest<HTMLElement>("[data-drop-target]");
      const target = zone?.dataset.dropTarget ?? "stash";
      window.chrome?.webview?.postMessageWithAdditionalObjects(
        MESSAGE_PREFIX + target,
        e.dataTransfer!.files,
      );
    };

    window.addEventListener("dragenter", onEnter);
    window.addEventListener("dragover", onOver);
    window.addEventListener("dragleave", onLeave);
    window.addEventListener("drop", onDrop);
    return () => {
      window.removeEventListener("dragenter", onEnter);
      window.removeEventListener("dragover", onOver);
      window.removeEventListener("dragleave", onLeave);
      window.removeEventListener("drop", onDrop);
    };
  }, []);

  return hover;
}
