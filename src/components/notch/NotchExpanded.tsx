import { AnimatePresence, motion } from "framer-motion";
import { ArrowDownToLine, Layers, Pause, Play, Settings2, Smartphone, Trash2, type LucideIcon } from "lucide-react";
import { useMemo, useState } from "react";
import { useMobile } from "../../hooks/useMobile";
import { useSettings } from "../../hooks/useSettings";
import { stash, type StashItem } from "../../lib/ipc";
import { OPEN } from "../../lib/notchGeometry";
import { StashGrid } from "../stash/StashGrid";
import { MobilePanel } from "./MobilePanel";
import { SettingsPanel } from "./SettingsPanel";

type View = "stash" | "mobile" | "settings";

const enter = { type: "spring", stiffness: 420, damping: 34 } as const;

interface Props {
  items: StashItem[];
  dropping: boolean;
  /** Le téléphone est en train d'envoyer un fichier vers le PC. */
  receiving: boolean;
}

export function NotchExpanded({ items, dropping, receiving }: Props) {
  const [view, setView] = useState<View>("stash");
  const [query, setQuery] = useState("");
  const [settings, updateSettings] = useSettings();
  const mobile = useMobile();

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? items.filter((i) => i.name.toLowerCase().includes(q)) : items;
  }, [items, query]);

  const paused = settings?.paused ?? false;

  return (
    <div className="flex flex-col px-7 pt-4" style={{ width: OPEN.width, height: OPEN.height }}>
      <motion.header
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...enter, delay: 0.05 }}
        className="flex h-11 shrink-0 items-center gap-3"
      >
        <input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setView("stash");
          }}
          placeholder="Rechercher"
          spellCheck={false}
          className="h-full min-w-0 flex-1 rounded-[14px] bg-card px-4 text-[15px] text-paper outline-none placeholder:text-muted focus:bg-card-hover"
        />
        <div className="flex items-center gap-1">
          <HeaderButton
            icon={paused ? Play : Pause}
            label={paused ? "Reprendre la détection des téléchargements" : "Mettre en pause la détection des téléchargements"}
            active={paused}
            onClick={() => updateSettings({ paused: !paused })}
          />
          <HeaderButton
            icon={Trash2}
            label="Vider le Stash (les fichiers restent sur le disque)"
            disabled={items.length === 0}
            onClick={() => stash.clear()}
          />
          <HeaderButton
            icon={Settings2}
            label="Réglages"
            active={view === "settings"}
            onClick={() => setView(view === "settings" ? "stash" : "settings")}
          />
        </div>
      </motion.header>

      <div className="relative mt-4 flex min-h-0 flex-1 gap-4">
        <div className="relative min-w-0 flex-1">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={view}
              initial={{ opacity: 0, y: 10, filter: "blur(4px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: -6, filter: "blur(4px)", transition: { duration: 0.12 } }}
              transition={{ ...enter, delay: 0.08 }}
              className="h-full"
            >
              {view === "stash" && (
                <StashGrid items={visible} filtered={query.trim() !== ""} canSend={mobile.connected} />
              )}
              {view === "mobile" && <MobilePanel mobile={mobile} />}
              {view === "settings" && settings && (
                <SettingsPanel settings={settings} update={updateSettings} />
              )}
            </motion.div>
          </AnimatePresence>

          <AnimatePresence>
            {dropping && view !== "mobile" && (
              <motion.div
                key="drop"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.16 }}
                className="absolute inset-0 mb-4 flex gap-3 rounded-[20px] bg-ink/85 backdrop-blur-sm"
              >
                <DropZone
                  target="stash"
                  icon={Layers}
                  title="Ajouter au Stash"
                  hint="Le fichier reste à son emplacement d'origine"
                />
                {mobile.connected && (
                  <DropZone
                    target="mobile"
                    icon={Smartphone}
                    title={`Envoyer sur ${mobile.devices[0]}`}
                    hint="Il apparaît aussitôt sur le téléphone"
                  />
                )}
              </motion.div>
            )}
            {receiving && !dropping && (
              <motion.div
                key="receiving"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.16 }}
                className="absolute inset-0 mb-4 flex flex-col items-center justify-center gap-2 rounded-[20px] border border-paper/30 bg-ink/85 backdrop-blur-sm"
              >
                <motion.span
                  animate={{ y: [0, 5, 0] }}
                  transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
                  className="grid size-11 place-items-center rounded-full bg-paper text-ink"
                >
                  <ArrowDownToLine size={18} strokeWidth={2.25} />
                </motion.span>
                <p className="mt-1 font-display text-[15px] font-semibold text-paper">
                  {mobile.devices[0] ?? "Le téléphone"} envoie un fichier
                </p>
                <p className="text-[12px] text-muted">Relâchez-le sur l'île du téléphone</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <motion.nav
          initial={{ opacity: 0, x: 6 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ ...enter, delay: 0.12 }}
          className="flex w-9 shrink-0 flex-col items-center justify-center gap-2 pb-6"
        >
          <RailButton
            icon={Layers}
            label="Stash"
            active={view === "stash"}
            onClick={() => setView("stash")}
          />
          <RailButton
            icon={Smartphone}
            label={mobile.connected ? `Téléphone : ${mobile.devices[0]}` : "Appairer un téléphone"}
            active={view === "mobile"}
            badge={mobile.connected}
            onClick={() => setView("mobile")}
          />
        </motion.nav>
      </div>
    </div>
  );
}

interface ButtonProps {
  icon: LucideIcon;
  label: string;
  active?: boolean;
  disabled?: boolean;
  badge?: boolean;
  onClick: () => void;
}

interface DropZoneProps {
  target: string;
  icon: LucideIcon;
  title: string;
  hint: string;
}

/** Zone de dépôt : `data-drop-target` indique à Rust où envoyer les fichiers. */
function DropZone({ target, icon: Icon, title, hint }: DropZoneProps) {
  return (
    <div
      data-drop-target={target}
      className="group/zone flex flex-1 flex-col items-center justify-center gap-2 rounded-[20px] border border-dashed border-paper/35 text-center transition-colors duration-150 hover:border-paper/70 hover:bg-paper/[0.04]"
    >
      <span className="grid size-11 place-items-center rounded-full bg-card text-paper transition-colors group-hover/zone:bg-paper group-hover/zone:text-ink">
        <Icon size={18} strokeWidth={2} />
      </span>
      <p className="mt-1 font-display text-[15px] font-semibold text-paper">{title}</p>
      <p className="text-[12px] text-muted">{hint}</p>
    </div>
  );
}

function HeaderButton({ icon: Icon, label, active = false, disabled = false, onClick }: ButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={active}
      disabled={disabled}
      onClick={onClick}
      className={`grid size-10 place-items-center rounded-xl transition-colors disabled:opacity-35 ${
        active ? "bg-paper text-ink" : "text-paper enabled:hover:bg-card"
      }`}
    >
      <Icon size={19} strokeWidth={2.1} fill={Icon === Pause || Icon === Play ? "currentColor" : "none"} />
    </button>
  );
}

function RailButton({ icon: Icon, label, active = false, badge = false, onClick }: ButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={active}
      onClick={onClick}
      className={`relative grid size-9 place-items-center rounded-full transition-colors ${
        active ? "bg-card text-paper" : "text-muted hover:text-paper"
      }`}
    >
      <Icon size={16} strokeWidth={2} />
      {badge && (
        <span className="absolute top-1.5 right-1.5 size-2 rounded-full bg-paper ring-2 ring-ink" />
      )}
    </button>
  );
}
