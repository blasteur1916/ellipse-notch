//! Icône de la zone de notification : seul point d'entrée « classique » d'une
//! app sans fenêtre dans la barre des tâches (lancement au démarrage, quitter).

use tauri::menu::{CheckMenuItem, Menu, MenuItem, PredefinedMenuItem};
use tauri::tray::TrayIconBuilder;
use tauri::App;
use tauri_plugin_autostart::ManagerExt;

const AUTOSTART: &str = "autostart";
const QUIT: &str = "quit";

pub fn install(app: &App) -> tauri::Result<()> {
    let enabled = app.autolaunch().is_enabled().unwrap_or(false);
    let autostart =
        CheckMenuItem::with_id(app, AUTOSTART, "Lancer au démarrage de Windows", true, enabled, None::<&str>)?;
    let quit = MenuItem::with_id(app, QUIT, "Quitter Ellipse", true, None::<&str>)?;
    let menu = Menu::with_items(app, &[&autostart, &PredefinedMenuItem::separator(app)?, &quit])?;

    let mut tray = TrayIconBuilder::new()
        .tooltip("Ellipse")
        .menu(&menu)
        .show_menu_on_left_click(true)
        .on_menu_event(move |app, event| match event.id().as_ref() {
            AUTOSTART => {
                let launcher = app.autolaunch();
                let next = !launcher.is_enabled().unwrap_or(false);
                let _ = if next { launcher.enable() } else { launcher.disable() };
                let _ = autostart.set_checked(launcher.is_enabled().unwrap_or(next));
            }
            QUIT => app.exit(0),
            _ => {}
        });
    if let Some(icon) = app.default_window_icon() {
        tray = tray.icon(icon.clone());
    }
    tray.build(app)?;
    Ok(())
}
