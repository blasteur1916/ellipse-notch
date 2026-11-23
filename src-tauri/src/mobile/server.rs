use std::sync::atomic::{AtomicU64, Ordering};

use axum::body::Body;
use axum::extract::ws::{Message, WebSocket, WebSocketUpgrade};
use axum::extract::{DefaultBodyLimit, Path, Query, State};
use axum::http::{header, StatusCode};
use axum::response::{Html, IntoResponse, Response};
use axum::routing::{get, post};
use axum::Router;
use futures_util::{SinkExt, StreamExt};
use serde::Deserialize;
use tauri::{AppHandle, Manager};
use tokio::io::AsyncWriteExt;
use tokio::net::TcpListener;
use tokio_util::io::ReaderStream;

use super::{emit_drag, emit_status, received_dir, unique_path, Mobile};
use crate::stash::{Source, Stash};

/// Port préféré (stable d'un lancement à l'autre) ; repli sur un port libre.
const PORT: u16 = 47821;
const PAGE: &str = include_str!("page.html");
/// Logo d'Ellipse (même fichier que l'icône Windows).
const ICON: &[u8] = include_bytes!("../../icons/icon.png");
const MANIFEST: &str = r##"{"name":"Ellipse","short_name":"Ellipse","display":"standalone","background_color":"#000000","theme_color":"#000000","icons":[{"src":"/icon.png","sizes":"512x512","type":"image/png"}]}"##;

static NEXT_CLIENT: AtomicU64 = AtomicU64::new(1);

pub fn start(app: &AppHandle) {
    let app = app.clone();
    tauri::async_runtime::spawn(async move {
        let listener = match TcpListener::bind(("0.0.0.0", PORT)).await {
            Ok(listener) => listener,
            Err(_) => match TcpListener::bind(("0.0.0.0", 0)).await {
                Ok(listener) => listener,
                Err(_) => return,
            },
        };
        let (Ok(addr), Ok(ip)) = (listener.local_addr(), local_ip_address::local_ip()) else {
            return;
        };
        {
            let mobile = app.state::<Mobile>();
            *mobile.port.lock().unwrap() = Some(addr.port());
            *mobile.url.lock().unwrap() =
                Some(format!("http://{ip}:{}/?t={}", addr.port(), mobile.token));
        }
        emit_status(&app);

        let router = Router::new()
            .route("/", get(|| async { Html(PAGE) }))
            .route("/icon.png", get(|| async { ([(header::CONTENT_TYPE, "image/png")], ICON) }))
            .route(
                "/manifest.webmanifest",
                get(|| async { ([(header::CONTENT_TYPE, "application/manifest+json")], MANIFEST) }),
            )
            .route("/ws", get(socket))
            .route("/upload", post(upload))
            .route("/files/{id}", get(download))
            .layer(DefaultBodyLimit::disable())
            .with_state(app);
        let _ = axum::serve(listener, router).await;
    });
}

#[derive(Deserialize)]
struct Auth {
    t: String,
}

impl Auth {
    fn valid(&self, app: &AppHandle) -> bool {
        self.t == app.state::<Mobile>().token
    }
}

async fn socket(
    State(app): State<AppHandle>,
    Query(auth): Query<Auth>,
    upgrade: WebSocketUpgrade,
) -> Response {
    if !auth.valid(&app) {
        return StatusCode::FORBIDDEN.into_response();
    }
    upgrade.on_upgrade(move |socket| client(app, socket))
}

#[derive(Deserialize)]
#[serde(tag = "type", rename_all = "snake_case")]
enum ClientMessage {
    Hello { device: String },
    DragStart,
    DragEnd,
}

async fn client(app: AppHandle, socket: WebSocket) {
    let id = NEXT_CLIENT.fetch_add(1, Ordering::Relaxed);
    let (mut sink, mut stream) = socket.split();
    let (backlog, mut updates) = {
        let mobile = app.state::<Mobile>();
        (mobile.shared_messages(), mobile.broadcast.subscribe())
    };

    let writer = tokio::spawn(async move {
        for message in backlog {
            if sink.send(Message::Text(message.into())).await.is_err() {
                return;
            }
        }
        while let Ok(message) = updates.recv().await {
            if sink.send(Message::Text(message.into())).await.is_err() {
                return;
            }
        }
    });

    while let Some(Ok(message)) = stream.next().await {
        let Message::Text(text) = message else { continue };
        match serde_json::from_str::<ClientMessage>(&text) {
            Ok(ClientMessage::Hello { device }) => {
                let name: String = device.chars().take(40).collect();
                app.state::<Mobile>().devices.lock().unwrap().insert(id, name);
                emit_status(&app);
            }
            Ok(ClientMessage::DragStart) => emit_drag(&app, true),
            Ok(ClientMessage::DragEnd) => emit_drag(&app, false),
            Err(_) => {}
        }
    }

    writer.abort();
    app.state::<Mobile>().devices.lock().unwrap().remove(&id);
    emit_status(&app);
    emit_drag(&app, false);
}

