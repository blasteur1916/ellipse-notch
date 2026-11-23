use std::thread;
use std::time::Duration;

use tauri::{AppHandle, Manager};

use super::{now_ms, Stash};

const TICK: Duration = Duration::from_secs(1);

/// Supprime les éléments dont le minuteur d'auto-suppression est échu.
pub fn spawn_cleanup_loop(app: AppHandle) {
    thread::spawn(move || loop {
        thread::sleep(TICK);
        let stash = app.state::<Stash>();
        for id in stash.expired_ids(now_ms()) {
            stash.dispose(&app, &id);
        }
    });
}
