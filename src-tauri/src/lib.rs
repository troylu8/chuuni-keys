use tauri::Manager;

#[cfg(target_os = "windows")]
use tauri_plugin_prevent_default::PlatformOptions;

mod charts;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
#[allow(unused_mut)]
pub fn run() {
    let mut app = tauri::Builder::default()
        .plugin(tauri_plugin_os::init())
        .plugin(tauri_plugin_single_instance::init(|app, _, _| {
            let _ = app
                .get_webview_window("main")
                .expect("should be a main window open")
                .set_focus();
        }))
        .setup(|app| {
            #[cfg(dev)]
            {
                use tauri_plugin_deep_link::DeepLinkExt;
                app.deep_link().register_all()?;
            }
            Ok(())
        })
        .plugin(tauri_plugin_deep_link::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_opener::init());

    #[cfg(target_os = "windows")]
    {
        app = app.plugin(
            tauri_plugin_prevent_default::Builder::new()
                .platform(PlatformOptions {
                    general_autofill: false,
                    password_autosave: false,
                })
                .build(),
        );
    }

    app.invoke_handler(tauri::generate_handler![
        charts::get_all_charts,
        charts::zip_chart,
        charts::unzip_chart,
    ])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}

pub trait UnwrapOrStr<T> {
    fn unwrap_or_str(self) -> Result<T, String>;
}

impl<T, E: ToString> UnwrapOrStr<T> for Result<T, E> {
    fn unwrap_or_str(self) -> Result<T, String> {
        self.map_err(|e| e.to_string())
    }
}
