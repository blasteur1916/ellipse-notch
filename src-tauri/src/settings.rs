//! Réglages utilisateur, persistés dans `settings.json`.

use std::fs;
use std::path::PathBuf;
use std::sync::Mutex;

use serde::{Deserialize, Serialize};
use tauri::{AppHandle, Emitter, Manager, State};

const STORE_FILE: &str = "settings.json";
const CHANGED_EVENT: &str = "settings://changed";

#[derive(Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", default)]
pub struct Settings {
    /// Durée du minuteur d'auto-suppression.
    pub timer_minutes: u32,
    /// Active le minuteur automatiquement sur chaque nouveau téléchargement.
    pub auto_delete_downloads: bool,
    /// Met en pause la détection des téléchargements.
    pub paused: bool,
    /// Secouer la souris pendant un drag fait apparaître le Satellite.
    pub shake_to_stash: bool,
}

impl Default for Settings {
    fn default() -> Self {
        Self {
            timer_minutes: 10,
            auto_delete_downloads: false,
            paused: false,
            shake_to_stash: true,
        }
    }
}

pub struct SettingsStore {
    current: Mutex<Settings>,
    path: PathBuf,
}

impl SettingsStore {
    pub fn load(app: &AppHandle) -> tauri::Result<Self> {
        let dir = app.path().app_data_dir()?;
        fs::create_dir_all(&dir)?;
        let path = dir.join(STORE_FILE);
        let current = fs::read(&path)
            .ok()
            .and_then(|bytes| serde_json::from_slice(&bytes).ok())
            .unwrap_or_default();
        Ok(Self { current: Mutex::new(current), path })
    }

    pub fn get(&self) -> Settings {
        self.current.lock().unwrap().clone()
    }
}

#[tauri::command]
pub fn settings_get(store: State<'_, SettingsStore>) -> Settings {
    store.get()
}

#[tauri::command]
pub fn settings_set(app: AppHandle, store: State<'_, SettingsStore>, settings: Settings) {
    if let Ok(json) = serde_json::to_vec_pretty(&settings) {
        let _ = fs::write(&store.path, json);
    }
    *store.current.lock().unwrap() = settings.clone();
    let _ = app.emit(CHANGED_EVENT, settings);
}
