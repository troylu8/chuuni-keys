mod muse;
use std::{fs, sync::Mutex, time::Duration};

use muse::{MuseEvent, MuseReader};
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

#[tauri::command]
fn start_chart(app: AppHandle, state: State<'_, Mutex<AppState>>, filepath: &str) -> Result<String, String> {
    let mut state = state.lock().unwrap();
    state.muse_reader = None; // drop old muse reader to stop existing playback
    
    let muse_reader = MuseReader::new(filepath).map_err(|e| e.to_string() )?;
    muse_reader.play(
        500, 
        clone! ( (app) move |start_time| {
            println!("sending start-chart {}", start_time);
            app.emit("start-chart", start_time).unwrap();
        }),
        clone! ( (app) move |MuseEvent(event_time, event)| {
            println!("sending muse event {}", event);
            app.emit(&event, event_time).unwrap();
        }),
    );
    
    state.muse_reader = Some(muse_reader);
    Ok(fs::read_to_string(filepath).unwrap())
}

#[tauri::command]
fn pause(state: State<'_, Mutex<AppState>>) {
    let state = state.lock().unwrap();
    if let Some(muse_reader) = &state.muse_reader {
        muse_reader.pause();
    }
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
