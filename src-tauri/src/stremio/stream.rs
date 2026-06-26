use reqwest::Client;
use serde_json::Value;
use crate::stremio::transport::fetch_json;

pub async fn fetch_streams(
    client: &Client,
    base_url: &str,
    stream_type: &str,
    stream_id: &str
) -> Result<Vec<Value>, String> {
    let base = base_url.trim_end_matches('/');
    let url = format!("{}/stream/{}/{}.json", base, stream_type, stream_id);
    let value = fetch_json(client, &url).await?;

    value
        .get("streams")
        .and_then(|s| s.as_array())
        .map(|arr| arr.to_vec())
        .ok_or_else(|| "Missing 'streams' array in response".to_string())
}
