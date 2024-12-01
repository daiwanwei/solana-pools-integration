pub mod constants;
pub mod contexts;
pub mod errors;
pub mod math;
pub mod state;
pub mod utils;

use anchor_lang::prelude::*;
pub use contexts::*;

declare_id!("LBUZKhRxPF3XUpBCjp4YzTKgLccjZhTSDM9YuVaPwxo");

#[program]
pub mod lb_clmm {

    use super::*;

    pub fn initialize_position<'a, 'b, 'c: 'info, 'info>(
        ctx: Context<InitializePosition>,
        lower_bin_id: i32,
        width: i32,
    ) -> Result<()> {
        Ok(())
    }

    pub fn add_liquidity_by_strategy<'a, 'b, 'c: 'info, 'info>(
        ctx: Context<'a, 'b, 'c, 'info, ModifyLiquidity<'info>>,
        liquidity_parameter: LiquidityParameterByStrategy,
    ) -> Result<()> {
        Ok(())
    }

    pub fn claim_fee<'a, 'b, 'c: 'info, 'info>(ctx: Context<ClaimFee<'info>>) -> Result<()> {
        Ok(())
    }
}
