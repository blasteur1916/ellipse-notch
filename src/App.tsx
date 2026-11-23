import { getCurrentWindow } from "@tauri-apps/api/window";
import { Notch } from "./components/notch/Notch";
import { Satellite } from "./components/satellite/Satellite";

// Un seul bundle pour toutes les fenêtres : on aiguille selon le label Tauri.
const label = getCurrentWindow().label;

export function App() {
  return label === "satellite" ? <Satellite /> : <Notch />;
}
