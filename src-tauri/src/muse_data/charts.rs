use std::fs;

use serde::{Deserialize, Serialize};
use tauri::{AppHandle, Manager};

#[derive(Debug, Serialize, Deserialize)]
pub struct MuseMetadata {
    id: String,
    title: String,
    artists: String,
    chart_author: String,
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

fn gen_id() -> String {
    let mut res = [' '; 10];

    for i in 0..res.len() {
        res[i] = to_base64_symbol(rand::random::<u8>() & 63)
    }

    res.iter().collect()
}
fn to_base64_symbol(num: u8) -> char {
    if num < 10 {
        ('0' as u8 + num) as char
    } else if num < 36 {
        (num - 10 + 'a' as u8) as char
    } else if num < 62 {
        (num - 36 + 'A' as u8) as char
    } else if num == 62 {
        '-'
    } else if num == 63 {
        '_'
    } else {
        panic!("cant convert num > 63 to a base64 symbol")
    }
}
