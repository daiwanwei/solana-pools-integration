pub mod constants;
pub mod error;
pub mod instructions;
pub mod libraries;
pub mod math;
pub mod state;
pub mod utils;

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
        reciever: Pubkey,
        liquidity: u128,
        amount_0_max: u64,
        amount_1_max: u64,
        base_flag: Option<bool>,
    ) -> Result<()> {
        increase_raydium_liquidity::handler(
            ctx,
            reciever,
            liquidity,
            amount_0_max,
            amount_1_max,
            base_flag,
        )
    }

    pub fn decrease_raydium_liquidity<'a, 'b, 'c: 'info, 'info>(
        ctx: Context<'a, 'b, 'c, 'info, DecreaseRaydiumLiquidity<'info>>,
        liquidity: u128,
        amount_0_min: u64,
        amount_1_min: u64,
    ) -> Result<()> {
        decrease_raydium_liquidity::handler(ctx, liquidity, amount_0_min, amount_1_min)
    }

    pub fn close_raydium_position(ctx: Context<CloseRaydiumPosition>) -> Result<()> {
        close_raydium_position::handler(ctx)
    }

    pub fn harvest_raydium_position<'a, 'b, 'c: 'info, 'info>(
        ctx: Context<'a, 'b, 'c, 'info, HarvestRaydiumPosition<'info>>,
    ) -> Result<()> {
        harvest_raydium_position::handler(ctx)
    }
}
