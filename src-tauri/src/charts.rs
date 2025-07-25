use std::{
    fs,
    io::{Cursor, ErrorKind, Read, Seek, Write},
};

use serde::{Deserialize, Serialize};
use tauri::{App, AppHandle, Manager};
use zip::{write::SimpleFileOptions, ZipArchive, ZipWriter};
use filenamify::filenamify;

use crate::UnwrapOrStr;


#[derive(Debug, Serialize, Deserialize)]
pub struct ChartMetadata {
    
    #[serde(default = "gen_id")]
    id: String,
    online_id: Option<String>,
    owner_hash: Option<String>,
    
    title: String,
    difficulty: String,

    bpm: f32,
    first_beat: f32,
    preview_time: f32,
    measure_size: usize,
    snaps: usize,

    audio_ext: String,
    img_ext: Option<String>,

    credit_audio: Option<String>,
    credit_img: Option<String>,
    credit_chart: Option<String>,
}

#[tauri::command]
pub fn get_all_charts(app: AppHandle) -> Result<Vec<ChartMetadata>, String> {
    let charts_dir = app.path().app_local_data_dir().unwrap_or_str()?.join("userdata/charts");
    
    // install default charts if userdata/charts folder didnt exist at first
    let should_install_default_charts = !fs::exists(&charts_dir).unwrap_or_str()?;
    
    fs::create_dir_all(&charts_dir).unwrap_or_str()?;
    
    if should_install_default_charts {
        
        // try to install default charts
        let default_charts_dir = app.path().resource_dir().unwrap_or_str()?.join("resources/default_charts");
        if fs::exists(&default_charts_dir).unwrap_or_str()? {
            for file in fs::read_dir(&default_charts_dir).unwrap_or_str()? {
                let original_filepath = file.unwrap_or_str()?.path();
                
                let filename = original_filepath.clone();
                let filename = filename.file_name().unwrap();
                
                fs::rename(original_filepath, charts_dir.join(&filename)).unwrap_or_str()?;
            }
            fs::remove_dir(default_charts_dir).unwrap_or_str()?;
        }
    }
    
    // read chart metadata of each chart in userdata/charts
    let contents = fs::read_dir(charts_dir).unwrap_or_str()?;
    Ok(
        contents
        .filter_map(|res| res.ok())
        .filter_map(|file| {
            if let Ok(contents) = fs::read_to_string(file.path().join("metadata.json")) {
                if let Ok(metadata) = serde_json::from_str::<ChartMetadata>(&contents) {
                    return Some(metadata);
                }
            }
            None
        })
        .collect()
    )
}

fn install_default_charts(app: &mut App) {
    
}

fn add_file_to_zip<W: Write + Seek>(
    zip: &mut ZipWriter<W>,
    zip_filepath: &str,
    filepath: &str,
) -> Result<(), String> {
    let data = fs::read(filepath).unwrap_or_str()?;

    zip.start_file(zip_filepath, SimpleFileOptions::default()).unwrap_or_str()?;
    zip.write_all(&data).unwrap_or_str()?;

    Ok(())
}

#[tauri::command]
pub fn zip_chart(
    chart_folder: &str,
    audio_ext: &str,
    img_ext: Option<&str>,
) -> Result<Vec<u8>, String> {
    let mut zip = ZipWriter::new(Cursor::new(Vec::new()));
    add_file_to_zip(&mut zip, "chart.txt", &format!("{chart_folder}\\chart.txt"))?;
    add_file_to_zip(
        &mut zip,
        "metadata.json",
        &format!("{chart_folder}\\metadata.json"),
    )?;
    add_file_to_zip(
        &mut zip,
        &format!("audio.{audio_ext}"),
        &format!("{chart_folder}\\audio.{audio_ext}"),
    )?;
    if let Some(img_ext) = img_ext {
        add_file_to_zip(
            &mut zip,
            &format!("img.{img_ext}"),
            &format!("{chart_folder}\\img.{img_ext}"),
        )?;
    }

    let zip_buffer = zip.finish().unwrap_or_str()?.into_inner();
    Ok(zip_buffer)
}

#[tauri::command]
pub fn unzip_chart(app: AppHandle, buffer: Vec<u8>) -> Result<ChartMetadata, String> {
    
    let mut zip = ZipArchive::new(Cursor::new(buffer)).unwrap_or_str()?;
    
    // read metadata
    let mut metadata_json = String::new();
    {
        let mut metadata_file = zip.by_name("metadata.json").unwrap_or_str()?;
        metadata_file.read_to_string(&mut metadata_json).unwrap_or_str()?;
    }
    
    let metadata: ChartMetadata = serde_json::from_str(&metadata_json).unwrap_or_str()?;
    
    // find chart folder
    let app_data_local = app.path().app_local_data_dir().unwrap_or_str()?;
    let chart_folder = app_data_local.join(format!("userdata/charts/{} {}", metadata.id, filenamify(&metadata.title)));
    let chart_folder = chart_folder.to_str().unwrap();
    
    // create chart folder
    fs::create_dir(chart_folder).unwrap_or_str()?;
    
    // extract chart files
    fs::write(format!("{chart_folder}\\metadata.json"), serde_json::to_string(&metadata).unwrap_or_str()?).unwrap_or_str()?;
    extract_from_zip(&mut zip, "chart.txt", &format!("{chart_folder}\\chart.txt"))?;
    extract_from_zip(&mut zip, &format!("audio.{}", metadata.audio_ext), &format!("{chart_folder}\\audio.{}", metadata.audio_ext))?;
    if let Some(img_ext) = &metadata.img_ext {
        extract_from_zip(&mut zip, &format!("img.{img_ext}"), &format!("{chart_folder}\\img.{img_ext}"))?;
    }
    
    Ok(metadata)
}

fn extract_from_zip<R: Read + Seek>(
    zip: &mut ZipArchive<R>,
    filename: &str,
    dest: &str,
) -> Result<(), String> {
    
    let mut file = zip.by_name(filename).unwrap_or_str()?;
    let mut buf: Vec<u8> = Vec::with_capacity(file.size() as usize);
    file.read_to_end(&mut buf).unwrap_or_str()?;
    fs::write(dest, buf).unwrap_or_str()?;
    
    Ok(())
}

pub fn gen_id() -> String {
    let mut res = [' '; 10];
    
    for i in 0..res.len() {
        res[i] = to_base64_symbol(rand::random::<u8>() & 63)
    }

    res.iter().collect()
}

fn to_base64_symbol(num: u8) -> char {
    if      num < 10    { (num      + '0' as u8) as char }
    else if num < 36    { (num - 10 + 'a' as u8) as char }
    else if num < 62    { (num - 36 + 'A' as u8) as char }
    else if num == 62   { '-' }
    else if num == 63   { '_' }
    else                { panic!("cant convert num > 63 to a base64 symbol") }
}