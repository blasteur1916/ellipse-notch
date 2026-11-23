//! Stash : fichiers temporaires affichés dans le Notch.
//!
//! Deux origines :
//!   - `Download` : détecté par le watcher du dossier Téléchargements. L'auto-
//!     suppression envoie le fichier à la Corbeille (récupérable).
//!   - `Dropped`  : déposé sur le Notch par l'utilisateur. Le fichier n'est
//!     référencé que par son chemin ; l'auto-suppression le retire seulement
//!     du Stash, jamais du disque.
//!   - `Mobile`   : reçu du téléphone (copie dans Téléchargements\Ellipse),
//!     traité comme un téléchargement.

mod cleanup;
pub mod preview;
mod watcher;

use std::fs;
use std::path::{Path, PathBuf};
use std::sync::Mutex;
use std::time::{SystemTime, UNIX_EPOCH};

use serde::{Deserialize, Serialize};
use tauri::{AppHandle, Emitter, Manager, State};

use crate::settings::SettingsStore;

pub use cleanup::spawn_cleanup_loop;
pub use preview::PreviewCache;
pub use watcher::DownloadsWatcher;

const CHANGED_EVENT: &str = "stash://changed";
const ADDED_EVENT: &str = "stash://added";
const STORE_FILE: &str = "stash.json";

#[derive(Clone, Copy, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub enum Source {
    Download,
    Dropped,
    Mobile,
}

#[derive(Clone, Serialize, Deserialize)]
#[serde(tag = "kind", rename_all = "camelCase")]
pub enum AutoDelete {
    Off,
    #[serde(rename_all = "camelCase")]
    Timer { minutes: u32, expires_at: u64 },
    AfterDragOut,
}

/// Mode demandé par le front (l'échéance est calculée ici).
#[derive(Deserialize)]
#[serde(tag = "kind", rename_all = "camelCase")]
pub enum AutoDeleteRequest {
    Off,
    Timer { minutes: Option<u32> },
    AfterDragOut,
}

#[derive(Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct StashItem {
    pub id: String,
    pub path: PathBuf,
    pub name: String,
    pub extension: String,
    pub is_dir: bool,
    pub size: u64,
    pub source: Source,
    pub added_at: u64,
    pub auto_delete: AutoDelete,
}

impl StashItem {
    fn from_path(path: &Path, source: Source) -> Option<Self> {
        let meta = fs::metadata(path).ok()?;
        let name = path.file_name()?.to_string_lossy().into_owned();
        let extension = path
            .extension()
            .map(|e| e.to_string_lossy().to_lowercase())
            .unwrap_or_default();
        Some(Self {
            id: uuid::Uuid::new_v4().to_string(),
            path: path.to_path_buf(),
            name,
            extension,
            is_dir: meta.is_dir(),
            size: if meta.is_dir() { 0 } else { meta.len() },
            source,
            added_at: now_ms(),
            auto_delete: AutoDelete::Off,
        })
    }
}

pub fn now_ms() -> u64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|d| d.as_millis() as u64)
        .unwrap_or_default()
}

pub struct Stash {
    items: Mutex<Vec<StashItem>>,
    store_path: PathBuf,
}

impl Stash {
    /// Recharge le Stash persisté en écartant les fichiers disparus entre-temps.
    pub fn load(app: &AppHandle) -> tauri::Result<Self> {
        let dir = app.path().app_data_dir()?;
        fs::create_dir_all(&dir)?;
        let store_path = dir.join(STORE_FILE);
        let items: Vec<StashItem> = fs::read(&store_path)
            .ok()
            .and_then(|bytes| serde_json::from_slice(&bytes).ok())
            .unwrap_or_default();
        let items = items.into_iter().filter(|i| i.path.exists()).collect();
        Ok(Self { items: Mutex::new(items), store_path })
    }

    pub fn snapshot(&self) -> Vec<StashItem> {
        self.items.lock().unwrap().clone()
    }

    /// Applique une modification, persiste et notifie le front si quelque chose a changé.
    fn mutate<R>(&self, app: &AppHandle, f: impl FnOnce(&mut Vec<StashItem>) -> (R, bool)) -> R {
        let (result, changed, snapshot) = {
            let mut items = self.items.lock().unwrap();
            let (result, changed) = f(&mut items);
            (result, changed, changed.then(|| items.clone()))
        };
        if let (true, Some(items)) = (changed, snapshot) {
            if let Ok(json) = serde_json::to_vec(&items) {
                let _ = fs::write(&self.store_path, json);
            }
            let _ = app.emit(CHANGED_EVENT, items);
        }
        result
    }

