#![no_std]
use soroban_sdk::{contract, contractimpl, Env, Address, String, BytesN};

pub mod types;
pub mod errors;
pub mod storage;
pub mod events;

use crate::errors::CarbonChainError;
use crate::storage::{set_admin, has_admin, set_credit};
use crate::types::{CreditMetadata, CreditStatus};
use crate::events::credit_submitted;

#[contract]
pub struct CreditRegistry;

#[contractimpl]
impl CreditRegistry {
    pub fn initialize(env: Env, admin: Address) -> Result<(), CarbonChainError> {
        if has_admin(&env) {
            return Err(CarbonChainError::AlreadyInitialized);
        }
        set_admin(&env, &admin);
        Ok(())
    }

    pub fn submit_credit(env: Env, issuer: Address, project_id: String, vintage_year: u32, methodology: String, geography: String, tonnes: i128, ipfs_hash: String) -> Result<BytesN<32>, CarbonChainError> {
        issuer.require_auth();

        let id = env.crypto().sha256(&project_id.to_xdr(&env));
        let metadata = CreditMetadata {
            project_id: project_id.clone(),
            issuer: issuer.clone(),
            vintage_year,
            methodology,
            geography,
            tonnes,
            ipfs_hash,
            status: CreditStatus::Pending,
            issued_at: env.ledger().timestamp(),
        };

        set_credit(&env, &id, &metadata);
        credit_submitted(&env, issuer, project_id, tonnes);

        Ok(id)
    }
}
