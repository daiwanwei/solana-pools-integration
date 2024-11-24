use std::cell::Ref;

use super::bin::Bin;
use crate::{
    constants::{MAX_BIN_PER_POSITION, NUM_REWARDS},
    errors::LBError,
    math::{
        safe_math::SafeMath, u128x128_math::Rounding, u64x64_math::SCALE_OFFSET,
        utils_math::safe_mul_shr_cast,
    },
    state::bin::BinArray,
    utils::bin::{get_bin, get_lower_upper_bin_id},
};
use anchor_lang::prelude::*;

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

#[account(zero_copy)]
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

impl PositionV2 {
    pub fn get_claimable_fee_per_position(
        &self,
        bin_arrays: &[Ref<BinArray>],
    ) -> Result<(u64, u64)> {
        let (bin_arrays_lower_bin_id, bin_arrays_upper_bin_id) =
            get_lower_upper_bin_id(bin_arrays)?;

        // Make sure that the bin arrays cover all the bins of the position.
        // TODO: Should we? Maybe we shall update only the bins the user are interacting with, and allow chunk for claim reward.
        require!(
            self.lower_bin_id >= bin_arrays_lower_bin_id
                && self.upper_bin_id <= bin_arrays_upper_bin_id,
            LBError::InvalidBinArray
        );

        let mut claimable_fee_x = 0;
        let mut claimable_fee_y = 0;
        for bin_id in self.lower_bin_id..=self.upper_bin_id {
            let bin = get_bin(bin_arrays, bin_id)?;
            let (fee_x, fee_y) = self.get_claimable_fee_per_bin(bin_id, &bin)?;
            claimable_fee_x += fee_x;
            claimable_fee_y += fee_y;
        }

        Ok((claimable_fee_x, claimable_fee_y))
    }

    pub fn get_claimable_fee_per_bin(&self, bin_id: i32, bin: &Bin) -> Result<(u64, u64)> {
        let idx = self.get_idx(bin_id)?;

        let fee_infos = &self.fee_infos[idx];

        let fee_x_per_token_stored = bin.fee_amount_x_per_token_stored;

        let new_fee_x: u64 = safe_mul_shr_cast(
            self.liquidity_shares[idx]
                .safe_shr(SCALE_OFFSET.into())?
                .try_into()
                .map_err(|_| LBError::TypeCastFailed)?,
            fee_x_per_token_stored.safe_sub(fee_infos.fee_x_per_token_complete)?,
            SCALE_OFFSET,
            Rounding::Down,
        )?;

        let claimable_fee_x = new_fee_x.safe_add(fee_infos.fee_x_pending)?;

        let fee_y_per_token_stored = bin.fee_amount_y_per_token_stored;

        let new_fee_y: u64 = safe_mul_shr_cast(
            self.liquidity_shares[idx]
                .safe_shr(SCALE_OFFSET.into())?
                .try_into()
                .map_err(|_| LBError::TypeCastFailed)?,
            fee_y_per_token_stored.safe_sub(fee_infos.fee_y_per_token_complete)?,
            SCALE_OFFSET,
            Rounding::Down,
        )?;

        let claimable_fee_y = new_fee_y.safe_add(fee_infos.fee_y_pending)?;

        Ok((claimable_fee_x, claimable_fee_y))
    }

    pub fn id_within_position(&self, id: i32) -> Result<()> {
        require!(id >= self.lower_bin_id && id <= self.upper_bin_id, LBError::InvalidPosition);
        Ok(())
    }

    /// Return the width of the position. The width is 1 when the position have the same value for upper_bin_id, and lower_bin_id.
    pub fn width(&self) -> Result<i32> {
        Ok(self.upper_bin_id.safe_sub(self.lower_bin_id)?.safe_add(1)?)
    }

    pub fn get_idx(&self, bin_id: i32) -> Result<usize> {
        self.id_within_position(bin_id)?;
        Ok(bin_id.safe_sub(self.lower_bin_id)? as usize)
    }
}

#[zero_copy]
#[derive(Default, Debug, InitSpace, PartialEq)]
pub struct FeeInfo {
    pub fee_x_per_token_complete: u128,
    pub fee_y_per_token_complete: u128,
    pub fee_x_pending: u64,
    pub fee_y_pending: u64,
}

#[zero_copy]
#[derive(Default, Debug, InitSpace, PartialEq)]
pub struct UserRewardInfo {
    pub reward_per_token_completes: [u128; NUM_REWARDS],
    pub reward_pendings: [u64; NUM_REWARDS],
}
