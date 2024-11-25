use anchor_lang::prelude::*;

use crate::constants::REWARD_NUM;

#[account]
#[derive(Default, Debug)]
pub struct PersonalPositionState {
    /// Bump to identify PDA
    pub bump: u8,

    /// Mint address of the tokenized position
    pub nft_mint: Pubkey,

    /// The ID of the pool with which this token is connected
    pub pool_id: Pubkey,

    /// The lower bound tick of the position
    pub tick_lower_index: i32,

    /// The upper bound tick of the position
    pub tick_upper_index: i32,

    /// The amount of liquidity owned by this position
    pub liquidity: u128,

    /// The token_0 fee growth of the aggregate position as of the last action on the individual position
    pub fee_growth_inside_0_last_x64: u128,

    /// The token_1 fee growth of the aggregate position as of the last action on the individual position
    pub fee_growth_inside_1_last_x64: u128,

    /// The fees owed to the position owner in token_0, as of the last computation
    pub token_fees_owed_0: u64,

    /// The fees owed to the position owner in token_1, as of the last computation
    pub token_fees_owed_1: u64,

    // Position reward info
    pub reward_infos: [PositionRewardInfo; REWARD_NUM],
    // account update recent epoch
    pub recent_epoch: u64,
    // Unused bytes for future upgrades.
    pub padding: [u64; 7],
}

impl PersonalPositionState {
    pub const LEN: usize =
        8 + 1 + 32 + 32 + 4 + 4 + 16 + 16 + 16 + 8 + 8 + PositionRewardInfo::LEN * REWARD_NUM + 64;
}

#[derive(Copy, Clone, AnchorSerialize, AnchorDeserialize, Default, Debug, PartialEq)]
pub struct PositionRewardInfo {
    // Q64.64
    pub growth_inside_last_x64: u128,
    pub reward_amount_owed: u64,
}

impl PositionRewardInfo {
    pub const LEN: usize = 16 + 8;
}
