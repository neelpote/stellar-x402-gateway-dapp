#![no_std]

use soroban_sdk::{
    contract, contractclient, contracterror, contractevent, contractimpl, contracttype,
    panic_with_error, Address, Env, String, Symbol,
};

const TTL_THRESHOLD: u32 = 17_280;
const TTL_BUMP: u32 = 518_400;

#[contractclient(name = "DataRegistryClient")]
pub trait DataRegistryInterface {
    fn get_data(env: Env, id: Symbol) -> String;
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Config {
    pub admin: Address,
    pub seller: Address,
    pub token: Address,
    pub registry: Address,
    pub price: i128,
}

#[contracttype]
#[derive(Clone)]
enum StorageKey {
    Config,
}

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum AccessError {
    NotInitialized = 1,
    InvalidPrice = 2,
}

#[contractevent]
pub struct AccessGranted {
    #[topic]
    pub buyer: Address,
    #[topic]
    pub data_id: Symbol,
    pub amount: i128,
}

#[contract]
pub struct AccessController;

fn bump_instance_ttl(env: &Env) {
    env.storage().instance().extend_ttl(TTL_THRESHOLD, TTL_BUMP);
}

fn read_config(env: &Env) -> Result<Config, AccessError> {
    env.storage()
        .instance()
        .get(&StorageKey::Config)
        .ok_or(AccessError::NotInitialized)
}

fn validate_price(price: i128) -> Result<(), AccessError> {
    if price <= 0 {
        return Err(AccessError::InvalidPrice);
    }
    Ok(())
}

#[contractimpl]
impl AccessController {
    pub fn __constructor(
        env: Env,
        admin: Address,
        seller: Address,
        token: Address,
        registry: Address,
        price: i128,
    ) {
        validate_price(price).unwrap_or_else(|error| panic_with_error!(&env, error));
        let config = Config {
            admin,
            seller,
            token,
            registry,
            price,
        };
        env.storage().instance().set(&StorageKey::Config, &config);
        bump_instance_ttl(&env);
    }

    pub fn set_config(
        env: Env,
        seller: Address,
        token: Address,
        registry: Address,
        price: i128,
    ) -> Result<(), AccessError> {
        let current = read_config(&env)?;
        current.admin.require_auth();
        validate_price(price)?;

        let config = Config {
            admin: current.admin,
            seller,
            token,
            registry,
            price,
        };
        env.storage().instance().set(&StorageKey::Config, &config);
        bump_instance_ttl(&env);
        Ok(())
    }

    pub fn transfer_admin(env: Env, new_admin: Address) -> Result<(), AccessError> {
        let mut config = read_config(&env)?;
        config.admin.require_auth();
        config.admin = new_admin;
        env.storage().instance().set(&StorageKey::Config, &config);
        bump_instance_ttl(&env);
        Ok(())
    }

    pub fn get_config(env: Env) -> Result<Config, AccessError> {
        let config = read_config(&env)?;
        bump_instance_ttl(&env);
        Ok(config)
    }

    pub fn query_premium(env: Env, buyer: Address, data_id: Symbol) -> Result<String, AccessError> {
        let config = read_config(&env)?;
        buyer.require_auth();

        let token_client = soroban_sdk::token::Client::new(&env, &config.token);
        token_client.transfer(&buyer, &config.seller, &config.price);

        let registry_client = DataRegistryClient::new(&env, &config.registry);
        let content_ref = registry_client.get_data(&data_id);

        bump_instance_ttl(&env);
        AccessGranted {
            buyer,
            data_id,
            amount: config.price,
        }
        .publish(&env);
        Ok(content_ref)
    }
}

#[cfg(test)]
mod test;
