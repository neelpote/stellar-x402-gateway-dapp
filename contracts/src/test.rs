#![cfg(test)]

use super::*;
use soroban_sdk::{testutils::{Address as _, Events}, Address, Env, Symbol, String};

#[test]
fn test_data_query_and_inter_contract_payment() {
    // 1. Initialize test environment
    let env = Env::default();
    env.mock_all_auths();

    // 2. Deploy DataRegistry contract and set up test client
    let registry_id = env.register_contract(None, DataRegistry);
    let registry_client = DataRegistryClient::new(&env, &registry_id);

    // Register dummy data IPFS hash using standard String
    let data_key = Symbol::new(&env, "premium_report_2026");
    let ipfs_value = String::from_str(&env, "ipfs://QmXoypizjW3WknFixtnd");
    registry_client.register_data(&data_key, &ipfs_value);

    // Verify raw getter
    assert_eq!(registry_client.get_data(&data_key), ipfs_value);

    // 3. Deploy AccessController contract and set up test client
    let controller_id = env.register_contract(None, AccessController);
    let controller_client = AccessControllerClient::new(&env, &controller_id);

    // 4. Deploy standard Stellar Asset Contract representing USDC
    let token_admin = Address::generate(&env);
    let token_sac = env.register_stellar_asset_contract_v2(token_admin.clone());
    let token_id = token_sac.address();
    let token_admin_client = soroban_sdk::token::StellarAssetClient::new(&env, &token_id);
    let token_client = soroban_sdk::token::Client::new(&env, &token_id);

    // 5. Generate addresses for buyer (AI Agent) and seller (API host)
    let buyer = Address::generate(&env);
    let seller = Address::generate(&env);

    // Fund the buyer with 500 units of USDC
    token_admin_client.mint(&buyer, &500);

    // Assert initial state balances
    assert_eq!(token_client.balance(&buyer), 500);
    assert_eq!(token_client.balance(&seller), 0);

    // 6. Execute pay-to-query handshake
    const PAYMENT_AMOUNT: i128 = 100; // 100 base units (e.g. 1.00 USDC)
    let query_result = controller_client.query_premium(
        &buyer,
        &seller,
        &PAYMENT_AMOUNT,
        &token_id,
        &registry_id,
        &data_key,
    );

    // Assert returned hash matches expected IPFS registration
    assert_eq!(query_result, ipfs_value);

    // Assert balances successfully transferred on-chain
    assert_eq!(token_client.balance(&buyer), 400); // 500 - 100
    assert_eq!(token_client.balance(&seller), 100); // 0 + 100

    // Assert that the native events were published correctly
    let events = env.events().all();
    assert!(events.len() >= 2, "Expected at least 2 events to be emitted");
}
