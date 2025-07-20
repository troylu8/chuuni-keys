use std::{
    fs,
    io::{Cursor, Read, Seek, Write},
};

use serde::{Deserialize, Serialize};
use tauri::{AppHandle, Manager};
use zip::{write::SimpleFileOptions, ZipArchive, ZipWriter};
use filenamify::filenamify;


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
    let app_data_local = app.path().app_local_data_dir().map_err(|e| e.to_string())?;
    match fs::read_dir(app_data_local.join("userdata/charts")) {
        Err(e) => Err(e.to_string()),
        Ok(iter) => Ok(iter
            .filter_map(|res| res.ok())
            .filter_map(|file| {
                if let Ok(contents) = fs::read_to_string(file.path().join("metadata.json")) {
                    if let Ok(metadata) = serde_json::from_str::<ChartMetadata>(&contents) {
                        return Some(metadata);
                    }
                }
                None
            })
            .collect()),
    }
}

fn add_file_to_zip<W: Write + Seek>(
    zip: &mut ZipWriter<W>,
    zip_filepath: &str,
    filepath: &str,
) -> Result<(), String> {
    let data = fs::read(filepath).map_err(|e| e.to_string())?;

    zip.start_file(zip_filepath, SimpleFileOptions::default())
        .map_err(|e| e.to_string())?;
    zip.write_all(&data).map_err(|e| e.to_string())?;

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

    let zip_buffer = zip.finish().map_err(|e| e.to_string())?.into_inner();
    Ok(zip_buffer)
}

#[tauri::command]
pub fn unzip_chart(app: AppHandle, buffer: Vec<u8>) -> Result<ChartMetadata, String> {
    
    println!("read zip", );
    let mut zip = ZipArchive::new(Cursor::new(buffer)).map_err(|e| e.to_string())?;
    
    // read metadata
    let mut metadata_json = String::new();
    {
        println!("reading md", );
        let mut metadata_file = zip.by_name("metadata.json").map_err(|e| e.to_string())?;
        metadata_file.read_to_string(&mut metadata_json).map_err(|e| e.to_string())?;
    }
    
    println!("deserializing", );
    let metadata: ChartMetadata = serde_json::from_str(&metadata_json).map_err(|e| e.to_string())?;
    
    println!("extracting", );
    // find chart folder
    let app_data_local = app.path().app_local_data_dir().map_err(|e| e.to_string())?;
    let chart_folder = app_data_local.join(format!("userdata/charts/{} {}", metadata.id, filenamify(&metadata.title)));
    let chart_folder = chart_folder.to_str().unwrap();
    
    // create chart folder exists
    fs::create_dir(chart_folder).map_err(|e| e.to_string())?;
    
    // extract chart files
    fs::write(format!("{chart_folder}\\metadata.json"), serde_json::to_string(&metadata).map_err(|e| e.to_string())?).map_err(|e| e.to_string())?;
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
    
    let mut file = zip.by_name(filename).map_err(|e| e.to_string())?;
    let mut buf: Vec<u8> = Vec::with_capacity(file.size() as usize);
    file.read_to_end(&mut buf).map_err(|e| e.to_string())?;
    fs::write(dest, buf).map_err(|e| e.to_string())?;
    
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