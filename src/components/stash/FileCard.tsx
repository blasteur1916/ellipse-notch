import { motion } from "framer-motion";
import { ArrowUpRight, Smartphone, Timer, X, type LucideIcon } from "lucide-react";
import { useRef, type PointerEvent } from "react";
import { usePreview } from "../../hooks/usePreview";
import { dragOut } from "../../lib/dragOut";
import { fileIcon, formatAge, formatCountdown, formatSize } from "../../lib/files";
import { mobile, stash, type AutoDeleteRequest, type StashItem } from "../../lib/ipc";

const DRAG_THRESHOLD = 5;

/** Cycle du bouton : désactivé → minuteur → après glisser → désactivé. */
const NEXT_MODE: Record<StashItem["autoDelete"]["kind"], AutoDeleteRequest> = {
  off: { kind: "timer" },
  timer: { kind: "afterDragOut" },
  afterDragOut: { kind: "off" },
};

const MODE_LABEL: Record<StashItem["autoDelete"]["kind"], string> = {
  off: "Auto-supprimer : désactivé",
  timer: "Auto-supprimer : minuteur",
  afterDragOut: "Auto-supprimer : après glisser",
};

interface Props {
  item: StashItem;
  now: number;
  canSend: boolean;
}

export function FileCard({ item, now, canSend }: Props) {
  const preview = usePreview(item);
  const image = useRef<HTMLImageElement>(null);
  const press = useRef<{ x: number; y: number } | null>(null);
  const Icon = fileIcon(item);
  const mode = item.autoDelete;

  const onPointerDown = (e: PointerEvent) => {
    if (e.button === 0) press.current = { x: e.clientX, y: e.clientY };
  };
  const onPointerMove = (e: PointerEvent) => {
    const start = press.current;
    if (!start || Math.hypot(e.clientX - start.x, e.clientY - start.y) < DRAG_THRESHOLD) return;
    press.current = null;
    dragOut(item, image.current);
  };
  const release = () => {
    press.current = null;
  };

  const countdown =
    mode.kind === "timer"
      ? formatCountdown(mode.expiresAt - now)
      : mode.kind === "afterDragOut"
        ? "Après glisser"
        : null;
  const meta =
    countdown ??
    (item.isDir
      ? formatAge(now - item.addedAt)
      : `${formatSize(item.size)} · ${formatAge(now - item.addedAt)}`);

  return (
    <motion.article
      initial={{ opacity: 0, y: 8, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.15 } }}
      transition={{ type: "spring", stiffness: 420, damping: 34 }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={release}
      onPointerLeave={release}
      aria-label={item.name}
      className="group relative mb-3 cursor-grab break-inside-avoid overflow-hidden rounded-[18px] bg-card transition-colors duration-150 hover:bg-card-hover active:cursor-grabbing"
    >
      {preview === undefined && <div className="h-24 animate-pulse bg-card-hover" />}

      {/* Image / vidéo : la miniature seule, bord à bord, sans légende. */}
      {preview?.kind === "image" && (
        <>
          <img
            ref={image}
            src={preview.src}
            alt=""
            draggable={false}
            className="block max-h-[220px] w-full object-cover"
            style={{ aspectRatio: `${preview.width} / ${preview.height}` }}
          />
          {countdown && (
            <span className="absolute bottom-2 left-2 rounded-full bg-ink/80 px-2 py-0.5 text-[11px] text-paper tabular-nums backdrop-blur-md">
              {countdown}
            </span>
          )}
        </>
      )}

      {preview?.kind === "text" && (
        <TextBody text={preview.text} meta={meta} name={item.name} highlight={countdown !== null} />
      )}

      {preview?.kind === "none" && (
        <div className="px-4 pt-3.5">
          <Icon size={20} strokeWidth={1.6} className="text-muted" />
          <p className="mt-2 line-clamp-3 font-display text-[15px] leading-[1.32] font-semibold break-words text-paper">
            {item.name}
          </p>
          <Meta text={meta} highlight={countdown !== null} />
        </div>
      )}

      <div className="absolute top-2 right-2 flex gap-1 opacity-0 transition-opacity duration-150 group-hover:opacity-100">
        {canSend && !item.isDir && (
          <CardButton
            icon={Smartphone}
            label="Envoyer au téléphone"
            onClick={() => mobile.send([item.path])}
          />
        )}
        <CardButton
          icon={mode.kind === "afterDragOut" ? ArrowUpRight : Timer}
          label={MODE_LABEL[mode.kind]}
          active={mode.kind !== "off"}
          onClick={() => stash.setAutoDelete(item.id, NEXT_MODE[mode.kind])}
        />
        <CardButton icon={X} label="Retirer du Stash" onClick={() => stash.remove(item.id)} />
      </div>
    </motion.article>
  );
}

function TextBody({ text, meta, name, highlight }: { text: string; meta: string; name: string; highlight: boolean }) {
  return (
    <div className="px-4 pt-3.5">
      <p className="line-clamp-4 font-display text-[15px] leading-[1.32] font-semibold break-words text-paper">
        {text}
      </p>
      <p className="mt-2 truncate text-[12.5px] font-medium text-paper/90">{name}</p>
      <Meta text={meta} highlight={highlight} tight />
    </div>
  );
}

function Meta({ text, highlight, tight = false }: { text: string; highlight: boolean; tight?: boolean }) {
  return (
    <p
      className={`${tight ? "mt-0.5" : "mt-1.5"} pb-3.5 text-[12px] tabular-nums ${
        highlight ? "text-paper" : "text-muted"
      }`}
    >
      {text}
    </p>
  );
}

interface CardButtonProps {
  icon: LucideIcon;
  label: string;
  active?: boolean;
  onClick: () => void;
}

function CardButton({ icon: Icon, label, active = false, onClick }: CardButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      onPointerDown={(e) => e.stopPropagation()}
      onClick={onClick}
      className={`grid size-6 place-items-center rounded-full backdrop-blur-md transition-colors ${
        active ? "bg-paper text-ink" : "bg-ink/75 text-paper hover:bg-ink"
      }`}
    >
      <Icon size={12} strokeWidth={2.5} />
    </button>
  );
}
