use anchor_lang::prelude::*;
use num_integer::Integer;

use crate::{
    constants::{MAX_BIN_ID, MAX_BIN_PER_ARRAY, MIN_BIN_ID, NUM_REWARDS},
    errors::*,
    math::safe_math::SafeMath,
};

#[zero_copy]
#[derive(Default, Debug, InitSpace)]
pub struct Bin {
    /// Amount of token X in the bin. This already excluded protocol fees.
    pub amount_x: u64,
    /// Amount of token Y in the bin. This already excluded protocol fees.
    pub amount_y: u64,
    /// Bin price
    pub price: u128,
    /// Liquidities of the bin. This is the same as LP mint supply. q-number
    pub liquidity_supply: u128,
    /// reward_a_per_token_stored
    pub reward_per_token_stored: [u128; NUM_REWARDS],
    /// Swap fee amount of token X per liquidity deposited.
    pub fee_amount_x_per_token_stored: u128,
    /// Swap fee amount of token Y per liquidity deposited.
    pub fee_amount_y_per_token_stored: u128,
    /// Total token X swap into the bin. Only used for tracking purpose.
    pub amount_x_in: u128,
    /// Total token Y swap into he bin. Only used for tracking purpose.
    pub amount_y_in: u128,
}

#[account(zero_copy)]
#[derive(Debug, InitSpace)]
/// An account to contain a range of bin. For example: Bin 100 <-> 200.
/// For example:
/// BinArray index: 0 contains bin 0 <-> 599
/// index: 2 contains bin 600 <-> 1199, ...
pub struct BinArray {
    pub index: i64, // Larger size to make bytemuck "safe" (correct alignment)
    /// Version of binArray
    pub version: u8,
    pub _padding: [u8; 7],
    pub lb_pair: Pubkey,
    pub bins: [Bin; MAX_BIN_PER_ARRAY],
}

impl BinArray {
    fn get_bin_index_in_array(&self, bin_id: i32) -> Result<usize> {
        self.is_bin_id_within_range(bin_id)?;

        let (lower_bin_id, upper_bin_id) =
            BinArray::get_bin_array_lower_upper_bin_id(self.index as i32)?;

        let index = if bin_id.is_positive() {
            // When bin id is positive, the index is ascending
            bin_id.safe_sub(lower_bin_id)?
        } else {
            // When bin id is negative, the index is descending. Eg: bin id -1 will be located at last index of the bin array
            ((MAX_BIN_PER_ARRAY as i32).safe_sub(upper_bin_id.safe_sub(bin_id)?)?).safe_sub(1)?
        };

        if index >= 0 && index < MAX_BIN_PER_ARRAY as i32 {
            Ok(index as usize)
        } else {
            Err(LBError::InvalidBinId.into())
        }
    }

    /// Get bin from bin array
    pub fn get_bin_mut<'a>(&'a mut self, bin_id: i32) -> Result<&mut Bin> {
        Ok(&mut self.bins[self.get_bin_index_in_array(bin_id)?])
    }

    pub fn get_bin<'a>(&'a self, bin_id: i32) -> Result<&'a Bin> {
        Ok(&self.bins[self.get_bin_index_in_array(bin_id)?])
    }

    /// Check whether the bin id is within the bin array range
    pub fn is_bin_id_within_range(&self, bin_id: i32) -> Result<()> {
        let (lower_bin_id, upper_bin_id) =
            BinArray::get_bin_array_lower_upper_bin_id(self.index as i32)?;

        require!(bin_id >= lower_bin_id && bin_id <= upper_bin_id, LBError::InvalidBinId);

        Ok(())
    }

    /// Get bin array index from bin id
    pub fn bin_id_to_bin_array_index(bin_id: i32) -> Result<i32> {
        let (idx, rem) = bin_id.div_rem(&(MAX_BIN_PER_ARRAY as i32));

        if bin_id.is_negative() && rem != 0 {
            Ok(idx.safe_sub(1)?)
        } else {
            Ok(idx)
        }
    }

    /// Get lower and upper bin id of the given bin array index
    pub fn get_bin_array_lower_upper_bin_id(index: i32) -> Result<(i32, i32)> {
        let lower_bin_id = index.safe_mul(MAX_BIN_PER_ARRAY as i32)?;
        let upper_bin_id = lower_bin_id.safe_add(MAX_BIN_PER_ARRAY as i32)?.safe_sub(1)?;

        Ok((lower_bin_id, upper_bin_id))
    }

    /// Check that the index within MAX and MIN bin id
    pub fn check_valid_index(index: i32) -> Result<()> {
        let (lower_bin_id, upper_bin_id) = BinArray::get_bin_array_lower_upper_bin_id(index)?;

        require!(
            lower_bin_id >= MIN_BIN_ID && upper_bin_id <= MAX_BIN_ID,
            LBError::InvalidStartBinIndex
        );

        Ok(())
    }
}
