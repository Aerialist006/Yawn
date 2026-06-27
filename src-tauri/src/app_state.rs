use reqwest::Client;

pub struct AppState {
    pub client: Client,
}

impl AppState {
    pub fn new() -> Self {
        AppState {
            client: Client::builder()
                .timeout(std::time::Duration::from_secs(15))
                .build()
                .expect("Failed to build HTTP client"),
        }
    }
}
