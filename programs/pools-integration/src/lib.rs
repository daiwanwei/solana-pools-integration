pub mod constants;
pub mod error;
pub mod events;
pub mod instructions;
pub mod state;

use anchor_lang::prelude::*;
use meteora_dlmm_cpi::LiquidityParameterByStrategy;

pub use constants::*;
pub use instructions::*;
pub use state::*;

declare_id!("GFa3wVLJEFEcS8DS4ey4QKj71Ye9Eposbicr9DQf7aah");

#[program]
pub mod pools_integration {

    use super::*;

    pub fn orca_proxy_close_position(ctx: Context<OrcaProxyClosePosition>) -> Result<()> {
        orca_proxy_close_position::handler(ctx)
    }

    pub fn orca_proxy_decrease_liquidity(
        ctx: Context<OrcaProxyDecreaseLiquidity>,
        liquidity: u128,
        token_min_a: u64,
        token_min_b: u64,
    ) -> Result<()> {
        orca_proxy_decrease_liquidity::handler(ctx, liquidity, token_min_a, token_min_b)
    }

    pub fn orca_proxy_increase_liquidity(
        ctx: Context<OrcaProxyIncreaseLiquidity>,
        liquidity: u128,
        token_max_a: u64,
        token_max_b: u64,
    ) -> Result<()> {
        orca_proxy_increase_liquidity::handler(ctx, liquidity, token_max_a, token_max_b)
    }

    pub fn orca_proxy_open_position(
        ctx: Context<OrcaProxyOpenPosition>,
        tick_lower_index: i32,
        tick_upper_index: i32,
        bump: u8,
    ) -> Result<()> {
        orca_proxy_open_position::handler(ctx, tick_lower_index, tick_upper_index, bump)
    }

    pub fn orca_proxy_swap(
        ctx: Context<OrcaProxySwap>,
        amount: u64,
        other_amount_threshold: u64,
        sqrt_price_limit: u128,
        amount_specified_is_input: bool,
        a_to_b: bool,
    ) -> Result<()> {
        orca_proxy_swap::handler(
            ctx,
            amount,
            other_amount_threshold,
            sqrt_price_limit,
            amount_specified_is_input,
            a_to_b,
        )
    }

    pub fn raydium_proxy_open_position<'a, 'b, 'c: 'info, 'info>(
        ctx: Context<'a, 'b, 'c, 'info, RaydiumProxyOpenPosition<'info>>,
        tick_lower_index: i32,
        tick_upper_index: i32,
        tick_array_lower_start_index: i32,
        tick_array_upper_start_index: i32,
        liquidity: u128,
        amount_0_max: u64,
        amount_1_max: u64,
        with_matedata: bool,
        base_flag: Option<bool>,
    ) -> Result<()> {
        raydium_proxy_open_position::handler(
            ctx,
            tick_lower_index,
            tick_upper_index,
            tick_array_lower_start_index,
            tick_array_upper_start_index,
            liquidity,
            amount_0_max,
            amount_1_max,
            with_matedata,
            base_flag,
        )
    }

    pub fn raydium_proxy_increase_liquidity<'a, 'b, 'c: 'info, 'info>(
        ctx: Context<'a, 'b, 'c, 'info, RaydiumProxyIncreaseLiquidity<'info>>,
        liquidity: u128,
        amount_0_max: u64,
        amount_1_max: u64,
        base_flag: Option<bool>,
    ) -> Result<()> {
        raydium_proxy_increase_liquidity::handler(
            ctx,
            liquidity,
            amount_0_max,
            amount_1_max,
            base_flag,
        )
    }

    pub fn raydium_log_position_fee<'a, 'b, 'c: 'info, 'info>(
        ctx: Context<'a, 'b, 'c, 'info, RaydiumLogPositionFee<'info>>,
    ) -> Result<()> {
        raydium_log_position_fee::handler(ctx)
    }

    pub fn meteora_proxy_initialize_position<'a, 'b, 'c: 'info, 'info>(
        ctx: Context<'a, 'b, 'c, 'info, MeteoraProxyInitializePosition<'info>>,
        lower_bin_id: i32,
        width: i32,
    ) -> Result<()> {
        meteora_proxy_initialize_position::handler(ctx, lower_bin_id, width)
    }

    pub fn meteora_proxy_add_liquidity<'a, 'b, 'c: 'info, 'info>(
        ctx: Context<'a, 'b, 'c, 'info, MeteoraProxyModifyLiquidity<'info>>,
        liquidity_params: LiquidityParameterByStrategy,
    ) -> Result<()> {
        meteora_proxy_add_liquidity::handler(ctx, liquidity_params)
    }

    pub fn meteora_log_position_fee(ctx: Context<MeteoraLogPositionFee>) -> Result<()> {
        meteora_log_position_fee::handler(ctx)
    }
}
