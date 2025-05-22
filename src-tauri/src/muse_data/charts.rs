use std::fs;

use serde::{Deserialize, Serialize};
use tauri::{AppHandle, Manager};

#[derive(Debug, Serialize, Deserialize)]
pub struct MuseMetadata {
    id: String,
    title: String,
    artists: String,
    chart_author: String,
    bpm: Option<f32>,
    audio: String,
    chart: String,
    img: Option<String>,
}


#[tauri::command]
pub fn get_all_charts(app: AppHandle) -> Result<Vec<MuseMetadata>, String> {
    let app_data_local = app.path().app_local_data_dir().map_err(|e| e.to_string())?;
    match fs::read_dir(app_data_local.join("userdata/charts")) {
        Err(e) => Err(e.to_string()),
        Ok(iter) => Ok(
            iter
                .filter_map(|res| res.ok())
                .filter_map(|file| {
                    if let Ok(contents) = fs::read_to_string(file.path().join("metadata.json")) {
                        if let Ok(metadata) = serde_json::from_str::<MuseMetadata>(&contents) {
                            return Some(metadata);
                        }
                    }
                    None
                })
                .collect(),
        ),
    }
}
