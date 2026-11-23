//! Surveillance du dossier Téléchargements de Windows.
//!
//! Les navigateurs écrivent d'abord un fichier temporaire (`.crdownload`,
//! `.part`, …) puis le renomment : on ignore ces extensions et on ne retient
//! que les créations/renommages aboutissant à un fichier final.

use std::path::Path;
use std::time::Duration;

use notify::event::{EventKind, ModifyKind};
use notify::{RecommendedWatcher, RecursiveMode};
use notify_debouncer_full::{new_debouncer, DebounceEventResult, Debouncer, RecommendedCache};
use tauri::{AppHandle, Manager};

use super::{Source, Stash};
use crate::settings::SettingsStore;

const DEBOUNCE: Duration = Duration::from_millis(600);
const TEMP_EXTENSIONS: &[&str] = &["crdownload", "part", "partial", "download", "tmp", "opdownload"];

/// Garde le watcher en vie tant qu'il est stocké dans l'état de l'app.
pub struct DownloadsWatcher(#[allow(dead_code)] Debouncer<RecommendedWatcher, RecommendedCache>);

impl DownloadsWatcher {
    pub fn start(app: &AppHandle) -> Result<Self, Box<dyn std::error::Error>> {
        let dir = app.path().download_dir()?;
        let handle = app.clone();
        let mut debouncer = new_debouncer(DEBOUNCE, None, move |result: DebounceEventResult| {
            let Ok(events) = result else { return };
            let stash = handle.state::<Stash>();
            let paused = handle.state::<SettingsStore>().get().paused;
            for event in events {
                let creates = matches!(
                    event.kind,
                    EventKind::Create(_) | EventKind::Modify(ModifyKind::Name(_))
                );
                let data_change = matches!(event.kind, EventKind::Modify(ModifyKind::Data(_)));
                for path in &event.paths {
                    if !path.exists() {
                        stash.forget_path(&handle, path);
                    } else if creates && !paused && is_final_download(path) {
                        stash.add(&handle, path, Source::Download);
                    } else if data_change {
                        stash.refresh_size(&handle, path);
                    }
                }
            }
        })?;
        debouncer.watch(&dir, RecursiveMode::NonRecursive)?;
        Ok(Self(debouncer))
    }
}

fn is_final_download(path: &Path) -> bool {
    // Les dossiers (dont Téléchargements\Ellipse, réception mobile) sont ignorés.
    if !path.is_file() {
        return false;
    }
    let Some(name) = path.file_name().and_then(|n| n.to_str()) else {
        return false;
    };
    if name.starts_with('.') || name.starts_with("~$") || name.eq_ignore_ascii_case("desktop.ini") {
        return false;
    }
    let ext = path
        .extension()
        .and_then(|e| e.to_str())
        .map(str::to_ascii_lowercase)
        .unwrap_or_default();
    !TEMP_EXTENSIONS.contains(&ext.as_str())
}
