mod muse;
mod muse_data;

use muse::{MuseEvent, MuseReader};
use muse_data::get_user_data;
use muse_data::charts::get_all_charts;
use std::sync::Mutex;
use tauri::{AppHandle, Emitter, Manager, State};

#[macro_export]
macro_rules! clone {
    ( ($( $x:ident ),*) $y:expr ) => {
        {
            $(let $x = $x.clone();)*
            $y
        }
    };
}

const HITRING_DURATION_MS: usize = 500;

fn on_muse_start(app: AppHandle) -> impl FnOnce() {
    move || {
        app.emit("start-chart", ()).unwrap();
    }
}
fn on_muse_event(app: AppHandle) -> impl FnMut(MuseEvent) {
    move |MuseEvent(event_time, event)| {
        println!("sending muse event {}", event);
        app.emit(&event, event_time).unwrap();
    }
}

#[tauri::command]
fn game_start(
    app: AppHandle,
    state: State<'_, Mutex<AppState>>,
    chart_path: &str,
) -> Result<(), String> {
    let mut state = state.lock().unwrap();
    state.muse_reader = None; // drop old muse reader to stop existing playback

    let muse_reader = MuseReader::new(chart_path).map_err(|e| e.to_string())?;
    muse_reader.play(
        HITRING_DURATION_MS,
        on_muse_start(app.clone()),
        on_muse_event(app),
    );

    state.muse_reader = Some(muse_reader);

    Ok(())
}

#[tauri::command]
fn game_pause(state: State<'_, Mutex<AppState>>) {
    let state = state.lock().unwrap();
    if let Some(muse_reader) = &state.muse_reader {
        muse_reader.pause();
    }
}

#[tauri::command]
fn game_resume(app: AppHandle, state: State<'_, Mutex<AppState>>) {
    let state = state.lock().unwrap();
    if let Some(muse_reader) = &state.muse_reader {
        muse_reader.play(HITRING_DURATION_MS, || {}, on_muse_event(app));
    }
}

#[tauri::command]
fn game_stop(state: State<'_, Mutex<AppState>>) {
    let mut state = state.lock().unwrap();
    state.muse_reader = None;
}

#[derive(Debug, Default)]
struct AppState {
    muse_reader: Option<MuseReader>,
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            game_start,
            game_pause,
            game_resume,
            game_stop,
            get_all_charts,
            get_user_data
        ])
        .setup(|app| {
            app.manage(Mutex::new(AppState::default()));
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
