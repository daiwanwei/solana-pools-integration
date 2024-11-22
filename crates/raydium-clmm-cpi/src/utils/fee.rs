use crate::{
    libraries::{fixed_point_64, full_math::MulDiv, U128},
    states::TickState,
};

// Ref: https://github.com/raydium-io/raydium-clmm/blob/master/programs/amm/src/instructions/increase_liquidity.rs
pub fn calculate_latest_token_fees(
    last_total_fees: u64,
    fee_growth_inside_last_x64: u128,
    fee_growth_inside_latest_x64: u128,
    liquidity: u128,
) -> u64 {
    let fee_growth_delta =
        U128::from(fee_growth_inside_latest_x64.wrapping_sub(fee_growth_inside_last_x64))
            .mul_div_floor(U128::from(liquidity), U128::from(fixed_point_64::Q64))
            .unwrap()
            .to_underflow_u64();
    last_total_fees.checked_add(fee_growth_delta).unwrap()
}

// Ref: https://github.com/raydium-io/raydium-clmm/blob/master/programs/amm/src/states/tick_array.rs
// Calculates the fee growths inside of tick_lower and tick_upper based on their positions relative to tick_current.
/// `fee_growth_inside = fee_growth_global - fee_growth_below(lower) - fee_growth_above(upper)`
///
pub fn get_fee_growth_inside(
    tick_lower: &TickState,
    tick_upper: &TickState,
    tick_current: i32,
    fee_growth_global_0_x64: u128,
    fee_growth_global_1_x64: u128,
) -> (u128, u128) {
    // calculate fee growth below
    let (fee_growth_below_0_x64, fee_growth_below_1_x64) = if tick_current >= tick_lower.tick {
        (tick_lower.fee_growth_outside_0_x64, tick_lower.fee_growth_outside_1_x64)
    } else {
        (
            fee_growth_global_0_x64.checked_sub(tick_lower.fee_growth_outside_0_x64).unwrap(),
            fee_growth_global_1_x64.checked_sub(tick_lower.fee_growth_outside_1_x64).unwrap(),
        )
    };

    // Calculate fee growth above
    let (fee_growth_above_0_x64, fee_growth_above_1_x64) = if tick_current < tick_upper.tick {
        (tick_upper.fee_growth_outside_0_x64, tick_upper.fee_growth_outside_1_x64)
    } else {
        (
            fee_growth_global_0_x64.checked_sub(tick_upper.fee_growth_outside_0_x64).unwrap(),
            fee_growth_global_1_x64.checked_sub(tick_upper.fee_growth_outside_1_x64).unwrap(),
        )
    };
    let fee_growth_inside_0_x64 = fee_growth_global_0_x64
        .wrapping_sub(fee_growth_below_0_x64)
        .wrapping_sub(fee_growth_above_0_x64);
    let fee_growth_inside_1_x64 = fee_growth_global_1_x64
        .wrapping_sub(fee_growth_below_1_x64)
        .wrapping_sub(fee_growth_above_1_x64);

    (fee_growth_inside_0_x64, fee_growth_inside_1_x64)
}
