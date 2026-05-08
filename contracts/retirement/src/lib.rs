#![no_std]
pub mod types;

use crate::types::RetirementRecord;
use soroban_sdk::{contract, contractimpl, Env, Address, BytesN, String};
use soroban_sdk::xdr::ToXdr;

#[contract]
pub struct Retirement;

#[contractimpl]
impl Retirement {
    pub fn retire(env: Env, buyer: Address, credit_id: BytesN<32>, tonnes: i128, reason: String) -> BytesN<32> {
        buyer.require_auth();

        // TODO: Invoke CCR token contract burn()

        let retirement_id: BytesN<32> = env.crypto().sha256(&reason.clone().to_xdr(&env)).into();
        let record = RetirementRecord {
            credit_id: credit_id.clone(),
            buyer: buyer.clone(),
            tonnes_retired: tonnes,
            reason: reason.clone(),
            retired_at: env.ledger().timestamp(),
        };

        env.storage().persistent().set(&crate::types::DataKey::Retirement(retirement_id.clone()), &record);

        retirement_id
    }
}
