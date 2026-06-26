use reqwest::Client;
use crate::stremio::models::StremioManifest;
use crate::stremio::transport::fetch_json;

pub fn normalize_base_url(transport_url: &str) -> String {
    let url = transport_url.trim_end_matches('/');
    if url.ends_with("/manifest.json") {
        url.trim_end_matches("/manifest.json").to_string()
    } else {
        url.to_string()
    }
}

pub async fn fetch_manifest(client: &Client, transport_url: &str) -> Result<StremioManifest, String> {
    let base = normalize_base_url(transport_url);
    let url = format!("{}/manifest.json", base);
    let value = fetch_json(client, &url).await?;

    serde_json::from_value::<StremioManifest>(value)
        .map_err(|e| format!("Failed to deserialize manifest: {}", e))
}