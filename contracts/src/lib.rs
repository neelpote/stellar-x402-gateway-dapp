#![no_std]
use soroban_sdk::{contract, contractimpl, symbol_short, Address, Env, Symbol, String};

#[contract]
pub struct DataRegistry;

#[contractimpl]
impl DataRegistry {
    pub fn register_data(env: Env, id: Symbol, hash: String) {
        env.storage().persistent().set(&id, &hash);
    }

    pub fn get_data(env: Env, id: Symbol) -> String {
        // Emit native Soroban event when data is queried
        env.events().publish((symbol_short!("query"), id.clone()), id.clone());
        
        // Retrieve persistent data, return fallback if empty
        env.storage()
            .persistent()
            .get(&id)
            .unwrap_or_else(|| String::from_str(&env, "default"))
    }
}

#[contract]
pub struct AccessController;

#[contractimpl]
impl AccessController {
    pub fn query_premium(
        env: Env,
        buyer: Address,
        seller: Address,
        amount: i128,
        token: Address,
        registry: Address,
        data_id: Symbol,
    ) -> String {
        // Enforce signature check of the calling buyer account
        buyer.require_auth();

        // 1. Verify and settle payment on-chain via the standard token transfer method
        let token_client = soroban_sdk::token::Client::new(&env, &token);
        token_client.transfer(&buyer, &seller, &amount);

        // 2. Execute cross-contract call to DataRegistry to fetch unlocked IPFS content
        let registry_client = DataRegistryClient::new(&env, &registry);
        let data = registry_client.get_data(&data_id);

        // Emit native Access success event
        env.events().publish((symbol_short!("access"), buyer.clone()), data_id);

        data
    }
}

mod test;
