//! Satellite : orbe de dépôt qui s'accroche au curseur pendant un drag, après
//! une secousse. Comme elle suit le curseur, relâcher le
//! bouton n'importe où dépose le fichier dedans ; il s'envole alors vers le
//! Notch. Sans dépôt (Échap, drag annulé), il s'efface simplement.

use std::sync::atomic::{AtomicBool, Ordering};
use std::thread;
use std::time::Duration;

use tauri::{AppHandle, Emitter, Manager, PhysicalPosition, WebviewWindow};

use crate::{frameless, notch};

pub const LABEL: &str = "satellite";
const SHOW_EVENT: &str = "satellite://show";
const HIDE_EVENT: &str = "satellite://hide";
const DROPPED_EVENT: &str = "satellite://dropped";

/// Temps laissé à OLE pour livrer le dépôt après le relâchement du bouton.
const DROP_GRACE: Duration = Duration::from_millis(350);
const FADE_OUT: Duration = Duration::from_millis(220);
const FLIGHT_STEPS: u32 = 26;
const FLIGHT_FRAME: Duration = Duration::from_millis(15);

static ATTACHED: AtomicBool = AtomicBool::new(false);
static DROPPED: AtomicBool = AtomicBool::new(false);

fn window(app: &AppHandle) -> Option<WebviewWindow> {
    app.get_webview_window(LABEL)
}

pub fn is_attached() -> bool {
    ATTACHED.load(Ordering::SeqCst)
}

fn center_on(window: &WebviewWindow, x: i32, y: i32) {
    if let Ok(size) = window.outer_size() {
        let _ = window.set_position(PhysicalPosition::new(
            x - size.width as i32 / 2,
            y - size.height as i32 / 2,
        ));
    }
}

/// Fait apparaître l'orbe sous le curseur (coordonnées écran physiques).
pub fn attach(app: &AppHandle, x: i32, y: i32) {
    let Some(window) = window(app) else { return };
    ATTACHED.store(true, Ordering::SeqCst);
    DROPPED.store(false, Ordering::SeqCst);
    center_on(&window, x, y);
    // Fenêtre non focusable (tauri.conf.json) : l'afficher ne vole pas le focus
    // à l'application source du drag.
    let _ = window.show();
    frameless::strip(&window);
    let _ = window.emit_to(LABEL, SHOW_EVENT, ());
}

pub fn follow(app: &AppHandle, x: i32, y: i32) {
    if let (true, Some(window)) = (is_attached(), window(app)) {
        center_on(&window, x, y);
    }
}

/// Bouton relâché : si aucun dépôt n'arrive, l'orbe s'efface.
pub fn release(app: &AppHandle) {
    if !ATTACHED.swap(false, Ordering::SeqCst) {
        return;
    }
    let app = app.clone();
    thread::spawn(move || {
        thread::sleep(DROP_GRACE);
        if !DROPPED.load(Ordering::SeqCst) {
            fade_out(app);
        }
    });
}

fn fade_out(app: AppHandle) {
    thread::spawn(move || {
        if let Some(window) = window(&app) {
            let _ = window.emit_to(LABEL, HIDE_EVENT, ());
            thread::sleep(FADE_OUT);
            if !is_attached() {
                let _ = window.hide();
            }
        }
    });
}

/// Fichier déposé : l'orbe file vers le Notch puis disparaît.
pub fn fly_home(app: &AppHandle) {
    DROPPED.store(true, Ordering::SeqCst);
    ATTACHED.store(false, Ordering::SeqCst);
    let Some(window) = window(app) else { return };
    let _ = window.emit_to(LABEL, DROPPED_EVENT, ());
    let app = app.clone();
    thread::spawn(move || {
        let (Ok(start), Ok(size), Some((tx, ty))) =
            (window.outer_position(), window.outer_size(), notch::anchor(&app))
        else {
            let _ = window.hide();
            return;
        };
        let (sx, sy) = (start.x as f64, start.y as f64);
        let ex = (tx - size.width as i32 / 2) as f64;
        let ey = (ty - size.height as i32 / 2) as f64;
        for step in 1..=FLIGHT_STEPS {
            // Ease-in cubique : départ doux, aspiration finale vers le Notch.
            let t = step as f64 / FLIGHT_STEPS as f64;
            let k = t * t * t;
            let _ = window.set_position(PhysicalPosition::new(
                (sx + (ex - sx) * k) as i32,
                (sy + (ey - sy) * k) as i32,
            ));
            thread::sleep(FLIGHT_FRAME);
        }
        if !is_attached() {
            let _ = window.hide();
        }
    });
}
