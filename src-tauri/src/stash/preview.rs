//! Aperçus de fichiers.
//!
//! - Miniature native Windows (la même que l'Explorateur) via
//!   `IShellItemImageFactory` : images, PDF, vidéos, documents Office…
//! - Extrait textuel pour les formats texte (notes, code, CSV…).

use std::collections::HashMap;
use std::fs::File;
use std::io::Read;
use std::path::{Path, PathBuf};
use std::sync::Mutex;
use std::time::SystemTime;

use base64::Engine;
use serde::Serialize;
use tauri::State;

const THUMB_SIZE: i32 = 320;
const TEXT_BYTES: usize = 2048;
const TEXT_CHARS: usize = 240;
const TEXT_EXTENSIONS: &[&str] = &[
    "txt", "md", "markdown", "log", "csv", "json", "yml", "yaml", "toml", "ini", "xml", "html",
    "css", "js", "ts", "tsx", "jsx", "rs", "py", "sh", "ps1", "sql",
];

#[derive(Clone, Serialize)]
#[serde(tag = "kind", rename_all = "camelCase")]
pub enum Preview {
    Image { src: String, width: u32, height: u32 },
    Text { text: String },
    None,
}

/// Cache mémoire indexé par chemin + date de modification.
#[derive(Default)]
pub struct PreviewCache(Mutex<HashMap<(PathBuf, Option<SystemTime>), Preview>>);

#[tauri::command]
pub async fn stash_preview(cache: State<'_, PreviewCache>, path: PathBuf) -> Result<Preview, ()> {
    let modified = std::fs::metadata(&path).and_then(|m| m.modified()).ok();
    let key = (path.clone(), modified);
    if let Some(hit) = cache.0.lock().unwrap().get(&key) {
        return Ok(hit.clone());
    }
    let preview = tauri::async_runtime::spawn_blocking(move || build(&path))
        .await
        .unwrap_or(Preview::None);
    cache.0.lock().unwrap().insert(key, preview.clone());
    Ok(preview)
}

fn build(path: &Path) -> Preview {
    let ext = path
        .extension()
        .and_then(|e| e.to_str())
        .map(str::to_ascii_lowercase)
        .unwrap_or_default();
    if TEXT_EXTENSIONS.contains(&ext.as_str()) {
        if let Some(text) = text_excerpt(path, &ext) {
            return Preview::Text { text };
        }
    }
    shell::thumbnail(path, THUMB_SIZE)
        .and_then(|(rgba, w, h)| encode_png(&rgba, w, h).map(|png| (png, w, h)))
        .map(|(png, width, height)| Preview::Image {
            src: format!(
                "data:image/png;base64,{}",
                base64::engine::general_purpose::STANDARD.encode(png)
            ),
            width,
            height,
        })
        .unwrap_or(Preview::None)
}

fn text_excerpt(path: &Path, ext: &str) -> Option<String> {
    let mut buf = vec![0; TEXT_BYTES];
    let n = File::open(path).ok()?.read(&mut buf).ok()?;
    let raw = String::from_utf8_lossy(&buf[..n]);
    let lines = raw.lines().map(|line| {
        let line = line.trim();
        if matches!(ext, "md" | "markdown") {
            line.trim_start_matches(['#', '>', '-', '*', ' ']).replace(['*', '`', '_'], "")
        } else {
            line.to_string()
        }
    });
    let text = lines.filter(|l| !l.is_empty()).collect::<Vec<_>>().join(" ");
    let text: String = text.chars().take(TEXT_CHARS).collect();
    (!text.is_empty()).then_some(text)
}

fn encode_png(rgba: &[u8], width: u32, height: u32) -> Option<Vec<u8>> {
    let mut out = Vec::new();
    let mut encoder = png::Encoder::new(&mut out, width, height);
    encoder.set_color(png::ColorType::Rgba);
    encoder.set_depth(png::BitDepth::Eight);
    encoder.write_header().ok()?.write_image_data(rgba).ok()?;
    Some(out)
}

#[cfg(windows)]
mod shell {
    use std::os::windows::ffi::OsStrExt;
    use std::path::Path;

    use windows::core::PCWSTR;
    use windows::Win32::Foundation::SIZE;
    use windows::Win32::Graphics::Gdi::{
        DeleteObject, GetDC, GetDIBits, GetObjectW, ReleaseDC, BITMAP, BITMAPINFO,
        BITMAPINFOHEADER, BI_RGB, DIB_RGB_COLORS, HGDIOBJ,
    };
    use windows::Win32::System::Com::{CoInitializeEx, COINIT_APARTMENTTHREADED};
    use windows::Win32::UI::Shell::{
        IShellItemImageFactory, SHCreateItemFromParsingName, SIIGBF_RESIZETOFIT,
        SIIGBF_THUMBNAILONLY,
    };

    /// Retourne (RGBA, largeur, hauteur), ou `None` si Windows n'a pas de vraie
    /// miniature pour ce type (on n'accepte pas l'icône générique).
    pub fn thumbnail(path: &Path, size: i32) -> Option<(Vec<u8>, u32, u32)> {
        let wide: Vec<u16> = path.as_os_str().encode_wide().chain([0]).collect();
        unsafe {
            let _ = CoInitializeEx(None, COINIT_APARTMENTTHREADED);
            let factory: IShellItemImageFactory =
                SHCreateItemFromParsingName(PCWSTR(wide.as_ptr()), None).ok()?;
            let bitmap = factory
                .GetImage(SIZE { cx: size, cy: size }, SIIGBF_RESIZETOFIT | SIIGBF_THUMBNAILONLY)
                .ok()?;
            let object = HGDIOBJ(bitmap.0);

            let mut info = BITMAP::default();
            GetObjectW(object, size_of::<BITMAP>() as i32, Some(&mut info as *mut _ as *mut _));
            let (w, h) = (info.bmWidth, info.bmHeight);

            let mut header = BITMAPINFO {
                bmiHeader: BITMAPINFOHEADER {
                    biSize: size_of::<BITMAPINFOHEADER>() as u32,
                    biWidth: w,
                    biHeight: -h, // top-down
                    biPlanes: 1,
                    biBitCount: 32,
                    biCompression: BI_RGB.0,
                    ..Default::default()
                },
                ..Default::default()
            };
            let mut pixels = vec![0u8; (w * h * 4) as usize];
            let dc = GetDC(None);
            let lines = GetDIBits(
                dc,
                bitmap,
                0,
                h as u32,
                Some(pixels.as_mut_ptr() as *mut _),
                &mut header,
                DIB_RGB_COLORS,
            );
            ReleaseDC(None, dc);
            let _ = DeleteObject(object);
            if lines == 0 || w <= 0 || h <= 0 {
                return None;
            }

            // BGRA -> RGBA. Les miniatures opaques ont souvent un alpha à 0.
            let opaque = pixels.chunks_exact(4).all(|p| p[3] == 0);
            for p in pixels.chunks_exact_mut(4) {
                p.swap(0, 2);
                if opaque {
                    p[3] = 255;
                }
            }
            Some((pixels, w as u32, h as u32))
        }
    }
}

#[cfg(not(windows))]
mod shell {
    pub fn thumbnail(_: &std::path::Path, _: i32) -> Option<(Vec<u8>, u32, u32)> {
        None
    }
}
