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

    pub fn initialize_raydium_config(ctx: Context<InitializeRaydiumConfig>) -> Result<()> {
        initialize_raydium_config::handler(ctx)
    }

    pub fn open_raydium_position(ctx: Context<OpenRaydiumPosition>) -> Result<()> {
        open_raydium_position::handler(ctx)
    }

    pub fn increase_raydium_liquidity(ctx: Context<IncreaseRaydiumLiquidity>) -> Result<()> {
        increase_raydium_liquidity::handler(ctx)
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
