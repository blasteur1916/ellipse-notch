import { ArrowDownToLine, Smartphone, Wifi } from "lucide-react";
import type { useMobile } from "../../hooks/useMobile";

type Mobile = ReturnType<typeof useMobile>;

export function MobilePanel({ mobile }: { mobile: Mobile }) {
  if (mobile.connected) return <Connected mobile={mobile} />;

  return (
    <div className="flex h-full items-center gap-7 pl-2">
      <div className="grid size-[184px] shrink-0 place-items-center overflow-hidden rounded-[22px] bg-paper p-1">
        {mobile.qr ? (
          <div
            className="size-full [&>svg]:size-full"
            dangerouslySetInnerHTML={{ __html: mobile.qr }}
          />
        ) : (
          <div className="size-full animate-pulse rounded-[18px] bg-[#e7e6e2]" />
        )}
      </div>
      <div className="min-w-0 max-w-[340px]">
        <p className="font-display text-[22px] leading-tight font-semibold text-paper">
          Appairer un téléphone
        </p>
        <p className="mt-2 text-[13px] leading-relaxed text-muted">
          Scannez le code avec l'appareil photo, sur le même Wi-Fi. Aucune application à
          installer : la page s'ouvre directement dans le navigateur.
        </p>
        <div className="mt-4 flex items-center gap-2 text-[12.5px] text-paper">
          <Wifi size={14} strokeWidth={2} className="text-muted" />
          <span className="truncate text-muted select-text">
            {mobile.url ? mobile.url.replace(/^https?:\/\//, "").replace(/\?.*$/, "") : "Démarrage…"}
          </span>
        </div>
      </div>
    </div>
  );
}

function Connected({ mobile }: { mobile: Mobile }) {
  return (
    <div className="flex h-full gap-4 pb-4">
      <div className="flex w-[200px] shrink-0 flex-col justify-center gap-3 pl-2">
        <span className="grid size-12 place-items-center rounded-full bg-card">
          <Smartphone size={20} strokeWidth={1.8} className="text-paper" />
        </span>
        <div>
          <p className="font-display text-[20px] leading-tight font-semibold text-paper">
            {mobile.devices[0]}
          </p>
          <p className="mt-1 flex items-center gap-1.5 text-[12.5px] text-muted">
            <span className="size-1.5 rounded-full bg-paper" />
            Connecté
            {mobile.devices.length > 1 && ` · +${mobile.devices.length - 1}`}
          </p>
        </div>
      </div>
      <div
        data-drop-target="mobile"
        className="flex flex-1 flex-col items-center justify-center gap-2 rounded-[20px] border border-dashed border-line text-center"
      >
        <span className="grid size-11 place-items-center rounded-full bg-card">
          <ArrowDownToLine size={18} strokeWidth={1.75} className="text-paper" />
        </span>
        <p className="mt-1 font-display text-[15px] font-semibold text-paper">
          Glissez ici pour envoyer
        </p>
        <p className="text-[12px] text-muted">Le fichier apparaît aussitôt sur le téléphone</p>
      </div>
    </div>
  );
}
