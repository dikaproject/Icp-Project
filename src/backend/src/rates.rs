use crate::types::*;
use ic_cdk::api::management_canister::http_request::{
    http_request, CanisterHttpRequestArgument, HttpHeader, HttpMethod, HttpResponse, TransformArgs,
};
use serde_json;

// Exchange rate management
pub async fn fetch_live_exchange_rate(currency: String) -> Result<ExchangeRate, String> {
    let currency_lower = currency.to_lowercase();
    
    // Build CoinGecko API URL
    let url = format!(
        "https://api.coingecko.com/api/v3/simple/price?ids=internet-computer&vs_currencies={}&include_24hr_change=true",
        currency_lower
    );

    let request = CanisterHttpRequestArgument {
        url: url.clone(),
        method: HttpMethod::GET,
        body: None,
        max_response_bytes: Some(2048),
        transform: None, // We'll handle transformation in the calling function
        headers: vec![
            HttpHeader {
                name: "User-Agent".to_string(),
                value: "ICP-Payment-Gateway/1.0".to_string(),
            },
            HttpHeader {
                name: "Accept".to_string(),
                value: "application/json".to_string(),
            },
        ],
    };

    ic_cdk::println!("Making HTTP request to: {}", url);

    match http_request(request, 25_000_000_000).await {
        Ok((response,)) => {
            ic_cdk::println!("HTTP Response status: {}", response.status);
            
            if response.status != 200u16 {
                return Err(format!("HTTP request failed with status: {}", response.status));
            }

            let response_body = String::from_utf8(response.body)
                .map_err(|_| "Invalid UTF-8 response")?;
            
            ic_cdk::println!("Response body: {}", response_body);
            
            let rate = parse_coingecko_response(&response_body, &currency_lower)?;
            
            let exchange_rate = ExchangeRate {
                currency: currency.to_uppercase(),
                rate,
                timestamp: ic_cdk::api::time(),
                source: "coingecko".to_string(),
            };

            Ok(exchange_rate)
        }
        Err(e) => {
            ic_cdk::println!("HTTP request error: {:?}", e);
            Err(format!("HTTP request failed: {:?}", e))
        }
    }
}

pub fn parse_coingecko_response(body: &str, currency: &str) -> Result<f64, String> {
    // Parse JSON response
    let parsed: serde_json::Value = serde_json::from_str(body)
        .map_err(|e| format!("JSON parse error: {}", e))?;

    // Navigate to the ICP price for the requested currency
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

// Calculate ICP amount from fiat
pub fn calculate_icp_amount(fiat_amount: f64, exchange_rate: f64) -> Result<u64, String> {
    if fiat_amount <= 0.0 {
        return Err("Fiat amount must be greater than 0".to_string());
    }
    
    if exchange_rate <= 0.0 {
        return Err("Exchange rate must be greater than 0".to_string());
    }

    // Convert fiat to ICP, then to e8s (1 ICP = 100,000,000 e8s)
    let icp_amount = fiat_amount / exchange_rate;
    let e8s_amount = (icp_amount * 100_000_000.0) as u64;
    
    if e8s_amount == 0 {
        return Err("Amount too small, results in 0 e8s".to_string());
    }

    Ok(e8s_amount)
}

// Get supported currencies
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

// Validate currency code
pub fn is_supported_currency(currency: &str) -> bool {
    get_supported_currencies().contains(&currency.to_lowercase())
}

// Format currency display
pub fn format_currency_amount(amount: f64, currency: &str) -> String {
    match currency.to_uppercase().as_str() {
        "USD" | "EUR" | "GBP" | "SGD" => format!("{:.2}", amount),
        "JPY" => format!("{:.0}", amount),
        "IDR" | "VND" => format!("{:.0}", amount),
        _ => format!("{:.2}", amount),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_calculate_icp_amount() {
        // Test normal calculation
        let result = calculate_icp_amount(100.0, 10.0).unwrap();
        assert_eq!(result, 1_000_000_000); // 10 ICP in e8s

        // Test zero amounts
        assert!(calculate_icp_amount(0.0, 10.0).is_err());
        assert!(calculate_icp_amount(100.0, 0.0).is_err());
    }

    #[test]
    fn test_supported_currencies() {
        assert!(is_supported_currency("USD"));
        assert!(is_supported_currency("usd"));
        assert!(is_supported_currency("IDR"));
        assert!(!is_supported_currency("INVALID"));
    }

    #[test]
    fn test_parse_coingecko_response() {
        let sample_response = r#"{"internet-computer":{"usd":12.34,"eur":10.56}}"#;
        let rate = parse_coingecko_response(sample_response, "usd").unwrap();
        assert_eq!(rate, 12.34);
    }
}