#[derive(Deserialize)]
struct UploadQuery {
    t: String,
    name: String,
}

async fn upload(
    State(app): State<AppHandle>,
    Query(query): Query<UploadQuery>,
    body: Body,
) -> StatusCode {
    if query.t != app.state::<Mobile>().token {
        return StatusCode::FORBIDDEN;
    }
    // Seul le nom de fichier est retenu : aucun chemin fourni par le client.
    let name = std::path::Path::new(&query.name)
        .file_name()
        .map(|n| n.to_string_lossy().into_owned())
        .filter(|n| !n.is_empty() && n != "." && n != "..")
        .unwrap_or_else(|| "fichier".into());
    let Some(dir) = received_dir(&app) else {
        return StatusCode::INTERNAL_SERVER_ERROR;
    };
    let path = unique_path(&dir, &name);

    let result = async {
        let mut file = tokio::fs::File::create(&path).await?;
        let mut chunks = body.into_data_stream();
        while let Some(chunk) = chunks.next().await {
            file.write_all(&chunk.map_err(std::io::Error::other)?).await?;
        }
        file.flush().await
    }
    .await;

    emit_drag(&app, false);
    match result {
        Ok(()) => {
            app.state::<Stash>().add(&app, &path, Source::Mobile);
            StatusCode::OK
        }
        Err(_) => {
            let _ = tokio::fs::remove_file(&path).await;
            StatusCode::INTERNAL_SERVER_ERROR
        }
    }
}

#[derive(Deserialize)]
struct DownloadQuery {
    t: String,
    #[serde(default)]
    inline: bool,
}

async fn download(
    State(app): State<AppHandle>,
    Path(id): Path<String>,
    Query(query): Query<DownloadQuery>,
) -> Response {
    let mobile = app.state::<Mobile>();
    if query.t != mobile.token {
        return StatusCode::FORBIDDEN.into_response();
    }
    let Some(shared) = mobile.shared_file(&id) else {
        return StatusCode::NOT_FOUND.into_response();
    };
    let Ok(file) = tokio::fs::File::open(&shared.path).await else {
        return StatusCode::NOT_FOUND.into_response();
    };
    let disposition = if query.inline { "inline" } else { "attachment" };
    Response::builder()
        .header(header::CONTENT_TYPE, mime_for(&shared.name))
        .header(header::CONTENT_LENGTH, shared.size)
        .header(
            header::CONTENT_DISPOSITION,
            format!("{disposition}; filename*=UTF-8''{}", percent_encode(&shared.name)),
        )
        .body(Body::from_stream(ReaderStream::new(file)))
        .unwrap_or_else(|_| StatusCode::INTERNAL_SERVER_ERROR.into_response())
}

fn mime_for(name: &str) -> &'static str {
    let ext = name.rsplit('.').next().unwrap_or_default().to_ascii_lowercase();
    match ext.as_str() {
        "png" => "image/png",
        "jpg" | "jpeg" => "image/jpeg",
        "gif" => "image/gif",
        "webp" => "image/webp",
        "heic" => "image/heic",
        "svg" => "image/svg+xml",
        "mp4" | "m4v" => "video/mp4",
        "mov" => "video/quicktime",
        "webm" => "video/webm",
        "mp3" => "audio/mpeg",
        "pdf" => "application/pdf",
        "txt" | "md" => "text/plain; charset=utf-8",
        "zip" => "application/zip",
        _ => "application/octet-stream",
    }
}

fn percent_encode(value: &str) -> String {
    value
        .bytes()
        .map(|b| match b {
            b'A'..=b'Z' | b'a'..=b'z' | b'0'..=b'9' | b'-' | b'_' | b'.' | b'~' => {
                (b as char).to_string()
            }
            _ => format!("%{b:02X}"),
        })
        .collect()
}
