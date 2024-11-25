use anchor_lang::prelude::*;

use crate::constants::REWARD_NUM;

#[account]
#[derive(Default, Debug)]
pub struct ProtocolPositionState {
    /// Bump to identify PDA
    pub bump: u8,

    /// The ID of the pool with which this token is connected
    pub pool_id: Pubkey,

    /// The lower bound tick of the position
    pub tick_lower_index: i32,

    /// The upper bound tick of the position
    pub tick_upper_index: i32,

    /// The amount of liquidity owned by this position
    pub liquidity: u128,

    /// The token_0 fee growth per unit of liquidity as of the last update to liquidity or fees owed
    pub fee_growth_inside_0_last_x64: u128,

    /// The token_1 fee growth per unit of liquidity as of the last update to liquidity or fees owed
    pub fee_growth_inside_1_last_x64: u128,

    /// The fees owed to the position owner in token_0
    pub token_fees_owed_0: u64,

    /// The fees owed to the position owner in token_1
    pub token_fees_owed_1: u64,

    /// The reward growth per unit of liquidity as of the last update to liquidity
    pub reward_growth_inside: [u128; REWARD_NUM], // 24
    // account update recent epoch
    pub recent_epoch: u64,
    // Unused bytes for future upgrades.
    pub padding: [u64; 7],
}

impl ProtocolPositionState {
    pub const LEN: usize = 8 + 1 + 32 + 4 + 4 + 16 + 16 + 16 + 8 + 8 + 16 * REWARD_NUM + 64;
}
