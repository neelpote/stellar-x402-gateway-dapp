#![no_std]

use soroban_sdk::{
    contract, contracterror, contractevent, contractimpl, contracttype, panic_with_error, Address,
    Env, String, Symbol,
};

const TTL_THRESHOLD: u32 = 17_280;
const TTL_BUMP: u32 = 518_400;

#[contracttype]
#[derive(Clone)]
enum StorageKey {
    Admin,
    Controller,
    Record(Symbol),
}

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum RegistryError {
    NotInitialized = 1,
    RecordNotFound = 2,
}

#[contractevent]
pub struct RecordStored {
    #[topic]
    pub id: Symbol,
}

#[contractevent]
pub struct DataQueried {
    #[topic]
    pub id: Symbol,
}

#[contract]
pub struct DataRegistry;

fn bump_instance_ttl(env: &Env) {
    env.storage().instance().extend_ttl(TTL_THRESHOLD, TTL_BUMP);
}

fn read_admin(env: &Env) -> Result<Address, RegistryError> {
    env.storage()
        .instance()
        .get(&StorageKey::Admin)
        .ok_or(RegistryError::NotInitialized)
}

fn read_controller(env: &Env) -> Result<Address, RegistryError> {
    env.storage()
        .instance()
        .get(&StorageKey::Controller)
        .ok_or(RegistryError::NotInitialized)
}

#[contractimpl]
impl DataRegistry {
    pub fn __constructor(env: Env, admin: Address) {
        env.storage().instance().set(&StorageKey::Admin, &admin);
        bump_instance_ttl(&env);
    }

    pub fn set_controller(env: Env, controller: Address) -> Result<(), RegistryError> {
        let admin = read_admin(&env)?;
        admin.require_auth();
        env.storage()
            .instance()
            .set(&StorageKey::Controller, &controller);
        bump_instance_ttl(&env);
        Ok(())
    }

    pub fn register_data(env: Env, id: Symbol, content_ref: String) -> Result<(), RegistryError> {
        let admin = read_admin(&env)?;
        admin.require_auth();

        let key = StorageKey::Record(id.clone());
        env.storage().persistent().set(&key, &content_ref);
        env.storage()
            .persistent()
            .extend_ttl(&key, TTL_THRESHOLD, TTL_BUMP);
        bump_instance_ttl(&env);
        RecordStored { id }.publish(&env);
        Ok(())
    }

    pub fn get_data(env: Env, id: Symbol) -> String {
        let controller =
            read_controller(&env).unwrap_or_else(|error| panic_with_error!(&env, error));
        controller.require_auth();

        let key = StorageKey::Record(id.clone());
        let content_ref = env
            .storage()
            .persistent()
            .get::<_, String>(&key)
            .unwrap_or_else(|| panic_with_error!(&env, RegistryError::RecordNotFound));

        env.storage()
            .persistent()
            .extend_ttl(&key, TTL_THRESHOLD, TTL_BUMP);
        bump_instance_ttl(&env);
        DataQueried { id }.publish(&env);
        content_ref
    }
}
