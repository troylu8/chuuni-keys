use std::{fs, io::{Cursor, Seek, Write}};

use zip::{write::SimpleFileOptions, ZipWriter};


pub fn add_file<W: Write + Seek>(zip: &mut ZipWriter<W>, zip_filepath: &str, filepath: &str) -> Result<(), String> {
    let data = fs::read(filepath).map_err(|e| e.to_string())?;
    
    zip.start_file(zip_filepath, SimpleFileOptions::default()).map_err(|e| e.to_string())?;
    zip.write_all(&data).map_err(|e| e.to_string())?;
    
    Ok(())
}

#[tauri::command]
pub fn publish(chart_folder: &str, audio_ext: &str, img_ext: Option<&str>) -> Result<(String, String), String> {
    
    let mut zip = ZipWriter::new(Cursor::new(Vec::new()));
    add_file(&mut zip, "chart.txt", &format!("{chart_folder}\\chart.txt"))?;
    add_file(&mut zip, "metadata.json", &format!("{chart_folder}\\metadata.json"))?;
    add_file(&mut zip, &format!("audio.{audio_ext}"), &format!("{chart_folder}\\audio.{audio_ext}"))?;
    if let Some(img_ext) = img_ext {
        add_file(&mut zip, &format!("img.{img_ext}"), &format!("{chart_folder}\\img.{img_ext}"))?;
    }
    
    let zip_buffer = zip.finish().map_err(|e| e.to_string())?.into_inner();
    
    
    Ok(("id".to_string(), "deletion pass".to_string()))
}
