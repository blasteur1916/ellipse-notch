import { disable, enable, isEnabled } from "@tauri-apps/plugin-autostart";
import { useEffect, useState, type ReactNode } from "react";
import type { Settings } from "../../lib/ipc";
import { Toggle } from "../ui/Toggle";

const TIMER_CHOICES = [5, 10, 30, 60];

interface Props {
  settings: Settings;
  update: (patch: Partial<Settings>) => void;
}

export function SettingsPanel({ settings, update }: Props) {
  const [autostart, setAutostart] = useState(false);
  useEffect(() => {
    isEnabled().then(setAutostart).catch(() => {});
  }, []);
  const toggleAutostart = async (on: boolean) => {
    await (on ? enable() : disable()).catch(() => {});
    setAutostart(await isEnabled().catch(() => on));
  };

  return (
    <div className="no-scrollbar h-full overflow-y-auto">
      <div className="divide-y divide-line overflow-hidden rounded-[18px] bg-card">
        <Row title="Lancer au démarrage de Windows" hint="Le Notch est prêt dès l'ouverture de session.">
          <Toggle label="Lancer au démarrage de Windows" checked={autostart} onChange={toggleAutostart} />
        </Row>
        <Row
          title="Auto-supprimer les téléchargements"
          hint="Lance le minuteur dès qu'un fichier arrive. Il part dans la Corbeille."
        >
          <Toggle
            label="Auto-supprimer les téléchargements"
            checked={settings.autoDeleteDownloads}
            onChange={(autoDeleteDownloads) => update({ autoDeleteDownloads })}
          />
        </Row>
        <Row title="Durée du minuteur" hint="Utilisée par le bouton minuteur de chaque fichier.">
          <div className="flex rounded-full bg-ink p-0.5">
            {TIMER_CHOICES.map((minutes) => (
              <button
                key={minutes}
                type="button"
                onClick={() => update({ timerMinutes: minutes })}
                className={`h-7 rounded-full px-2.5 text-[12px] tabular-nums transition-colors ${
                  settings.timerMinutes === minutes
                    ? "bg-paper font-semibold text-ink"
                    : "text-muted hover:text-paper"
                }`}
              >
                {minutes} min
              </button>
            ))}
          </div>
        </Row>
        <Row
          title="Secouer pour déposer"
          hint="Secouez la souris pendant un glisser pour faire apparaître le Satellite."
        >
          <Toggle
            label="Secouer pour déposer"
            checked={settings.shakeToStash}
            onChange={(shakeToStash) => update({ shakeToStash })}
          />
        </Row>
      </div>
    </div>
  );
}

function Row({ title, hint, children }: { title: string; hint: string; children: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-6 px-4 py-3">
      <div className="min-w-0">
        <p className="text-[13.5px] font-medium text-paper">{title}</p>
        <p className="mt-0.5 text-[11.5px] text-muted">{hint}</p>
      </div>
      {children}
    </div>
  );
}
