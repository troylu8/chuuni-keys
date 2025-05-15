use std::{env, path::PathBuf};

use charts::{get_all_charts, MuseMetadata};
use serde::Serialize;


pub mod charts;


#[derive(Debug, Serialize)]
pub struct MuseData {
    base_dir: PathBuf,
    charts: Vec<MuseMetadata>,
}

#[tauri::command]
pub fn get_user_data() -> Result<MuseData, String> {
    Ok( MuseData {
        base_dir: match env::current_dir() {
            Ok(path) => path.join("data"),
            Err(e) => return Err(e.to_string())
        },
        charts: get_all_charts()?
    } )
}