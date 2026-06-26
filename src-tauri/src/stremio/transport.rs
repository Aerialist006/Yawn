use reqwest::Client;
use serde_json::Value;

pub async fn fetch_json(client: &Client, url: &str) -> Result<Value, String> {
    let response = client
        .get(url)
        .send().await
        .map_err(|e| format!("Request failed: {}", e))?;

    if !response.status().is_success() {
        return Err(format!("HTTP {}: {}", response.status(), url));
    }

    response.json::<Value>().await.map_err(|e| format!("Failed to parse JSON: {}", e))
}
