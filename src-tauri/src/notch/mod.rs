//! Fenêtre du Notch : placement en haut de l'écran et click-through.
//!
//! La fenêtre est plus grande que le Notch (pour contenir l'état ouvert) et
//! transparente. Plutôt que de basculer `WS_EX_TRANSPARENT` (qui casse le
//! glisser-déposer OLE), on découpe la fenêtre avec une région Win32 :
//!   1. le front envoie la forme exacte du Notch et sa zone de survol
//!      (`set_hit_region`) ;
//!   2. la fenêtre n'existe qu'à l'intérieur de cette forme : en dehors, clics
//!      et dépôts traversent vers les applications situées dessous, et aucun
//!      pixel « vide » ne peut s'afficher (Windows les peint sinon en clair) ;
//!   3. un thread suit le curseur global pour émettre `notch://hover`, y compris
//!      pendant un drag où le WebView ne reçoit aucun événement souris.

use std::sync::Mutex;
use std::thread;
use std::time::Duration;

use serde::Deserialize;
use tauri::{AppHandle, Emitter, Manager, PhysicalPosition, State, WebviewWindow};

pub const LABEL: &str = "notch";
const HOVER_EVENT: &str = "notch://hover";
const POLL_INTERVAL: Duration = Duration::from_millis(10);

/// Rectangle en pixels physiques, coordonnées écran.
#[derive(Clone, Copy)]
struct ScreenRect {
    x: f64,
    y: f64,
    width: f64,
    height: f64,
}

impl ScreenRect {
    fn contains(&self, px: f64, py: f64) -> bool {
        px >= self.x && px < self.x + self.width && py >= self.y && py < self.y + self.height
    }
}

#[derive(Default)]
pub struct HitRegion(Mutex<Option<ScreenRect>>);

/// Rectangle en pixels CSS, relatif à la fenêtre (tel qu'envoyé par le front).
#[derive(Deserialize)]
pub struct CssRect {
    x: f64,
    y: f64,
    width: f64,
    height: f64,
}

/// Forme du Notch en pixels CSS : `x` est le bord gauche des oreilles concaves,
/// le corps (largeur `width`) commence à `x + ear`.
#[derive(Deserialize)]
pub struct CssShape {
    x: f64,
    width: f64,
    height: f64,
    radius: f64,
    ear: f64,
}

#[tauri::command]
pub fn set_hit_region(
    window: WebviewWindow,
    region: State<'_, HitRegion>,
    rect: CssRect,
    shape: CssShape,
) -> Result<(), String> {
    let scale = window.scale_factor().map_err(|e| e.to_string())?;
    let origin = window.inner_position().map_err(|e| e.to_string())?;
    clip_window(&window, &shape, scale);
    *region.0.lock().unwrap() = Some(ScreenRect {
        x: origin.x as f64 + rect.x * scale,
        y: origin.y as f64 + rect.y * scale,
        width: rect.width * scale,
        height: rect.height * scale,
    });
    Ok(())
}

/// Centre du bord haut du Notch, en coordonnées écran physiques.
pub fn anchor(app: &AppHandle) -> Option<(i32, i32)> {
    let window = app.get_webview_window(LABEL)?;
    let pos = window.outer_position().ok()?;
    let size = window.outer_size().ok()?;
    Some((pos.x + size.width as i32 / 2, pos.y))
}

/// Centre la fenêtre horizontalement, collée au bord haut de l'écran principal.
pub fn place_at_top_center(window: &WebviewWindow) -> tauri::Result<()> {
    let Some(monitor) = window.primary_monitor()?.or(window.current_monitor()?) else {
        return Ok(());
    };
    let area = monitor.position();
    let screen = monitor.size();
    let size = window.outer_size()?;
    let x = area.x + (screen.width as i32 - size.width as i32) / 2;
    window.set_position(PhysicalPosition::new(x, area.y))
}

pub fn spawn_hover_loop(window: WebviewWindow) {
    thread::spawn(move || {
        let mut inside = false;
        loop {
            thread::sleep(POLL_INTERVAL);

            let Ok(cursor) = window.cursor_position() else {
                continue;
            };
            let hit = window
                .state::<HitRegion>()
                .0
                .lock()
                .unwrap()
                .is_some_and(|r| r.contains(cursor.x, cursor.y));

            if hit != inside {
                inside = hit;
                let _ = window.emit_to(LABEL, HOVER_EVENT, hit);
            }
        }
    });
}

/// Découpe la fenêtre à la forme du Notch : corps aux coins bas arrondis, plus
/// les deux oreilles concaves (un carré moins un quart de disque).
#[cfg(windows)]
fn clip_window(window: &WebviewWindow, shape: &CssShape, scale: f64) {
    use windows::Win32::Foundation::HWND;
    use windows::Win32::Graphics::Gdi::{
        CombineRgn, CreateEllipticRgn, CreateRectRgn, CreateRoundRectRgn, DeleteObject, SetWindowRgn,
        HGDIOBJ, RGN_DIFF, RGN_OR,
    };

    let Ok(hwnd) = window.hwnd() else { return };
    let px = |v: f64| (v * scale).round() as i32;
    let (left, e, w, h, r) = (px(shape.x), px(shape.ear), px(shape.width), px(shape.height), px(shape.radius));
    let body_left = left + e;
    let body_right = body_left + w;

    unsafe {
        // Corps : le rectangle arrondi est prolongé au-dessus de l'écran pour que
        // seuls ses coins bas soient arrondis.
        let notch = CreateRoundRectRgn(body_left, -r, body_right + 1, h + 1, r * 2, r * 2);
        if e > 0 {
            for (square_left, circle_left) in [(left, left - e), (body_right, body_right)] {
                let ear = CreateRectRgn(square_left, 0, square_left + e, e);
                let hollow = CreateEllipticRgn(circle_left, 0, circle_left + e * 2 + 1, e * 2 + 1);
                CombineRgn(Some(ear), Some(ear), Some(hollow), RGN_DIFF);
                CombineRgn(Some(notch), Some(notch), Some(ear), RGN_OR);
                let _ = DeleteObject(HGDIOBJ(ear.0));
                let _ = DeleteObject(HGDIOBJ(hollow.0));
            }
        }
        // La fenêtre devient propriétaire de `notch` : pas de DeleteObject dessus.
        SetWindowRgn(HWND(hwnd.0 as _), Some(notch), true);
    }
}

#[cfg(not(windows))]
fn clip_window(_: &WebviewWindow, _: &CssShape, _: f64) {}
