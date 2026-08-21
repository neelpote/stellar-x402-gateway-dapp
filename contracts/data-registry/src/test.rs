use super::*;
use soroban_sdk::{contract, contractimpl, testutils::Address as _, Address, Env, String, Symbol};

#[contract]
struct RegistryReader;

#[contractimpl]
impl RegistryReader {
    pub fn read(env: Env, registry: Address, id: Symbol) -> String {
        DataRegistryClient::new(&env, &registry).get_data(&id)
    }
}

#[test]
fn admin_can_register_and_controller_can_read() {
    let env = Env::default();
    env.mock_all_auths();
    let admin = Address::generate(&env);
    let controller = Address::generate(&env);
    let contract_id = env.register(DataRegistry, (&admin,));
    let client = DataRegistryClient::new(&env, &contract_id);
    let id = Symbol::new(&env, "premium_report_2026");
    let content_ref = String::from_str(&env, "ipfs://encrypted-content-reference");

    client.set_controller(&controller);
    client.register_data(&id, &content_ref);

    assert_eq!(client.get_data(&id), content_ref);
}

#[test]
fn administrator_can_rotate_the_controller() {
    let env = Env::default();
    env.mock_all_auths();
    let admin = Address::generate(&env);
    let contract_id = env.register(DataRegistry, (&admin,));
    let client = DataRegistryClient::new(&env, &contract_id);

    client.set_controller(&Address::generate(&env));
    client.set_controller(&Address::generate(&env));
}

#[test]
fn unauthorized_caller_cannot_overwrite_records() {
    let env = Env::default();
    env.mock_all_auths();
    let admin = Address::generate(&env);
    let controller = Address::generate(&env);
    let contract_id = env.register(DataRegistry, (&admin,));
    let client = DataRegistryClient::new(&env, &contract_id);
    let id = Symbol::new(&env, "premium_report_2026");

    client.set_controller(&controller);
    client.register_data(&id, &String::from_str(&env, "ipfs://original"));
    env.set_auths(&[]);

    assert!(client
        .try_register_data(&id, &String::from_str(&env, "ipfs://attacker"))
        .is_err());
}

#[test]
fn direct_read_requires_controller_authorization() {
    let env = Env::default();
    env.mock_all_auths();
    let admin = Address::generate(&env);
    let controller = Address::generate(&env);
    let contract_id = env.register(DataRegistry, (&admin,));
    let client = DataRegistryClient::new(&env, &contract_id);
    let id = Symbol::new(&env, "premium_report_2026");

    client.set_controller(&controller);
    client.register_data(&id, &String::from_str(&env, "ipfs://original"));
    env.set_auths(&[]);

    assert!(client.try_get_data(&id).is_err());
}

#[test]
fn missing_record_returns_contract_error() {
    let env = Env::default();
    env.mock_all_auths();
    let admin = Address::generate(&env);
    let controller = Address::generate(&env);
    let contract_id = env.register(DataRegistry, (&admin,));
    let client = DataRegistryClient::new(&env, &contract_id);

    client.set_controller(&controller);

    assert_eq!(
        client.try_get_data(&Symbol::new(&env, "missing")),
        Err(Ok(soroban_sdk::Error::from_contract_error(
            RegistryError::RecordNotFound as u32,
        )))
    );
}

#[test]
fn configured_contract_can_read_without_mocked_controller_auth() {
    let env = Env::default();
    env.mock_all_auths();
    let admin = Address::generate(&env);
    let registry_id = env.register(DataRegistry, (&admin,));
    let reader_id = env.register(RegistryReader, ());
    let registry = DataRegistryClient::new(&env, &registry_id);
    let reader = RegistryReaderClient::new(&env, &reader_id);
    let id = Symbol::new(&env, "premium_report_2026");
    let content_ref = String::from_str(&env, "ipfs://original");

    registry.set_controller(&reader_id);
    registry.register_data(&id, &content_ref);
    env.set_auths(&[]);

    assert_eq!(reader.read(&registry_id, &id), content_ref);
}
