use tauri::State;
use serde_json::Value;
use crate::app_state::AppState;
use crate::stremio::{ manifest, catalog, meta, stream };
use crate::stremio::models::AddonDefinition;

// Install an add-on by its transport URL
#[tauri::command]
pub async fn install_addon(
    state: State<'_, AppState>,
    transport_url: String
) -> Result<AddonDefinition, String> {
    let fetched = manifest::fetch_manifest(&state.client, &transport_url).await?;
    let base = manifest::normalize_base_url(&transport_url);
    let addon = AddonDefinition::new(base).with_manifest(fetched);

    let mut addons = state.addons.lock().map_err(|_| "State lock poisoned".to_string())?;

    // Replace if already installed, otherwise push
    if let Some(existing) = addons.iter_mut().find(|a| a.transport_url == addon.transport_url) {
        *existing = addon.clone();
    } else {
        addons.push(addon.clone());
    }

    Ok(addon)
}

// Remove an add-on by transport URL
#[tauri::command]
pub async fn uninstall_addon(
    state: State<'_, AppState>,
    transport_url: String
) -> Result<(), String> {
    let mut addons = state.addons.lock().map_err(|_| "State lock poisoned".to_string())?;
    addons.retain(|a| a.transport_url != transport_url);
    Ok(())
}

// List all installed add-ons
#[tauri::command]
pub async fn list_addons(state: State<'_, AppState>) -> Result<Vec<AddonDefinition>, String> {
    let addons = state.addons.lock().map_err(|_| "State lock poisoned".to_string())?;
    Ok(addons.clone())
}

// Fetch catalog from a specific add-on
#[tauri::command]
pub async fn get_catalog(
    state: State<'_, AppState>,
    transport_url: String,
    catalog_type: String,
    catalog_id: String,
    extra: Option<String>
) -> Result<Vec<Value>, String> {
    let base = manifest::normalize_base_url(&transport_url);
    catalog::fetch_catalog(&state.client, &base, &catalog_type, &catalog_id, extra.as_deref()).await
}

// Fetch meta item
#[tauri::command]
pub async fn get_meta(
    state: State<'_, AppState>,
    transport_url: String,
    meta_type: String,
    meta_id: String
) -> Result<Value, String> {
    let base = manifest::normalize_base_url(&transport_url);
    meta::fetch_meta(&state.client, &base, &meta_type, &meta_id).await
}

// Fetch streams for a type/id
#[tauri::command]
pub async fn get_streams(
    state: State<'_, AppState>,
    transport_url: String,
    stream_type: String,
    stream_id: String
) -> Result<Vec<Value>, String> {
    let base = manifest::normalize_base_url(&transport_url);
    stream::fetch_streams(&state.client, &base, &stream_type, &stream_id).await
}
