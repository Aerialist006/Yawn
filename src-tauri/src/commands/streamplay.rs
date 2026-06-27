use tauri::State;
use crate::app_state::AppState;
use crate::plugins::streamplay;
use crate::plugins::types::*;

fn get_api_key() -> String {
    std::env::var("TMDB_API_KEY").unwrap_or_else(|_| "YOUR_TMDB_API_KEY_HERE".to_string())
}

#[tauri::command]
pub async fn sp_search(
    state: State<'_, AppState>,
    query: String
) -> Result<Vec<YawnMediaItem>, String> {
    streamplay::search(&state.client, &get_api_key(), &query).await
}

#[tauri::command]
pub async fn sp_get_meta(
    state: State<'_, AppState>,
    tmdbId: String,
    mediaType: String
) -> Result<YawnMeta, String> {
    streamplay::get_meta(&state.client, &get_api_key(), &tmdbId, &mediaType).await
}

#[tauri::command]
pub async fn sp_get_streams(
    state: State<'_, AppState>,
    imdbId: String,
    tmdbId: String,
    mediaType: String,
    season: Option<i64>,
    episode: Option<i64>
) -> Result<StreamResult, String> {
    streamplay::get_streams(&state.client, &imdbId, &tmdbId, &mediaType, season, episode).await
}

#[tauri::command]
pub async fn sp_extract_stream(
    state: tauri::State<'_, AppState>,
    tmdb_id: String,
    media_type: String,
    season: Option<i64>,
    episode: Option<i64>
) -> Result<Option<String>, String> {
    let client = &state.client;
    crate::plugins::streamplay::extract_videasy(
        client,
        &tmdb_id,
        &media_type,
        season,
        episode
    ).await
}
