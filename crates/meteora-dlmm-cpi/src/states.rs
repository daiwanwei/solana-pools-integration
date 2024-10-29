use anchor_lang::prelude::*;

use crate::constants::*;

#[account]
#[derive(InitSpace, Debug)]
pub struct Position {
    /// The LB pair of this position
    pub lb_pair: Pubkey,
    /// Owner of the position. Client rely on this to to fetch their positions.
    pub owner: Pubkey,
    /// Liquidity shares of this position in bins (lower_bin_id <-> upper_bin_id). This is the same as LP concept.
    pub liquidity_shares: [u64; MAX_BIN_PER_POSITION],
    /// Farming reward information
    pub reward_infos: [UserRewardInfo; MAX_BIN_PER_POSITION],
    /// Swap fee to claim information
    pub fee_infos: [FeeInfo; MAX_BIN_PER_POSITION],
    /// Lower bin ID
    pub lower_bin_id: i32,
    /// Upper bin ID
    pub upper_bin_id: i32,
    /// Last updated timestamp
    pub last_updated_at: i64,
    /// Total claimed token fee X
    pub total_claimed_fee_x_amount: u64,
    /// Total claimed token fee Y
    pub total_claimed_fee_y_amount: u64,
    /// Total claimed rewards
    pub total_claimed_rewards: [u64; 2],
    /// Reserved space for future use
    pub _reserved: [u8; 160],
}

#[derive(InitSpace, Debug)]
pub struct PositionV2 {
    /// The LB pair of this position
    pub lb_pair: Pubkey,
    /// Owner of the position. Client rely on this to to fetch their positions.
    pub owner: Pubkey,
    /// Liquidity shares of this position in bins (lower_bin_id <-> upper_bin_id). This is the same as LP concept.
    pub liquidity_shares: [u128; MAX_BIN_PER_POSITION],
    /// Farming reward information
    pub reward_infos: [UserRewardInfo; MAX_BIN_PER_POSITION],
    /// Swap fee to claim information
    pub fee_infos: [FeeInfo; MAX_BIN_PER_POSITION],
    /// Lower bin ID
    pub lower_bin_id: i32,
    /// Upper bin ID
    pub upper_bin_id: i32,
    /// Last updated timestamp
    pub last_updated_at: i64,
    /// Total claimed token fee X
    pub total_claimed_fee_x_amount: u64,
    /// Total claimed token fee Y
    pub total_claimed_fee_y_amount: u64,
    /// Total claimed rewards
    pub total_claimed_rewards: [u64; 2],
    /// Operator of position
    pub operator: Pubkey,
    /// Time point which the locked liquidity can be withdraw
    pub lock_release_point: u64,
    /// Is the position subjected to liquidity locking for the launch pool.
    pub subjected_to_bootstrap_liquidity_locking: u8,
    /// Address is able to claim fee in this position, only valid for bootstrap_liquidity_position
    pub fee_owner: Pubkey,
    /// Reserved space for future use
    pub _reserved: [u8; 87],
}

#[derive(Clone, Default, Debug, AnchorDeserialize, AnchorSerialize, InitSpace, PartialEq)]
pub struct FeeInfo {
    pub fee_x_per_token_complete: u128,
    pub fee_y_per_token_complete: u128,
    pub fee_x_pending: u64,
    pub fee_y_pending: u64,
}

#[derive(Clone, Default, Debug, AnchorDeserialize, AnchorSerialize, InitSpace, PartialEq)]
pub struct UserRewardInfo {
    pub reward_per_token_completes: [u128; NUM_REWARDS],
    pub reward_pendings: [u64; NUM_REWARDS],
}
