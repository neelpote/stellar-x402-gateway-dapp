use super::*;
use data_registry::{DataRegistry, DataRegistryClient as RegistryClient};
use soroban_sdk::{testutils::Address as _, Address, Env, String, Symbol};

struct Fixture {
    env: Env,
    controller_id: Address,
    registry_id: Address,
    admin: Address,
    seller: Address,
    buyer: Address,
    token_id: Address,
    data_id: Symbol,
    content_ref: String,
}

fn fixture(price: i128, buyer_balance: i128) -> Fixture {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let seller = Address::generate(&env);
    let buyer = Address::generate(&env);
    let registry_id = env.register(DataRegistry, (&admin,));

    let token_admin = Address::generate(&env);
    let token = env.register_stellar_asset_contract_v2(token_admin);
    let token_id = token.address();
    let token_admin_client = soroban_sdk::token::StellarAssetClient::new(&env, &token_id);
    token_admin_client.mint(&buyer, &buyer_balance);

    let data_id = Symbol::new(&env, "premium_report_2026");
    let content_ref = String::from_str(&env, "ipfs://encrypted-content-reference");

    let controller_id = env.register(
        AccessController,
        (&admin, &seller, &token_id, &registry_id, price),
    );
    let registry = RegistryClient::new(&env, &registry_id);
    registry.set_controller(&controller_id);
    registry.register_data(&data_id, &content_ref);

    Fixture {
        env,
        controller_id,
        registry_id,
        admin,
        seller,
        buyer,
        token_id,
        data_id,
        content_ref,
    }
}

#[test]
fn payment_and_registry_query_are_atomic() {
    let fixture = fixture(100, 500);
    let controller = AccessControllerClient::new(&fixture.env, &fixture.controller_id);
    let token = soroban_sdk::token::Client::new(&fixture.env, &fixture.token_id);

    let result = controller.query_premium(&fixture.buyer, &fixture.data_id);

    assert_eq!(result, fixture.content_ref);
    assert_eq!(token.balance(&fixture.buyer), 400);
    assert_eq!(token.balance(&fixture.seller), 100);
}

#[test]
#[should_panic]
fn initialization_rejects_zero_price() {
    let env = Env::default();
    env.mock_all_auths();
    let admin = Address::generate(&env);
    let seller = Address::generate(&env);
    let token = Address::generate(&env);
    let registry = Address::generate(&env);

    env.register(AccessController, (&admin, &seller, &token, &registry, 0));
}

#[test]
fn buyer_authorization_is_required() {
    let fixture = fixture(100, 500);
    let controller = AccessControllerClient::new(&fixture.env, &fixture.controller_id);
    fixture.env.set_auths(&[]);

    assert!(controller
        .try_query_premium(&fixture.buyer, &fixture.data_id)
        .is_err());
}

#[test]
fn insufficient_payment_balance_cannot_unlock_data() {
    let fixture = fixture(100, 99);
    let controller = AccessControllerClient::new(&fixture.env, &fixture.controller_id);
    let token = soroban_sdk::token::Client::new(&fixture.env, &fixture.token_id);

    assert!(controller
        .try_query_premium(&fixture.buyer, &fixture.data_id)
        .is_err());
    assert_eq!(token.balance(&fixture.buyer), 99);
    assert_eq!(token.balance(&fixture.seller), 0);
}

#[test]
fn failed_registry_lookup_rolls_back_payment() {
    let fixture = fixture(100, 500);
    let controller = AccessControllerClient::new(&fixture.env, &fixture.controller_id);
    let token = soroban_sdk::token::Client::new(&fixture.env, &fixture.token_id);

    assert!(controller
        .try_query_premium(&fixture.buyer, &Symbol::new(&fixture.env, "missing"))
        .is_err());
    assert_eq!(token.balance(&fixture.buyer), 500);
    assert_eq!(token.balance(&fixture.seller), 0);
}

#[test]
fn only_admin_can_change_payment_configuration() {
    let fixture = fixture(100, 500);
    let controller = AccessControllerClient::new(&fixture.env, &fixture.controller_id);
    fixture.env.set_auths(&[]);

    assert!(controller
        .try_set_config(
            &Address::generate(&fixture.env),
            &fixture.token_id,
            &fixture.registry_id,
            &1,
        )
        .is_err());
}

#[test]
fn configuration_contains_the_enforced_payment_terms() {
    let fixture = fixture(100, 500);
    let controller = AccessControllerClient::new(&fixture.env, &fixture.controller_id);
    let config = controller.get_config();

    assert_eq!(config.admin, fixture.admin);
    assert_eq!(config.seller, fixture.seller);
    assert_eq!(config.token, fixture.token_id);
    assert_eq!(config.registry, fixture.registry_id);
    assert_eq!(config.price, 100);
}
