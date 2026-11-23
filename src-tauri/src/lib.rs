mod drop;
mod frameless;
mod input;
mod mobile;
mod notch;
mod satellite;
mod settings;
mod stash;
mod tray;

use tauri::Manager;

pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_drag::init())
        .plugin(tauri_plugin_autostart::init(
            tauri_plugin_autostart::MacosLauncher::LaunchAgent,
            None,
        ))
        .manage(notch::HitRegion::default())
        .manage(stash::PreviewCache::default())
        .invoke_handler(tauri::generate_handler![
            notch::set_hit_region,
            mobile::mobile_status,
            mobile::mobile_send,
            settings::settings_get,
            settings::settings_set,
            stash::stash_list,
            stash::stash_remove,
            stash::stash_clear,
            stash::stash_set_auto_delete,
            stash::stash_dragged_out,
            stash::preview::stash_preview,
        ])
        .setup(|app| {
            tray::install(app)?;
            let handle = app.handle();
            app.manage(settings::SettingsStore::load(handle)?);
            app.manage(stash::Stash::load(handle)?);
            app.manage(stash::DownloadsWatcher::start(handle)?);
            stash::spawn_cleanup_loop(handle.clone());
            input::start(handle.clone());
            app.manage(mobile::Mobile::load(handle)?);
            mobile::start(handle);
            mobile::spawn_usb_bridge(handle.clone());

            let window = app
                .get_webview_window(notch::LABEL)
                .expect("la fenêtre `notch` doit être déclarée dans tauri.conf.json");
            notch::place_at_top_center(&window)?;
            notch::spawn_hover_loop(window.clone());
            drop::install(&window);
            if let Some(satellite) = app.get_webview_window(satellite::LABEL) {
                drop::install(&satellite);
            }
            window.show()?;
            frameless::strip(&window);
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("erreur au lancement d'Ellipse");
}
