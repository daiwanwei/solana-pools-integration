use anchor_lang::prelude::*;

use crate::constants::{REWARD_NUM, TICK_ARRAY_SIZE, TICK_ARRAY_SIZE_USIZE};

#[account(zero_copy(unsafe))]
#[repr(packed)]
pub struct TickArrayState {
    pub pool_id: Pubkey,
    pub start_tick_index: i32,
    pub ticks: [TickState; TICK_ARRAY_SIZE_USIZE],
    pub initialized_tick_count: u8,
    // account update recent epoch
    pub recent_epoch: u64,
    // Unused bytes for future upgrades.
    pub padding: [u8; 107],
}

impl TickArrayState {
    pub const LEN: usize = 8 + 32 + 4 + TickState::LEN * TICK_ARRAY_SIZE_USIZE + 1 + 115;

    pub fn get_tick_state(&self, tick_index: i32, tick_spacing: u16) -> Result<&TickState> {
        let offset_in_array = self.get_tick_offset_in_array(tick_index, tick_spacing)?;
        Ok(&self.ticks[offset_in_array])
    }

    /// Get tick's offset in current tick array, tick must be include in tick array， otherwise throw an error
    fn get_tick_offset_in_array(self, tick_index: i32, tick_spacing: u16) -> Result<usize> {
        let start_tick_index = TickArrayState::get_array_start_index(tick_index, tick_spacing);
        // require_eq!(start_tick_index, self.start_tick_index, ErrorCode::InvalidTickArray);
        let offset_in_array =
            ((tick_index - self.start_tick_index) / i32::from(tick_spacing)) as usize;
        Ok(offset_in_array)
    }

    /// Input an arbitrary tick_index, output the start_index of the tick_array it sits on
    pub fn get_array_start_index(tick_index: i32, tick_spacing: u16) -> i32 {
        let ticks_in_array = TickArrayState::tick_count(tick_spacing);
        let mut start = tick_index / ticks_in_array;
        if tick_index < 0 && tick_index % ticks_in_array != 0 {
            start = start - 1
        }
        start * ticks_in_array
    }

    pub fn tick_count(tick_spacing: u16) -> i32 {
        TICK_ARRAY_SIZE * i32::from(tick_spacing)
    }
}

#[zero_copy(unsafe)]
#[repr(packed)]
#[derive(Default, Debug)]
pub struct TickState {
    pub tick: i32,
    /// Amount of net liquidity added (subtracted) when tick is crossed from left to right (right to left)
    pub liquidity_net: i128,
    /// The total position liquidity that references this tick
    pub liquidity_gross: u128,

    /// Fee growth per unit of liquidity on the _other_ side of this tick (relative to the current tick)
    /// only has relative meaning, not absolute — the value depends on when the tick is initialized
    pub fee_growth_outside_0_x64: u128,
    pub fee_growth_outside_1_x64: u128,

    // Reward growth per unit of liquidity like fee, array of Q64.64
    pub reward_growths_outside_x64: [u128; REWARD_NUM],
    // Unused bytes for future upgrades.
    pub padding: [u32; 13],
}

impl TickState {
    pub const LEN: usize = 4 + 16 + 16 + 16 + 16 + 16 * REWARD_NUM + 16 + 16 + 8 + 8 + 4;
}
