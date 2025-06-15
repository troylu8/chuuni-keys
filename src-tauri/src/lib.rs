use tauri_plugin_prevent_default::PlatformOptions;
mod charts;
use charts::get_all_charts;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(
            tauri_plugin_prevent_default::Builder::new()
                .platform(PlatformOptions {
                    general_autofill: false,
                    password_autosave: false,
                })
                .build(),
        )
        .invoke_handler(tauri::generate_handler![get_all_charts,])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
