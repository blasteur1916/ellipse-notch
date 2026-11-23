use std::sync::mpsc::Receiver;
use std::time::{Duration, Instant};

use tauri::{AppHandle, Manager};

use super::Sample;
use crate::satellite;
use crate::settings::SettingsStore;

/// Distance minimale avant de considérer qu'un drag a commencé.
const DRAG_START: i32 = 16;
/// Course horizontale minimale entre deux demi-tours.
const SHAKE_TRAVEL: i32 = 36;
/// Nombre de demi-tours rapprochés qui forment une secousse.
const SHAKE_REVERSALS: usize = 4;
const SHAKE_WINDOW: Duration = Duration::from_millis(750);
/// Cadence maximale de déplacement de l'orbe (≈ 120 Hz).
const FOLLOW_INTERVAL: Duration = Duration::from_millis(8);

pub struct Detector {
    app: AppHandle,
    pressed: Option<(i32, i32)>,
    dragging: bool,
    /// L'orbe est accrochée au curseur (après une secousse).
    attached: bool,
    last_follow: Instant,
    last_x: i32,
    direction: i32,
    travel: i32,
    reversals: Vec<Instant>,
}

impl Detector {
    pub fn new(app: AppHandle) -> Self {
        Self {
            app,
            pressed: None,
            dragging: false,
            attached: false,
            last_follow: Instant::now(),
            last_x: 0,
            direction: 0,
            travel: 0,
            reversals: Vec::new(),
        }
    }

    pub fn run(mut self, rx: Receiver<Sample>) {
        for sample in rx {
            match sample {
                Sample::Down { x, y } => self.on_down(x, y),
                Sample::Move { x, y } => self.on_move(x, y),
                Sample::Up => self.on_up(),
            }
        }
    }

    fn on_down(&mut self, x: i32, y: i32) {
        self.pressed = Some((x, y));
        self.dragging = false;
        self.attached = false;
        self.last_x = x;
        self.direction = 0;
        self.travel = 0;
        self.reversals.clear();
    }

    fn on_up(&mut self) {
        self.pressed = None;
        self.dragging = false;
        if self.attached {
            self.attached = false;
            satellite::release(&self.app);
        }
    }

    fn on_move(&mut self, x: i32, y: i32) {
        let Some((sx, sy)) = self.pressed else { return };
        if !self.dragging {
            if (x - sx).abs().max((y - sy).abs()) < DRAG_START {
                return;
            }
            // On ignore les drags de fenêtres (barre de titre, redimensionnement).
            if win::moving_window() {
                self.pressed = None;
                return;
            }
            self.dragging = true;
        }

        if self.attached {
            if self.last_follow.elapsed() >= FOLLOW_INTERVAL {
                self.last_follow = Instant::now();
                satellite::follow(&self.app, x, y);
            }
            return;
        }

        let shake_enabled = self.app.state::<SettingsStore>().get().shake_to_stash;
        if shake_enabled && self.detect_shake(x) {
            self.attached = true;
            satellite::attach(&self.app, x, y);
        }
    }

    /// Secousse = plusieurs demi-tours horizontaux amples en peu de temps.
    fn detect_shake(&mut self, x: i32) -> bool {
        let dx = x - self.last_x;
        self.last_x = x;
        if dx == 0 {
            return false;
        }
        let dir = dx.signum();
        if dir == self.direction {
            self.travel += dx.abs();
            return false;
        }
        if self.direction != 0 && self.travel >= SHAKE_TRAVEL {
            let now = Instant::now();
            self.reversals.push(now);
            self.reversals.retain(|t| now.duration_since(*t) <= SHAKE_WINDOW);
        }
        self.direction = dir;
        self.travel = dx.abs();
        self.reversals.len() >= SHAKE_REVERSALS
    }
}

#[cfg(windows)]
mod win {
    use windows::Win32::UI::WindowsAndMessaging::{GetGUIThreadInfo, GUITHREADINFO, GUI_INMOVESIZE};

    /// Vrai si le thread au premier plan est en train de déplacer/redimensionner une fenêtre.
    pub fn moving_window() -> bool {
        let mut info = GUITHREADINFO {
            cbSize: size_of::<GUITHREADINFO>() as u32,
            ..Default::default()
        };
        unsafe { GetGUIThreadInfo(0, &mut info).is_ok() && info.flags.contains(GUI_INMOVESIZE) }
    }
}

#[cfg(not(windows))]
mod win {
    pub fn moving_window() -> bool {
        false
    }
}
