use soroban_sdk::{contracttype, Address, String, BytesN};

#[derive(Clone, Copy, Debug, PartialEq)]
#[contracttype]
pub enum CreditStatus {
    Pending = 0,
    Active = 1,
    Retired = 2,
    Flagged = 3,
    Disputed = 4,
    Expired = 5,
}

#[derive(Clone, Debug, PartialEq)]
#[contracttype]
pub struct CreditMetadata {
    pub project_id: String,
    pub issuer: Address,
    pub vintage_year: u32,
    pub methodology: String,
    pub geography: String,
    pub tonnes: i128,
    pub ipfs_hash: String,
    pub status: CreditStatus,
    pub issued_at: u64,
}

#[derive(Clone, Debug, PartialEq)]
#[contracttype]
pub struct ProjectMetadata {
    pub owner: Address,
    pub name: String,
    pub description: String,
    pub location: String,
    pub created_at: u64,
}

#[derive(Clone, Copy, Debug, PartialEq)]
#[contracttype]
pub enum DisputeOutcome {
    Approved = 0,
    Rejected = 1,
}

#[derive(Clone)]
#[contracttype]
pub enum DataKey {
    Admin,
    VerifierSet,
    Credit(BytesN<32>),
    ProjectCredits(String),
    Project(String),
    RetirementContract,
    CreditNonce,
    Paused,
    PendingAdmin,
    Nonce(Address),
    Dispute(BytesN<32>),
}
