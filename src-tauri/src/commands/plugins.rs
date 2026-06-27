use std::path::PathBuf;
use serde::{ Deserialize, Serialize };
use tauri::Manager;
use crate::app_state::AppState;
use crate::plugins::ywn_runtime::run_plugin_hook;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct YwnManifest {
    pub id: String,
    pub name: String,
    pub version: String,
    pub author: String,
    pub description: Option<String>,
    pub permissions: Vec<String>,
    pub provides: Vec<String>,
    pub entry: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct YwnPlugin {
    pub manifest: YwnManifest,
    pub enabled: bool,
    #[serde(rename = "installedAt")]
    pub installed_at: String,
    #[serde(rename = "iconUrl")]
    pub icon_url: Option<String>,
}

fn plugins_dir(app: &tauri::AppHandle) -> PathBuf {
    app.path().app_data_dir().expect("No app data dir").join("plugins")
}

fn plugin_dir(app: &tauri::AppHandle, id: &str) -> PathBuf {
    plugins_dir(app).join(id)
}

fn load_plugin_from_dir(dir: &PathBuf) -> Option<YwnPlugin> {
    let manifest_path = dir.join("manifest.json");
    let manifest_str = std::fs::read_to_string(&manifest_path).ok()?;
    let manifest: YwnManifest = serde_json::from_str(&manifest_str).ok()?;

    let icon_url = if dir.join("icon.png").exists() {
        Some(format!("file://{}", dir.join("icon.png").to_string_lossy()))
    } else {
        None
    };

    // Read enabled state from .enabled file (default: true)
    let enabled = !dir.join(".disabled").exists();

    // Read installed_at from .installed file
    let installed_at = std::fs
        ::read_to_string(dir.join(".installed"))
        .unwrap_or_else(|_| "unknown".to_string());

    Some(YwnPlugin { manifest, enabled, installed_at, icon_url })
}

// ─── Commands ─────────────────────────────────────────────────────────────────

#[tauri::command]
pub async fn ywn_install(app: tauri::AppHandle, path: String) -> Result<YwnPlugin, String> {
    let ywn_path = PathBuf::from(&path);
    if !ywn_path.exists() {
        return Err(format!("File not found: {path}"));
    }

    // Open .ywn (zip) file
    let file = std::fs::File::open(&ywn_path).map_err(|e| format!("Cannot open .ywn: {e}"))?;
    let mut archive = zip::ZipArchive::new(file).map_err(|e| format!("Invalid .ywn archive: {e}"))?;

    // Read manifest first to get ID
    let manifest: YwnManifest = {
        let mut mf = archive
            .by_name("manifest.json")
            .map_err(|_| "manifest.json missing from .ywn".to_string())?;
        let mut s = String::new();
        std::io::Read
            ::read_to_string(&mut mf, &mut s)
            .map_err(|e| format!("Cannot read manifest: {e}"))?;
        serde_json::from_str(&s).map_err(|e| format!("Invalid manifest.json: {e}"))?
    };

    let dest = plugin_dir(&app, &manifest.id);
    std::fs::create_dir_all(&dest).map_err(|e| format!("Cannot create plugin dir: {e}"))?;

    // Extract all files
    for i in 0..archive.len() {
        let mut file = archive.by_index(i).map_err(|e| format!("Archive error: {e}"))?;
        let outpath = dest.join(file.name());

        if file.name().ends_with('/') {
            std::fs::create_dir_all(&outpath).ok();
        } else {
            if let Some(parent) = outpath.parent() {
                std::fs::create_dir_all(parent).ok();
            }
            let mut outfile = std::fs::File
                ::create(&outpath)
                .map_err(|e| format!("Cannot write file: {e}"))?;
            std::io
                ::copy(&mut file, &mut outfile)
                .map_err(|e| format!("Cannot extract file: {e}"))?;
        }
    }

    // Write .installed timestamp
    let now = chrono::Utc::now().to_rfc3339();
    std::fs::write(dest.join(".installed"), &now).ok();

    let plugin = load_plugin_from_dir(&dest).ok_or("Failed to load installed plugin")?;

    println!("[YWN] Installed plugin: {} v{}", plugin.manifest.name, plugin.manifest.version);
    Ok(plugin)
}

#[tauri::command]
pub async fn ywn_list(app: tauri::AppHandle) -> Result<Vec<YwnPlugin>, String> {
    let dir = plugins_dir(&app);
    if !dir.exists() {
        return Ok(vec![]);
    }

    let plugins = std::fs
        ::read_dir(&dir)
        .map_err(|e| format!("Cannot read plugins dir: {e}"))?
        .filter_map(|entry| {
            let entry = entry.ok()?;
            if entry.file_type().ok()?.is_dir() {
                load_plugin_from_dir(&entry.path())
            } else {
                None
            }
        })
        .collect();

    Ok(plugins)
}

#[tauri::command]
pub async fn ywn_remove(app: tauri::AppHandle, id: String) -> Result<(), String> {
    let dir = plugin_dir(&app, &id);
    if dir.exists() {
        std::fs::remove_dir_all(&dir).map_err(|e| format!("Cannot remove plugin: {e}"))?;
    }
    println!("[YWN] Removed plugin: {id}");
    Ok(())
}

#[tauri::command]
pub async fn ywn_toggle(app: tauri::AppHandle, id: String, enabled: bool) -> Result<(), String> {
    let dir = plugin_dir(&app, &id);
    let flag = dir.join(".disabled");
    if enabled {
        std::fs::remove_file(&flag).ok();
    } else {
        std::fs::write(&flag, "").map_err(|e| format!("Cannot disable plugin: {e}"))?;
    }
    Ok(())
}

#[tauri::command]
pub async fn ywn_call_hook(
    app: tauri::AppHandle,
    id: String,
    hook: String,
    args_json: String
) -> Result<String, String> {
    let dir = plugin_dir(&app, &id);

    // Check not disabled
    if dir.join(".disabled").exists() {
        return Ok("[]".to_string());
    }

    let manifest_str = std::fs
        ::read_to_string(dir.join("manifest.json"))
        .map_err(|_| format!("Plugin {id} not found"))?;
    let manifest: YwnManifest = serde_json
        ::from_str(&manifest_str)
        .map_err(|e| format!("Bad manifest: {e}"))?;

    // Check plugin provides this hook
    if !manifest.provides.contains(&hook) {
        return Ok("[]".to_string());
    }

    run_plugin_hook(&dir, &manifest.entry, &hook, &args_json)
}

#[tauri::command]
pub async fn pick_ywn_file() -> Option<String> {
    rfd::FileDialog
        ::new()
        .add_filter("Yawn Plugin", &["ywn"])
        .set_title("Install .ywn Plugin")
        .pick_file()
        .map(|p| p.to_string_lossy().to_string())
}
