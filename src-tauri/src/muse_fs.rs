use std::{
    env,
    error::Error,
    fs::{self, File},
    path::PathBuf,
};

use serde::{Deserialize, Serialize};

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

#[derive(Serialize)]
pub struct GetAllSongsResp {
    charts_dir: PathBuf,
    charts: Vec<MuseMetadata>,
}

#[tauri::command]
pub fn get_all_songs() -> Result<GetAllSongsResp, String> {
    match fs::read_dir("charts") {
        Err(e) => Err(e.to_string()),
        Ok(iter) => Ok(GetAllSongsResp {
            charts_dir: match env::current_dir() {
                Err(e) => return Err(e.to_string()),
                Ok(path) => path.join("charts"),
            },

            charts: iter
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
        }),
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
