use soroban_sdk::{Env, Address, BytesN, symbol_short, String};

pub fn credit_submitted(env: &Env, issuer: Address, project_id: String, tonnes: i128) {
    let topics = (symbol_short!("submit"), issuer);
    env.events().publish(topics, (project_id, tonnes));
}

pub fn credit_minted(env: &Env, verifier: Address, id: BytesN<32>) {
    let topics = (symbol_short!("mint"), verifier);
    env.events().publish(topics, id);
}
