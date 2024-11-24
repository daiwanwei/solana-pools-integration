use anchor_lang::prelude::*;
use raydium_clmm_cpi::{
    states::{PersonalPositionState, PoolState, TickArrayState},
    utils::fee::{calculate_latest_token_fees, get_fee_growth_inside},
};

use crate::events::FeeLogEvent;

#[derive(Accounts)]
pub struct RaydiumLogPositionFee<'info> {
    /// Add liquidity for this pool
    #[account(mut)]
    pub pool_state: AccountLoader<'info, PoolState>,

    /// CHECK: Account to mark the lower tick as initialized
    #[account(
        mut,
        // seeds = [
        //     TICK_ARRAY_SEED.as_bytes(),
        //     pool_state.key().as_ref(),
        //     &tick_array_lower_start_index.to_be_bytes(),
        // ],
        // seeds::program = clmm_program,
        // bump,
    )]
    pub tick_array_lower: AccountLoader<'info, TickArrayState>,

    /// CHECK:Account to store data for the position's upper tick
    #[account(
        mut,
        // seeds = [
        //     TICK_ARRAY_SEED.as_bytes(),
        //     pool_state.key().as_ref(),
        //     &tick_array_upper_start_index.to_be_bytes(),
        // ],
        // seeds::program = clmm_program,
        // bump,
    )]
    pub tick_array_upper: AccountLoader<'info, TickArrayState>,

    /// CHECK: personal position state
    #[account(
        mut,
        // seeds = [POSITION_SEED.as_bytes(), position_nft_mint.key().as_ref()],
        // bump,
    )]
    pub personal_position: Box<Account<'info, PersonalPositionState>>,
}

pub fn handler<'a, 'b, 'c: 'info, 'info>(
    ctx: Context<'a, 'b, 'c, 'info, RaydiumLogPositionFee<'info>>,
) -> Result<()> {
    let pool_state = ctx.accounts.pool_state.load()?;

    let tick_state = ctx.accounts.tick_array_lower.load()?;

    let tick_state_lower = tick_state
        .get_tick_state(ctx.accounts.personal_position.tick_lower_index, pool_state.tick_spacing)?;
    let tick_state_upper = tick_state
        .get_tick_state(ctx.accounts.personal_position.tick_upper_index, pool_state.tick_spacing)?;

    let (fee_growth_inside_0_x64, fee_growth_inside_1_x64) = get_fee_growth_inside(
        tick_state_lower,
        tick_state_upper,
        pool_state.tick_current,
        pool_state.fee_growth_global_0_x64,
        pool_state.fee_growth_global_1_x64,
    );

    let token_fees_owed_0 = calculate_latest_token_fees(
        ctx.accounts.personal_position.token_fees_owed_0,
        ctx.accounts.personal_position.fee_growth_inside_0_last_x64,
        fee_growth_inside_0_x64,
        ctx.accounts.personal_position.liquidity,
    );

    let token_fees_owed_1 = calculate_latest_token_fees(
        ctx.accounts.personal_position.token_fees_owed_1,
        ctx.accounts.personal_position.fee_growth_inside_1_last_x64,
        fee_growth_inside_1_x64,
        ctx.accounts.personal_position.liquidity,
    );

    emit!(FeeLogEvent { token_fees_0: token_fees_owed_0, token_fees_1: token_fees_owed_1 });

    Ok(())
}
