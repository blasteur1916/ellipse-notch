import { ArrowDownToLine, Layers, Smartphone, type LucideIcon } from "lucide-react";
import { usePreview } from "../../hooks/usePreview";
import { fileIcon, formatSize } from "../../lib/files";
import type { StashItem } from "../../lib/ipc";
import { PEEK } from "../../lib/notchGeometry";

const ARRIVAL: Record<StashItem["source"], [LucideIcon, string]> = {
  download: [ArrowDownToLine, "Téléchargement terminé"],
  dropped: [Layers, "Ajouté au Stash"],
  mobile: [Smartphone, "Reçu du téléphone"],
};

/** Carte d'aperçu affichée brièvement à l'arrivée d'un fichier. */
export function NotchPeek({ item }: { item: StashItem }) {
  const preview = usePreview(item);
  const Icon = fileIcon(item);
  const [LabelIcon, label] = ARRIVAL[item.source];

  return (
    <div
      className="flex items-center gap-3.5 px-5 pt-1 pb-3"
      style={{ width: PEEK.width, height: PEEK.height }}
    >
      <div className="grid h-[84px] w-[120px] shrink-0 place-items-center overflow-hidden rounded-[14px] bg-card">
        {preview?.kind === "image" && (
          <img src={preview.src} alt="" draggable={false} className="size-full object-cover" />
        )}
        {preview?.kind === "text" && (
          <p className="line-clamp-5 self-start p-2.5 text-[10px] leading-[1.35] font-medium text-paper/90">
            {preview.text}
          </p>
        )}
        {preview?.kind === "none" && <Icon size={26} strokeWidth={1.4} className="text-muted" />}
        {preview === undefined && <div className="size-full animate-pulse bg-card-hover" />}
      </div>

      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-1.5 text-[11.5px] text-muted">
          <LabelIcon size={12} strokeWidth={2.25} />
          {label}
        </p>
        <p className="mt-1 line-clamp-2 font-display text-[15px] leading-tight font-semibold break-words text-paper">
          {item.name}
        </p>
        {!item.isDir && (
          <p className="mt-1 text-[12px] text-muted tabular-nums">
            {formatSize(item.size)}
            {item.extension && ` · ${item.extension.toUpperCase()}`}
          </p>
        )}
      </div>
    </div>
  );
}
