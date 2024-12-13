use anchor_lang::prelude::*;

#[account]
#[derive(Debug, Default, InitSpace)]
pub struct RaydiumUserPosition {
    pub bump: u8,
    pub raydium_protocol_position: Pubkey,
    pub owner: Pubkey,
    pub shares: u128,

    pub fee_growth_inside_0_last_x64: u128,
    pub fee_growth_inside_1_last_x64: u128,

    pub token_fees_owed_0: u64,
    pub token_fees_owed_1: u64,
}
