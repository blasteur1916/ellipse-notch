//! Glisser-déposer de fichiers vers les fenêtres de l'app.
//!
//! Avec les runtimes WebView2 récents, la fenêtre qui reçoit le drop appartient
//! au processus `msedgewebview2` : le `RegisterDragDrop` de wry n'y a pas accès
//! et le drag-drop natif de Tauri ne reçoit rien. On s'appuie donc sur le
//! drag-drop HTML5 de WebView2 : la page récupère les `File` déposés et les
//! transmet via `chrome.webview.postMessageWithAdditionalObjects`, ce qui donne
//! côté hôte des `ICoreWebView2File` exposant le vrai chemin disque.

use std::path::PathBuf;

use tauri::{AppHandle, Manager, WebviewWindow};

use crate::{mobile, satellite};
use crate::stash::{Source, Stash};

/// Préfixe des messages de dépôt envoyés par la page (`ellipse-drop:<cible>`).
const MESSAGE_PREFIX: &str = "ellipse-drop:";

pub fn install(window: &WebviewWindow) {
    let app = window.app_handle().clone();
    let label = window.label().to_string();
    let _ = window.with_webview(move |webview| {
        #[cfg(windows)]
        bridge::listen(webview.controller(), app, label);
    });
}

fn on_drop(app: &AppHandle, window: &str, target: &str, paths: Vec<PathBuf>) {
    if paths.is_empty() {
        return;
    }
    match target {
        "mobile" => mobile::share(app, &paths),
        _ => {
            let stash = app.state::<Stash>();
            for path in &paths {
                stash.add(app, path, Source::Dropped);
            }
        }
    }
    if window == satellite::LABEL {
        satellite::fly_home(app);
    }
}

#[cfg(windows)]
mod bridge {
    use std::path::PathBuf;

    use tauri::AppHandle;
    use webview2_com::Microsoft::Web::WebView2::Win32::{
        ICoreWebView2Controller, ICoreWebView2File, ICoreWebView2WebMessageReceivedEventArgs2,
    };
    use webview2_com::{take_pwstr, WebMessageReceivedEventHandler};
    use windows::core::{Interface, PWSTR};

    use super::{on_drop, MESSAGE_PREFIX};

    pub fn listen(controller: ICoreWebView2Controller, app: AppHandle, label: String) {
        unsafe {
            let Ok(core) = controller.CoreWebView2() else { return };
            let handler = WebMessageReceivedEventHandler::create(Box::new(move |_, args| {
                let Some(args) = args else { return Ok(()) };
                let mut message = PWSTR::null();
                if args.TryGetWebMessageAsString(&mut message).is_err() {
                    return Ok(());
                }
                let message = take_pwstr(message);
                let Some(target) = message.strip_prefix(MESSAGE_PREFIX) else {
                    return Ok(());
                };
                let paths = args
                    .cast::<ICoreWebView2WebMessageReceivedEventArgs2>()
                    .map(|args| dropped_paths(&args))
                    .unwrap_or_default();
                on_drop(&app, &label, target, paths);
                Ok(())
            }));
            let mut token = 0;
            let _ = core.add_WebMessageReceived(&handler, &mut token);
        }
    }

    unsafe fn dropped_paths(args: &ICoreWebView2WebMessageReceivedEventArgs2) -> Vec<PathBuf> {
        let mut paths = Vec::new();
        unsafe {
            let Ok(objects) = args.AdditionalObjects() else { return paths };
            let mut count = 0;
            if objects.Count(&mut count).is_err() {
                return paths;
            }
            for i in 0..count {
                let Ok(file) = objects.GetValueAtIndex(i).and_then(|o| o.cast::<ICoreWebView2File>())
                else {
                    continue;
                };
                let mut path = PWSTR::null();
                if file.Path(&mut path).is_ok() {
                    paths.push(PathBuf::from(take_pwstr(path)));
                }
            }
        }
        paths
    }
}
