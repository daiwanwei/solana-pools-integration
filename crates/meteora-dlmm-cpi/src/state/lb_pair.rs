use crate::state::parameters::{StaticParameters, VariableParameters};
use anchor_lang::prelude::*;

#[derive(Copy, Clone, Debug, PartialEq, Eq)]
#[repr(u8)]
/// Type of the Pair. 0 = Permissionless, 1 = Permission. Putting 0 as permissionless for backward compatibility.
pub enum PairType {
    Permissionless,
    Permission,
}

pub struct LaunchPadParams {
    pub activation_point: u64,
}

#[derive(AnchorSerialize, AnchorDeserialize, Debug, PartialEq, Eq)]
#[repr(u8)]
/// Pair status. 0 = Enabled, 1 = Disabled. Putting 0 as enabled for backward compatibility.
pub enum PairStatus {
    // Fully enabled.
    // Condition:
    // Permissionless: PairStatus::Enabled
    // Permission: PairStatus::Enabled and current_point > activation_point
    Enabled,
    // Similar as emergency mode. User can only withdraw (Only outflow). Except whitelisted wallet still have full privileges.
    Disabled,
}

#[zero_copy]
#[derive(InitSpace, Default, Debug)]
pub struct ProtocolFee {
    pub amount_x: u64,
    pub amount_y: u64,
}

#[account(zero_copy)]
#[derive(InitSpace, Debug)]
pub struct LbPair {
    pub parameters: StaticParameters,
    pub v_parameters: VariableParameters,
    pub bump_seed: [u8; 1],
    /// Bin step signer seed
    pub bin_step_seed: [u8; 2],
    /// Type of the pair
    pub pair_type: u8,
    /// Active bin id
    pub active_id: i32,
    /// Bin step. Represent the price increment / decrement.
    pub bin_step: u16,
    /// Status of the pair. Check PairStatus enum.
    pub status: u8,
    /// Require base factor seed
    pub require_base_factor_seed: u8,
    /// Base factor seed
    pub base_factor_seed: [u8; 2],
    /// Activation type
    pub activation_type: u8,
    /// padding 0
    pub _padding_0: u8,
    /// Token X mint
    pub token_x_mint: Pubkey,
    /// Token Y mint
    pub token_y_mint: Pubkey,
    /// LB token X vault
    pub reserve_x: Pubkey,
    /// LB token Y vault
    pub reserve_y: Pubkey,
    /// Uncollected protocol fee
    pub protocol_fee: ProtocolFee,
    /// _padding_1, previous Fee owner, BE CAREFUL FOR TOMBSTONE WHEN REUSE !!
    pub _padding_1: [u8; 32],
    /// Farming reward information
    pub reward_infos: [RewardInfo; 2], // TODO: Bug in anchor IDL parser when using InitSpace macro. Temp hardcode it. https://github.com/coral-xyz/anchor/issues/2556
    /// Oracle pubkey
    pub oracle: Pubkey,
    /// Packed initialized bin array state
    pub bin_array_bitmap: [u64; 16], // store default bin id from -512 to 511 (bin id from -35840 to 35840, price from 2.7e-16 to 3.6e15)
    /// Last time the pool fee parameter was updated
    pub last_updated_at: i64,
    /// Whitelisted wallet
    pub whitelisted_wallet: Pubkey,
    /// Address allowed to swap when the current point is greater than or equal to the pre-activation point. The pre-activation point is calculated as `activation_point - pre_activation_duration`.
    pub pre_activation_swap_address: Pubkey,
    /// Base keypair. Only required for permission pair
    pub base_key: Pubkey,
    /// Time point to enable the pair. Only applicable for permission pair.
    pub activation_point: u64,
    /// Duration before activation point. Used to calculate pre-activation point for pre_activation_swap_address
    pub pre_activation_duration: u64,
    /// _padding 2 is reclaimed free space from swap_cap_deactivate_point and swap_cap_amount before, BE CAREFUL FOR TOMBSTONE WHEN REUSE !!
    pub _padding_2: [u8; 8],
    /// Liquidity lock duration for positions which created before activate. Only applicable for permission pair.
    pub lock_duration: u64,
    /// Pool creator
    pub creator: Pubkey,
    /// Reserved space for future use
    pub _reserved: [u8; 24],
}

/// Stores the state relevant for tracking liquidity mining rewards
#[zero_copy]
#[derive(InitSpace, Default, Debug, PartialEq)]
pub struct RewardInfo {
    /// Reward token mint.
    pub mint: Pubkey,
    /// Reward vault token account.
    pub vault: Pubkey,
    /// Authority account that allows to fund rewards
    pub funder: Pubkey,
    /// TODO check whether we need to store it in pool
    pub reward_duration: u64, // 8
    /// TODO check whether we need to store it in pool
    pub reward_duration_end: u64, // 8
    /// TODO check whether we need to store it in pool
    pub reward_rate: u128, // 8
    /// The last time reward states were updated.
    pub last_update_time: u64, // 8
    /// Accumulated seconds where when farm distribute rewards, but the bin is empty. The reward will be accumulated for next reward time window.
    pub cumulative_seconds_with_empty_liquidity_reward: u64,
}