    pub fn add(&self, app: &AppHandle, path: &Path, source: Source) -> Option<StashItem> {
        let settings = app.state::<SettingsStore>().get();
        let added = self.mutate(app, |items| {
            if items.iter().any(|i| i.path == path) {
                return (None, false);
            }
            let mut item = StashItem::from_path(path, source);
            if let Some(item) = &mut item {
                if source != Source::Dropped && settings.auto_delete_downloads {
                    item.auto_delete = timer(settings.timer_minutes);
                }
                items.insert(0, item.clone());
            }
            let changed = item.is_some();
            (item, changed)
        })?;
        let _ = app.emit(ADDED_EVENT, &added);
        Some(added)
    }

    /// Retire l'entrée dont le fichier a disparu (supprimé/déplacé hors de l'app).
    pub fn forget_path(&self, app: &AppHandle, path: &Path) {
        self.mutate(app, |items| {
            let before = items.len();
            items.retain(|i| i.path != path);
            ((), items.len() != before)
        });
    }

    pub fn refresh_size(&self, app: &AppHandle, path: &Path) {
        let Ok(meta) = fs::metadata(path) else { return };
        self.mutate(app, |items| match items.iter_mut().find(|i| i.path == path) {
            Some(item) if item.size != meta.len() => {
                item.size = meta.len();
                ((), true)
            }
            _ => ((), false),
        });
    }

    fn take(&self, app: &AppHandle, id: &str) -> Option<StashItem> {
        self.mutate(app, |items| {
            let item = items
                .iter()
                .position(|i| i.id == id)
                .map(|idx| items.remove(idx));
            let changed = item.is_some();
            (item, changed)
        })
    }

    /// Auto-suppression : Corbeille pour une copie reçue (téléchargement,
    /// téléphone), simple retrait pour un fichier déposé par l'utilisateur.
    pub fn dispose(&self, app: &AppHandle, id: &str) {
        if let Some(item) = self.take(app, id) {
            if item.source != Source::Dropped && item.path.exists() {
                let _ = trash::delete(&item.path);
            }
        }
    }

    pub fn expired_ids(&self, now: u64) -> Vec<String> {
        self.items
            .lock()
            .unwrap()
            .iter()
            .filter(|i| matches!(i.auto_delete, AutoDelete::Timer { expires_at, .. } if expires_at <= now))
            .map(|i| i.id.clone())
            .collect()
    }
}

fn timer(minutes: u32) -> AutoDelete {
    let minutes = minutes.max(1);
    AutoDelete::Timer { minutes, expires_at: now_ms() + minutes as u64 * 60_000 }
}

#[tauri::command]
pub fn stash_list(stash: State<'_, Stash>) -> Vec<StashItem> {
    stash.snapshot()
}

#[tauri::command]
pub fn stash_remove(app: AppHandle, stash: State<'_, Stash>, id: String) {
    stash.take(&app, &id);
}

#[tauri::command]
pub fn stash_clear(app: AppHandle, stash: State<'_, Stash>) {
    stash.mutate(&app, |items| {
        let changed = !items.is_empty();
        items.clear();
        ((), changed)
    });
}

#[tauri::command]
pub fn stash_set_auto_delete(
    app: AppHandle,
    stash: State<'_, Stash>,
    id: String,
    mode: AutoDeleteRequest,
) {
    let mode = match mode {
        AutoDeleteRequest::Off => AutoDelete::Off,
        AutoDeleteRequest::AfterDragOut => AutoDelete::AfterDragOut,
        AutoDeleteRequest::Timer { minutes } => {
            timer(minutes.unwrap_or_else(|| app.state::<SettingsStore>().get().timer_minutes))
        }
    };
    stash.mutate(&app, |items| match items.iter_mut().find(|i| i.id == id) {
        Some(item) => {
            item.auto_delete = mode;
            ((), true)
        }
        None => ((), false),
    });
}

/// Appelé par le front quand un drag-out s'est terminé par un dépôt.
#[tauri::command]
pub fn stash_dragged_out(app: AppHandle, stash: State<'_, Stash>, id: String) {
    let after_drag = stash
        .items
        .lock()
        .unwrap()
        .iter()
        .any(|i| i.id == id && matches!(i.auto_delete, AutoDelete::AfterDragOut));
    if after_drag {
        stash.dispose(&app, &id);
    }
}
