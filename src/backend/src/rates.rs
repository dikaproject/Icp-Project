use crate::types::*;
use ic_cdk::api::management_canister::http_request::{
    http_request, CanisterHttpRequestArgument, HttpHeader, HttpMethod, HttpResponse, TransformArgs,
};
use serde_json;

// Rate limiting configuration
const MAX_RETRIES: u32 = 3;
const RETRY_DELAY_SECONDS: u64 = 2;
const RATE_CACHE_DURATION_SECONDS: u64 = 300; 

// Enhanced exchange rate fetching with cache-only fallback
pub async fn fetch_exchange_rate_with_retry(currency: String) -> Result<ExchangeRate, String> {
    fetch_exchange_rate_with_retry_internal(currency, None).await
}

// Internal function that accepts cached rate
pub async fn fetch_exchange_rate_with_retry_internal(currency: String, cached_rate: Option<ExchangeRate>) -> Result<ExchangeRate, String> {
    let currency_upper = currency.to_uppercase();
    
    if !is_supported_currency(&currency_upper) {
        return Err(format!("Unsupported currency: {}", currency_upper));
    }
    
    for attempt in 1..=MAX_RETRIES {
        ic_cdk::println!("🔄 Attempt {} to fetch {} rate", attempt, currency_upper);
        
        match fetch_live_exchange_rate(currency_upper.clone()).await {
            Ok(rate) => {
                ic_cdk::println!("✅ Successfully fetched {} rate on attempt {}", currency_upper, attempt);
                return Ok(rate);
            }
            Err(e) => {
                ic_cdk::println!("❌ Attempt {} failed: {}", attempt, e);
                
                
                if e.contains("429") {
                    ic_cdk::println!("⚠️ Rate limited, checking cached rate...");
                    
                    if let Some(cached) = cached_rate.as_ref() {
                        if is_cache_very_recent(cached) {
                            ic_cdk::println!("✅ Using recent cached {} rate", currency_upper);
                            return Ok(cached.clone());
                        } else {
                            ic_cdk::println!("⚠️ Cached rate is older than 5 minutes, continuing retries...");
                        }
                    }
                }
                
                
                if !e.contains("429") && !e.contains("timeout") {
                    return Err(format!("API error: {}", e));
                }
                
                
                if attempt < MAX_RETRIES {
                    let delay = RETRY_DELAY_SECONDS * (attempt as u64);
                    ic_cdk::println!("⏳ Waiting {} seconds before retry...", delay);
                    
                    
                    for _ in 0..delay {
                        
                    }
                }
            }
        }
    }
    
    // If all retries failed, use cached rate with disclaimer (even if older than 5 minutes)
    if let Some(cached) = cached_rate {
        let age_minutes = get_cache_age_minutes(&cached);
        ic_cdk::println!("⚠️ All attempts failed, using cached {} rate ({} min old)", currency_upper, age_minutes);
        
        
        let mut rate_with_disclaimer = cached.clone();
        rate_with_disclaimer.source = if age_minutes <= 5 {
            format!("coingecko_cached_{}min", age_minutes)
        } else {
            format!("coingecko_stale_{}min", age_minutes)
        };
        
        return Ok(rate_with_disclaimer);
    }
    
    Err(format!("Failed to fetch {} rate after {} attempts and no cached rate available", currency_upper, MAX_RETRIES))
}

// Get cached rate if it's still valid
fn get_cached_rate_if_valid(_currency: &str) -> Option<ExchangeRate> {

    None
}

// Original fetch function with enhanced error handling
pub async fn fetch_live_exchange_rate(currency: String) -> Result<ExchangeRate, String> {
    let currency_lower = currency.to_lowercase();
    
    // Build CoinGecko API URL with rate limiting headers
    let url = format!(
        "https://api.coingecko.com/api/v3/simple/price?ids=internet-computer&vs_currencies={}&include_24hr_change=true",
        currency_lower
    );

    let request = CanisterHttpRequestArgument {
        url: url.clone(),
        method: HttpMethod::GET,
        body: None,
        max_response_bytes: Some(2048),
        transform: None,
        headers: vec![
            HttpHeader {
                name: "User-Agent".to_string(),
                value: "ICP-Payment-Gateway/1.0".to_string(),
            },
            HttpHeader {
                name: "Accept".to_string(),
                value: "application/json".to_string(),
            },
            HttpHeader {
                name: "Cache-Control".to_string(),
                value: "no-cache".to_string(),
            },
            HttpHeader {
                name: "X-RateLimit-Respect".to_string(),
                value: "true".to_string(),
            },
        ],
    };

    ic_cdk::println!("📡 Making HTTP request to: {}", url);

    match http_request(request, 25_000_000_000).await {
        Ok((response,)) => {
            ic_cdk::println!("📊 HTTP Response status: {}", response.status);
            

            let status_code = response.status.0.to_u64_digits();
            let status_u16 = if status_code.len() == 1 {
                status_code[0] as u16
            } else {
                999 
            };
            
            match status_u16 {
                200 => {
                    let response_body = String::from_utf8(response.body)
                        .map_err(|_| "Invalid UTF-8 response")?;
                    
                    ic_cdk::println!("📄 Response body: {}", response_body);
                    
                    let rate = parse_coingecko_response(&response_body, &currency_lower)?;
                    
                    let exchange_rate = ExchangeRate {
                        currency: currency.to_uppercase(),
                        rate,
                        timestamp: ic_cdk::api::time(),
                        source: "coingecko".to_string(),
                    };

                    Ok(exchange_rate)
                }
                429 => {
                    ic_cdk::println!("⚠️ Rate limited by CoinGecko API");
                    Err("HTTP request failed with status: 429".to_string())
                }
                500..=599 => {
                    ic_cdk::println!("🔥 Server error: {}", status_u16);
                    Err(format!("Server error: {}", status_u16))
                }
                _ => {
                    ic_cdk::println!("❌ HTTP request failed with status: {}", status_u16);
                    Err(format!("HTTP request failed with status: {}", status_u16))
                }
            }
        }
        Err(e) => {
            ic_cdk::println!("💥 HTTP request error: {:?}", e);
            Err(format!("HTTP request failed: {:?}", e))
        }
    }
}

