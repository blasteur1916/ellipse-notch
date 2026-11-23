import { AnimatePresence } from "framer-motion";
import { ArrowDownToLine, SearchX } from "lucide-react";
import { useNow } from "../../hooks/useNow";
import type { StashItem } from "../../lib/ipc";
import { FileCard } from "./FileCard";

interface Props {
  items: StashItem[];
  filtered: boolean;
  /** Un téléphone est connecté : chaque carte propose l'envoi. */
  canSend: boolean;
}

export function StashGrid({ items, filtered, canSend }: Props) {
  // Seconde par seconde si un minuteur tourne, sinon simple rafraîchissement des « il y a … ».
  const hasTimer = items.some((i) => i.autoDelete.kind === "timer");
  const now = useNow(items.length > 0, hasTimer ? 1000 : 30_000);

  if (items.length === 0) {
    const Icon = filtered ? SearchX : ArrowDownToLine;
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
        <span className="grid size-11 place-items-center rounded-full bg-card">
          <Icon size={18} strokeWidth={1.75} className="text-paper" />
        </span>
        <p className="mt-1 font-display text-[15px] font-semibold text-paper">
          {filtered ? "Aucun résultat" : "Glissez des fichiers ici"}
        </p>
        <p className="text-[12px] text-muted">
          {filtered
            ? "Essayez un autre nom de fichier"
            : "Vos téléchargements apparaîtront automatiquement"}
        </p>
      </div>
    );
  }

  return (
    <div className="no-scrollbar fade-bottom h-full overflow-y-auto pb-6">
      <div className="columns-3 gap-3">
        <AnimatePresence initial={false}>
          {items.map((item) => (
            <FileCard key={item.id} item={item} now={now} canSend={canSend} />
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
