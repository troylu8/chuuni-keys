mod muse;
use std::{fs, sync::Mutex};

use muse::{MuseEvent, MuseReader};
use tauri::{AppHandle, Emitter, Manager, State};

#[tauri::command]
fn start_chart(app: AppHandle, state: State<'_, Mutex<AppState>>, filepath: &str) -> Result<String, String> {
    println!("got start chart", );
    let mut state = state.lock().unwrap();
    state.muse_reader = None; // drop old muse reader to stop existing playback
    
    let muse_reader = MuseReader::new(filepath).map_err(|e| e.to_string() )?;
    
    muse_reader.play(100, move |MuseEvent(timestamp, event)| {
        println!("sending {:?} {} to frontend", event, timestamp);
        app.emit(&event, timestamp).unwrap();
    });
    
    state.muse_reader = Some(muse_reader);
    Ok(fs::read_to_string(filepath).unwrap())
}

#[derive(Debug, Default)]
struct AppState {
    muse_reader: Option<MuseReader>
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![start_chart])
        .setup(|app| {
            app.manage(Mutex::new(AppState::default()));
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
