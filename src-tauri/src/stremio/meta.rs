use reqwest::Client;
use serde_json::Value;
use crate::stremio::transport::fetch_json;

pub async fn fetch_meta(
    client: &Client,
    base_url: &str,
    meta_type: &str,
    meta_id: &str
) -> Result<Value, String> {
    let base = base_url.trim_end_matches('/');
    let url = format!("{}/meta/{}/{}.json", base, meta_type, meta_id);
    let value = fetch_json(client, &url).await?;

    value
        .get("meta")
        .cloned()
        .ok_or_else(|| "Missing 'meta' object in response".to_string())
}
