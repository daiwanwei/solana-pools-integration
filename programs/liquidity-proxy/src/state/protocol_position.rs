use anchor_lang::prelude::*;

#[account]
#[derive(Debug, Default, InitSpace)]
pub struct RaydiumProtocolPosition {
    pub bump: u8,
    pub config: Pubkey,
    // TODO: check if this is necessary
    pub raydium_pool: Pubkey,
    pub raydium_position_nft: Pubkey,

    pub tick_lower_index: i32,
    pub tick_upper_index: i32,

    pub position_vault_0: Pubkey,
    pub position_vault_1: Pubkey,

    pub total_shares: u128,

    pub fee_growth_inside_0_last_x64: u128,
    pub fee_growth_inside_1_last_x64: u128,
}
