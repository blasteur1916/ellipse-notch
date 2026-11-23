//! Transfert par câble USB (Android).
//!
//! Quand un téléphone Android est branché avec le débogage USB activé,
//! `adb reverse` fait correspondre `127.0.0.1:47821` côté téléphone au serveur
//! du PC : l'app mobile utilise alors exactement le même protocole qu'en Wi-Fi,
//! sans réseau. (iOS n'offre pas d'équivalent accessible sans Mac.)

use std::collections::HashSet;
use std::path::PathBuf;
use std::process::Command;
use std::thread;
use std::time::Duration;

use tauri::{AppHandle, Manager};

use super::Mobile;

/// Port attendu par l'app mobile côté téléphone.
const PHONE_PORT: u16 = 47821;
const POLL: Duration = Duration::from_secs(3);

pub fn spawn_usb_bridge(app: AppHandle) {
    thread::spawn(move || {
        let Some(adb) = find_adb() else { return };
        let mut bridged = HashSet::new();
        loop {
            thread::sleep(POLL);
            let Some(port) = *app.state::<Mobile>().port.lock().unwrap() else {
                continue;
            };
            let devices = connected_devices(&adb);
            for serial in devices.difference(&bridged) {
                let rule = [format!("tcp:{PHONE_PORT}"), format!("tcp:{port}")];
                let _ = adb_command(&adb).args(["-s", serial, "reverse", &rule[0], &rule[1]]).output();
            }
            bridged = devices;
        }
    });
}

fn find_adb() -> Option<PathBuf> {
    let exe = if cfg!(windows) { "adb.exe" } else { "adb" };
    let mut candidates: Vec<PathBuf> = ["ANDROID_HOME", "ANDROID_SDK_ROOT"]
        .iter()
        .filter_map(|var| std::env::var_os(var))
        .map(|sdk| PathBuf::from(sdk).join("platform-tools").join(exe))
        .collect();
    if let Some(local) = std::env::var_os("LOCALAPPDATA") {
        candidates.push(PathBuf::from(local).join("Android/Sdk/platform-tools").join(exe));
    }
    if let Some(path) = std::env::var_os("PATH") {
        candidates.extend(std::env::split_paths(&path).map(|dir| dir.join(exe)));
    }
    candidates.into_iter().find(|p| p.is_file())
}

/// Numéros de série des appareils autorisés (`adb devices`, état « device »).
fn connected_devices(adb: &PathBuf) -> HashSet<String> {
    let Ok(output) = adb_command(adb).arg("devices").output() else {
        return HashSet::new();
    };
    String::from_utf8_lossy(&output.stdout)
        .lines()
        .skip(1)
        .filter_map(|line| {
            let mut parts = line.split_whitespace();
            match (parts.next(), parts.next()) {
                (Some(serial), Some("device")) => Some(serial.to_string()),
                _ => None,
            }
        })
        .collect()
}

fn adb_command(adb: &PathBuf) -> Command {
    let mut command = Command::new(adb);
    #[cfg(windows)]
    {
        // Pas de fenêtre console qui clignote toutes les 3 secondes.
        use std::os::windows::process::CommandExt;
        const CREATE_NO_WINDOW: u32 = 0x0800_0000;
        command.creation_flags(CREATE_NO_WINDOW);
    }
    command
}
