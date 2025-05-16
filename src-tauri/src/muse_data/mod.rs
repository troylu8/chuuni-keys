use std::{env, path::PathBuf};

use charts::{get_all_charts, MuseMetadata};
use serde::Serialize;
use tauri::{AppHandle, Manager};


pub mod charts;


#[derive(Debug, Serialize)]
pub struct MuseData {
    base_dir: PathBuf,
    charts: Vec<MuseMetadata>,
}

#[tauri::command]
pub fn get_user_data(app: AppHandle) -> Result<MuseData, String> {
    Ok( MuseData {
        base_dir: app.path().app_local_data_dir().map_err(|e| e.to_string())?.join("userData"),
        charts: get_all_charts(app)?
    })
}