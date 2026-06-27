use tauri::State;
use crate::app_state::AppState;
use crate::plugins::{streamplay, types::*};

fn get_api_key() -> String {
    std::env::var("TMDB_API_KEY").unwrap_or_else(|_| {
        // fallback public key for dev — replace with your own
        "YOUR_TMDB_API_KEY_HERE".to_string()
    })
}

#[tauri::command]
pub async fn sp_search(
    state: State<'_, AppState>,
    query: String,
) -> Result<Vec<YawnMediaItem>, String> {
    let api_key = get_api_key();
    streamplay::search(&state.client, &api_key, &query).await
}

#[tauri::command]
pub async fn sp_get_meta(
    state: State<'_, AppState>,
    tmdbId: String,
    mediaType: String,
) -> Result<YawnMeta, String> {
    let api_key = get_api_key();
    streamplay::get_meta(&state.client, &api_key, &tmdbId, &mediaType).await
}

#[tauri::command]
pub async fn sp_get_streams(
    state: State<'_, AppState>,
    imdbId: String,
    tmdbId: String,
    mediaType: String,
    season: Option<i64>,
    episode: Option<i64>,
) -> Result<StreamResult, String> {
    streamplay::get_streams(&state.client, &imdbId, &tmdbId, &mediaType, season, episode).await
}