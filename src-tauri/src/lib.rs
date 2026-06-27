mod commands;
mod stremio;
mod app_state;
mod plugins;

use commands::{ health, addons, streamplay };
use app_state::AppState;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder
        ::default()
        .plugin(tauri_plugin_store::Builder::default().build())
        .manage(AppState::new())
        .invoke_handler(
            tauri::generate_handler![
                health::ping,
                addons::install_addon,
                addons::uninstall_addon,
                addons::list_addons,
                addons::get_catalog,
                addons::get_meta,
                addons::get_streams,
                streamplay::sp_search,
                streamplay::sp_get_meta,
                streamplay::sp_get_streams,
                streamplay::sp_extract_stream,
            ]
        )
        .run(tauri::generate_context!())
        .expect("error while running yawn");
}
