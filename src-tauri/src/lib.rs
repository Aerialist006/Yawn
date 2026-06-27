mod commands;
mod app_state;
mod plugins;

use commands::{ health };
use commands::plugins as cmd_plugins;
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
                cmd_plugins::ywn_install,
                cmd_plugins::ywn_list,
                cmd_plugins::ywn_remove,
                cmd_plugins::ywn_toggle,
                cmd_plugins::ywn_call_hook,
                cmd_plugins::ywn_homepage,
                cmd_plugins::ywn_search,
                cmd_plugins::pick_ywn_file
            ]
        )
        .run(tauri::generate_context!())
        .expect("error while running yawn");
}
