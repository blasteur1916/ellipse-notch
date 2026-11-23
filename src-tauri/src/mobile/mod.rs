//! Transfert PC ↔ téléphone sans application : un serveur HTTP + WebSocket
//! local sert une web app (PWA) au téléphone, sur le même réseau Wi-Fi.
//!
//! - L'accès est protégé par un jeton aléatoire inclus dans l'URL du QR code.
//!   Il est conservé d'un lancement à l'autre : un téléphone appairé le reste.
//! - Transports : Wi-Fi local, ou câble USB sur Android (`adb reverse`, voir
//!   `usb.rs`) ; dans les deux cas le téléphone parle le même protocole HTTP.
//! - PC → mobile : les fichiers « partagés » sont annoncés en WebSocket et
//!   téléchargeables via `/files/{id}`.
//! - Mobile → PC : la page envoie `drag_start` (ouvre le Notch) puis téléverse
//!   le fichier sur `/upload` ; il atterrit dans le Stash.

mod server;
mod usb;

use std::collections::HashMap;
use std::fs;
use std::path::{Path, PathBuf};
use std::sync::Mutex;

use qrcode::render::svg;
use qrcode::QrCode;
use serde::Serialize;
use tauri::{AppHandle, Emitter, Manager, State};
use tokio::sync::broadcast;

pub use server::start;
pub use usb::spawn_usb_bridge;

const STATUS_EVENT: &str = "mobile://status";
const TOKEN_FILE: &str = "pairing.json";
const DRAG_EVENT: &str = "mobile://drag";

#[derive(Clone)]
struct SharedFile {
    path: PathBuf,
    name: String,
    size: u64,
}

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct MobileStatus {
    /// URL d'appairage (avec jeton), `None` tant que le serveur n'écoute pas.
    url: Option<String>,
    /// QR code de l'URL, en SVG.
    qr: Option<String>,
    devices: Vec<String>,
}

pub struct Mobile {
    token: String,
    /// Port réellement écouté (connu une fois le serveur démarré).
    port: Mutex<Option<u16>>,
    url: Mutex<Option<String>>,
    devices: Mutex<HashMap<u64, String>>,
    shared: Mutex<Vec<(String, SharedFile)>>,
    /// Messages diffusés à tous les téléphones connectés (JSON).
    broadcast: broadcast::Sender<String>,
}

#[derive(Serialize, serde::Deserialize)]
struct Pairing {
    token: String,
}

impl Mobile {
    /// Recharge le jeton d'appairage, ou en crée un au premier lancement.
    pub fn load(app: &AppHandle) -> tauri::Result<Self> {
        let path = app.path().app_data_dir()?.join(TOKEN_FILE);
        let token = fs::read(&path)
            .ok()
            .and_then(|bytes| serde_json::from_slice::<Pairing>(&bytes).ok())
            .map(|p| p.token)
            .unwrap_or_else(|| {
                let token = uuid::Uuid::new_v4().simple().to_string();
                if let Ok(json) = serde_json::to_vec(&Pairing { token: token.clone() }) {
                    let _ = fs::write(&path, json);
                }
                token
            });
        Ok(Self {
            token,
            port: Mutex::new(None),
            url: Mutex::new(None),
            devices: Mutex::new(HashMap::new()),
            shared: Mutex::new(Vec::new()),
            broadcast: broadcast::channel(64).0,
        })
    }

    fn status(&self) -> MobileStatus {
        let url = self.url.lock().unwrap().clone();
        let qr = url.as_deref().and_then(qr_svg);
        let mut devices: Vec<String> = self.devices.lock().unwrap().values().cloned().collect();
        devices.sort();
        MobileStatus { url, qr, devices }
    }

    fn file_message(id: &str, file: &SharedFile) -> String {
        serde_json::json!({ "type": "file", "id": id, "name": file.name, "size": file.size })
            .to_string()
    }

    fn shared_messages(&self) -> Vec<String> {
        self.shared
            .lock()
            .unwrap()
            .iter()
            .map(|(id, f)| Self::file_message(id, f))
            .collect()
    }

    fn shared_file(&self, id: &str) -> Option<SharedFile> {
        self.shared
            .lock()
            .unwrap()
            .iter()
            .find(|(i, _)| i == id)
            .map(|(_, f)| f.clone())
    }
}

fn emit_status(app: &AppHandle) {
    let _ = app.emit(STATUS_EVENT, app.state::<Mobile>().status());
}

fn emit_drag(app: &AppHandle, active: bool) {
    let _ = app.emit(DRAG_EVENT, active);
}

fn qr_svg(url: &str) -> Option<String> {
    let code = QrCode::new(url.as_bytes()).ok()?;
    Some(
        code.render::<svg::Color>()
            .min_dimensions(220, 220)
            .dark_color(svg::Color("#0A0A0A"))
            .light_color(svg::Color("#F8F7F4"))
            .quiet_zone(true)
            .build(),
    )
}

/// Envoie des fichiers aux téléphones connectés (ils restent disponibles pour
/// ceux qui se connectent ensuite, jusqu'à la fermeture de l'app).
pub fn share(app: &AppHandle, paths: &[PathBuf]) {
    let mobile = app.state::<Mobile>();
    for path in paths.iter().filter(|p| p.is_file()) {
        let Some(name) = path.file_name().map(|n| n.to_string_lossy().into_owned()) else {
            continue;
        };
        let size = fs::metadata(path).map(|m| m.len()).unwrap_or(0);
        let file = SharedFile { path: path.clone(), name, size };
        let id = uuid::Uuid::new_v4().simple().to_string();
        let _ = mobile.broadcast.send(Mobile::file_message(&id, &file));
        mobile.shared.lock().unwrap().push((id, file));
    }
}

/// Dossier de réception des fichiers envoyés depuis le téléphone.
fn received_dir(app: &AppHandle) -> Option<PathBuf> {
    let dir = app.path().download_dir().ok()?.join("Ellipse");
    fs::create_dir_all(&dir).ok()?;
    Some(dir)
}

/// Chemin libre dans `dir` pour `name` (« photo (2).jpg » si besoin).
fn unique_path(dir: &Path, name: &str) -> PathBuf {
    let candidate = dir.join(name);
    if !candidate.exists() {
        return candidate;
    }
    let path = Path::new(name);
    let stem = path.file_stem().map(|s| s.to_string_lossy()).unwrap_or_default();
    let ext = path
        .extension()
        .map(|e| format!(".{}", e.to_string_lossy()))
        .unwrap_or_default();
    (2..)
        .map(|n| dir.join(format!("{stem} ({n}){ext}")))
        .find(|p| !p.exists())
        .unwrap()
}

#[tauri::command]
pub fn mobile_status(mobile: State<'_, Mobile>) -> MobileStatus {
    mobile.status()
}

#[tauri::command]
pub fn mobile_send(app: AppHandle, paths: Vec<PathBuf>) {
    share(&app, &paths);
}
