use std::cell::Ref;

use anchor_lang::prelude::*;

use crate::constants::MAX_BIN_PER_ARRAY;
use crate::errors::LBError;
use crate::math::safe_math::SafeMath;
use crate::state::bin::Bin;
use crate::state::bin::BinArray;

pub fn get_bin<'info>(bin_arrays: &'info [Ref<BinArray>], bin_id: i32) -> Result<&'info Bin> {
    let bin_array_idx = BinArray::bin_id_to_bin_array_index(bin_id)?;
    match bin_arrays.iter().find(|ba| ba.index == bin_array_idx as i64) {
        Some(bin_array) => bin_array.get_bin(bin_id),
        None => Err(LBError::InvalidBinArray.into()),
    }
}

pub fn get_lower_upper_bin_id(bin_arrays: &[Ref<BinArray>]) -> Result<(i32, i32)> {
    let lower_bin_array_idx = bin_arrays[0].index as i32;
    let upper_bin_array_idx = bin_arrays[bin_arrays.len() - 1].index as i32;

    let lower_bin_id = lower_bin_array_idx.safe_mul(MAX_BIN_PER_ARRAY as i32)?;
    let upper_bin_id = upper_bin_array_idx
        .safe_mul(MAX_BIN_PER_ARRAY as i32)?
        .safe_add(MAX_BIN_PER_ARRAY as i32)?
        .safe_sub(1)?;

    Ok((lower_bin_id, upper_bin_id))
}
