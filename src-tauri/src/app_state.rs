use std::sync::Mutex;
use reqwest::Client;
use crate::stremio::models::{ AddonDefinition, StremioManifest };

pub struct AppState {
    pub client: Client,
    pub addons: Mutex<Vec<AddonDefinition>>,
}

impl AppState {
    pub fn new() -> Self {
        AppState {
            client: Client::builder()
                .timeout(std::time::Duration::from_secs(15))
                .build()
                .expect("Failed to build HTTP client"),
            addons: Mutex::new(vec![]),
        }
    }
}

impl AddonDefinition {
    pub fn new(transport_url: String) -> Self {
        let manifest_url = format!(
            "{}/manifest.json",
            transport_url.trim_end_matches('/').trim_end_matches("/manifest.json")
        );
        AddonDefinition {
            transport_url,
            manifest_url,
            enabled: true,
            manifest: None,
        }
    }

    pub fn with_manifest(mut self, manifest: StremioManifest) -> Self {
        self.manifest = Some(manifest);
        self
    }
}
