use reqwest::Client;
use serde_json::Value;
use crate::stremio::transport::fetch_json;

pub async fn fetch_catalog(
    client: &Client,
    base_url: &str,
    catalog_type: &str,
    catalog_id: &str,
    extra: Option<&str>
) -> Result<Vec<Value>, String> {
    let base = base_url.trim_end_matches('/');
    let url = match extra {
        Some(e) if !e.is_empty() =>
            format!("{}/catalog/{}/{}/{}.json", base, catalog_type, catalog_id, e),
        _ => format!("{}/catalog/{}/{}.json", base, catalog_type, catalog_id),
    };

    let value = fetch_json(client, &url).await?;

    value
        .get("metas")
        .and_then(|m| m.as_array())
        .map(|arr| arr.to_vec())
        .ok_or_else(|| "Missing 'metas' array in catalog response".to_string())
}
