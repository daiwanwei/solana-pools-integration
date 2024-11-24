use anchor_lang::prelude::*;

#[event]
pub struct FeeLogEvent {
    pub token_fees_0: u64,
    pub token_fees_1: u64,
}
