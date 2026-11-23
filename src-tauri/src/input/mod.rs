//! Hook souris global (WH_MOUSE_LL) et détection de gestes pendant un drag.
//!
//! Windows n'expose pas « un drag de fichier est en cours » à l'échelle du
//! système : on considère qu'un drag est actif quand le bouton gauche est tenu
//! et que le curseur s'est déplacé. Les déplacements/redimensionnements de
//! fenêtres sont exclus (sinon le snap Windows et l'Aero Shake déclencheraient
//! nos gestes).
//!
//! Le callback du hook doit rester quasi instantané : il ne fait que pousser
//! l'échantillon dans un canal ; l'analyse tourne sur un autre thread.

mod gestures;

use std::sync::mpsc::{self, Sender};
use std::sync::OnceLock;
use std::thread;

use tauri::AppHandle;

#[derive(Clone, Copy)]
enum Sample {
    Move { x: i32, y: i32 },
    Down { x: i32, y: i32 },
    Up,
}

static SAMPLES: OnceLock<Sender<Sample>> = OnceLock::new();

pub fn start(app: AppHandle) {
    let (tx, rx) = mpsc::channel();
    if SAMPLES.set(tx).is_err() {
        return;
    }
    thread::spawn(hook::run_message_loop);
    thread::spawn(move || gestures::Detector::new(app).run(rx));
}

#[cfg(windows)]
mod hook {
    use windows::Win32::Foundation::{HINSTANCE, LPARAM, LRESULT, WPARAM};
    use windows::Win32::System::LibraryLoader::GetModuleHandleW;
    use windows::Win32::UI::WindowsAndMessaging::{
        CallNextHookEx, GetMessageW, SetWindowsHookExW, MSG, MSLLHOOKSTRUCT, WH_MOUSE_LL,
        WM_LBUTTONDOWN, WM_LBUTTONUP, WM_MOUSEMOVE,
    };

    use super::{Sample, SAMPLES};

    unsafe extern "system" fn on_mouse(code: i32, wparam: WPARAM, lparam: LPARAM) -> LRESULT {
        if code >= 0 {
            let info = unsafe { &*(lparam.0 as *const MSLLHOOKSTRUCT) };
            let (x, y) = (info.pt.x, info.pt.y);
            let sample = match wparam.0 as u32 {
                WM_MOUSEMOVE => Some(Sample::Move { x, y }),
                WM_LBUTTONDOWN => Some(Sample::Down { x, y }),
                WM_LBUTTONUP => Some(Sample::Up),
                _ => None,
            };
            if let (Some(sample), Some(tx)) = (sample, SAMPLES.get()) {
                let _ = tx.send(sample);
            }
        }
        unsafe { CallNextHookEx(None, code, wparam, lparam) }
    }

    /// Un hook LL n'est appelé que si son thread pompe des messages.
    pub fn run_message_loop() {
        unsafe {
            let module = GetModuleHandleW(None).ok().map(|m| HINSTANCE(m.0));
            let Ok(_hook) = SetWindowsHookExW(WH_MOUSE_LL, Some(on_mouse), module, 0) else {
                return;
            };
            let mut msg = MSG::default();
            while GetMessageW(&mut msg, None, 0, 0).as_bool() {}
        }
    }
}

#[cfg(not(windows))]
mod hook {
    pub fn run_message_loop() {}
}