// Check if cached rate is very recent (within 5 minutes for immediate use)
fn is_cache_very_recent(exchange_rate: &ExchangeRate) -> bool {
    let current_time = ic_cdk::api::time();
    let rate_age = current_time.saturating_sub(exchange_rate.timestamp);
    let max_recent_age = RATE_CACHE_DURATION_SECONDS * 1_000_000_000; 
    
    rate_age < max_recent_age
}

// Get cache age in minutes for disclaimer
pub fn get_cache_age_minutes(exchange_rate: &ExchangeRate) -> u64 {
    let current_time = ic_cdk::api::time();
    let rate_age = current_time.saturating_sub(exchange_rate.timestamp);
    rate_age / (60 * 1_000_000_000) 
}

// Enhanced cache validation
pub fn is_rate_cache_valid(exchange_rate: &ExchangeRate) -> bool {
    let current_time = ic_cdk::api::time();
    let rate_age = current_time.saturating_sub(exchange_rate.timestamp);
    let max_age = RATE_CACHE_DURATION_SECONDS * 1_000_000_000; 
    
    rate_age < max_age
}

pub fn parse_coingecko_response(body: &str, currency: &str) -> Result<f64, String> {
    let parsed: serde_json::Value = serde_json::from_str(body)
        .map_err(|e| format!("JSON parse error: {}", e))?;

    let icp_data = parsed.get("internet-computer")
        .ok_or("internet-computer key not found in response")?;
    
    let rate = icp_data.get(currency)
        .ok_or(format!("Currency {} not found in response", currency))?
        .as_f64()
        .ok_or("Rate is not a valid number")?;

    if rate <= 0.0 {
        return Err("Invalid rate: must be greater than 0".to_string());
    }

    Ok(rate)
}

pub fn transform_response(raw: TransformArgs) -> HttpResponse {
    HttpResponse {
        status: raw.response.status.clone(),
        body: raw.response.body,
        headers: vec![],
    }
}

pub fn calculate_icp_amount(fiat_amount: f64, exchange_rate: f64) -> Result<u64, String> {
    if fiat_amount <= 0.0 {
        return Err("Fiat amount must be greater than 0".to_string());
    }
    
    if exchange_rate <= 0.0 {
        return Err("Exchange rate must be greater than 0".to_string());
    }

    let icp_amount = fiat_amount / exchange_rate;
    let e8s_amount = (icp_amount * 100_000_000.0) as u64;
    
    if e8s_amount == 0 {
        return Err("Amount too small, results in 0 e8s".to_string());
    }

    Ok(e8s_amount)
}

pub fn get_supported_currencies() -> Vec<String> {
    vec![
        "usd".to_string(),
        "eur".to_string(),
        "gbp".to_string(),
        "jpy".to_string(),
        "idr".to_string(),
        "sgd".to_string(),
        "myr".to_string(),
        "php".to_string(),
        "thb".to_string(),
        "vnd".to_string(),
    ]
}

pub fn is_supported_currency(currency: &str) -> bool {
    get_supported_currencies().contains(&currency.to_lowercase())
}

pub fn format_currency_amount(amount: f64, currency: &str) -> String {
    match currency.to_uppercase().as_str() {
        "USD" | "EUR" | "GBP" | "SGD" => format!("{:.2}", amount),
        "JPY" => format!("{:.0}", amount),
        "IDR" | "VND" => format!("{:.0}", amount),
        _ => format!("{:.2}", amount),
    }
}

// Function to get supported currencies list for API
pub fn get_supported_currencies_list() -> Vec<String> {
    get_supported_currencies()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_currency_support() {
        assert!(is_supported_currency("USD"));
        assert!(is_supported_currency("usd"));
        assert!(is_supported_currency("EUR"));
        assert!(!is_supported_currency("INVALID"));
    }

    #[test]
    fn test_icp_amount_calculation() {
        let result = calculate_icp_amount(100.0, 5.0);
        assert!(result.is_ok());
        assert_eq!(result.unwrap(), 2_000_000_000); 
    }

    #[test]
    fn test_currency_formatting() {
        assert_eq!(format_currency_amount(100.5, "USD"), "100.50");
        assert_eq!(format_currency_amount(100.5, "JPY"), "101");
        assert_eq!(format_currency_amount(100000.0, "IDR"), "100000");
    }

    #[test]
    fn test_cache_age_calculation() {
        let exchange_rate = ExchangeRate {
            currency: "USD".to_string(),
            rate: 5.0,
            timestamp: ic_cdk::api::time() - (10 * 60 * 1_000_000_000), 
            source: "coingecko".to_string(),
        };
        
        let age = get_cache_age_minutes(&exchange_rate);
        assert_eq!(age, 10);
    }
}