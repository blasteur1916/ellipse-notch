//! Fenêtres réellement sans cadre.
//!
//! Avec `decorations: false`, Tauri cache la barre de titre mais garde le style
//! `WS_CAPTION` ; Windows 11 la dessine alors derrière les zones transparentes
//! (rectangle blanc avec « Ellipse » et une croix autour de l'île). On retire ce
//! style et on coupe le rendu du cadre par DWM. Tauri réapplique ses styles à
//! chaque affichage : appeler `strip` après chaque `show()`.

use tauri::WebviewWindow;

#[cfg(windows)]
pub fn strip(window: &WebviewWindow) {
    use windows::Win32::Foundation::HWND;
    use windows::Win32::Graphics::Dwm::{DwmSetWindowAttribute, DWMNCRP_DISABLED, DWMWA_NCRENDERING_POLICY};
    use windows::Win32::UI::WindowsAndMessaging::{
        GetWindowLongPtrW, SetWindowLongPtrW, SetWindowPos, GWL_STYLE, SWP_FRAMECHANGED, SWP_NOACTIVATE,
        SWP_NOMOVE, SWP_NOSIZE, SWP_NOZORDER, WS_CAPTION, WS_SYSMENU, WS_THICKFRAME,
    };

    let Ok(hwnd) = window.hwnd() else { return };
    let hwnd = HWND(hwnd.0 as _);
    unsafe {
        let policy = DWMNCRP_DISABLED;
        let _ = DwmSetWindowAttribute(
            hwnd,
            DWMWA_NCRENDERING_POLICY,
            &policy as *const _ as *const _,
            size_of_val(&policy) as u32,
        );
        let style = GetWindowLongPtrW(hwnd, GWL_STYLE);
        let frame = (WS_CAPTION | WS_SYSMENU | WS_THICKFRAME).0 as isize;
        if style & frame != 0 {
            SetWindowLongPtrW(hwnd, GWL_STYLE, style & !frame);
            let _ = SetWindowPos(
                hwnd,
                None,
                0,
                0,
                0,
                0,
                SWP_FRAMECHANGED | SWP_NOMOVE | SWP_NOSIZE | SWP_NOZORDER | SWP_NOACTIVATE,
            );
        }
    }
}

#[cfg(not(windows))]
pub fn strip(_: &WebviewWindow) {}
