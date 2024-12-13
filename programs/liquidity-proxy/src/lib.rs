pub mod constants;
pub mod error;
pub mod instructions;
pub mod state;

use anchor_lang::prelude::*;

pub use constants::*;
pub use instructions::*;
pub use state::*;

declare_id!("GThwS7XKza6nKBgSMDstt1uVGrgEvfmLvkFq6C6tYdar");

#[program]
pub mod liquidity_proxy {
    use super::*;

    pub fn initialize_config(
        ctx: Context<InitializeConfig>,
        admin: Pubkey,
        index: u16,
    ) -> Result<()> {
        initialize_config::handler(ctx, admin, index)
    }

    pub fn open_raydium_position<'a, 'b, 'c: 'info, 'info>(
        ctx: Context<'a, 'b, 'c, 'info, OpenRaydiumPosition<'info>>,
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
        open_raydium_position::handler(
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

    pub fn increase_raydium_liquidity<'a, 'b, 'c: 'info, 'info>(
        ctx: Context<'a, 'b, 'c, 'info, IncreaseRaydiumLiquidity<'info>>,
        liquidity: u128,
        amount_0_max: u64,
        amount_1_max: u64,
        base_flag: Option<bool>,
    ) -> Result<()> {
        increase_raydium_liquidity::handler(ctx, liquidity, amount_0_max, amount_1_max, base_flag)
    }

    pub fn decrease_raydium_liquidity(ctx: Context<DecreaseRaydiumLiquidity>) -> Result<()> {
        decrease_raydium_liquidity::handler(ctx)
    }

    pub fn close_raydium_position(ctx: Context<CloseRaydiumPosition>) -> Result<()> {
        close_raydium_position::handler(ctx)
    }

    pub fn harvest_raydium_position(ctx: Context<HarvestRaydiumPosition>) -> Result<()> {
        harvest_raydium_position::handler(ctx)
    }
}
