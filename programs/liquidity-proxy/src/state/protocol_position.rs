use anchor_lang::prelude::*;

#[account]
#[derive(Debug, Default, InitSpace)]
pub struct RaydiumProtocolPosition {
    pub config: Pubkey,
    // TODO: check if this is necessary
    pub raydium_pool: Pubkey,
    pub raydium_position_nft: Pubkey,

    pub total_shares: u128,

    pub fee_growth_inside_0_last_x64: u128,
    pub fee_growth_inside_1_last_x64: u128,
}
