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

    pub fn remove_liquidity_by_range<'a, 'b, 'c: 'info, 'info>(
        ctx: Context<'a, 'b, 'c, 'info, ModifyLiquidity<'info>>,
        from_bin_id: i32,
        to_bin_id: i32,
        bps_to_remove: u16,
    ) -> Result<()> {
        Ok(())
    }

    pub fn claim_fee<'a, 'b, 'c: 'info, 'info>(ctx: Context<ClaimFee<'info>>) -> Result<()> {
        Ok(())
    }

    pub fn claim_reward<'a, 'b, 'c: 'info, 'info>(ctx: Context<ClaimReward<'info>>) -> Result<()> {
        Ok(())
    }

    pub fn close_position<'a, 'b, 'c: 'info, 'info>(
        ctx: Context<ClosePosition<'info>>,
    ) -> Result<()> {
        Ok(())
    }

    pub fn initialize_reward<'a, 'b, 'c: 'info, 'info>(
        ctx: Context<InitializeReward<'info>>,
        index: u64,
        reward_duration: u64,
        funder: Pubkey,
    ) -> Result<()> {
        Ok(())
    }

    pub fn fund_reward<'a, 'b, 'c: 'info, 'info>(
        ctx: Context<FundReward<'info>>,
        index: u64,
        amount: u64,
        carry_forward: bool,
    ) -> Result<()> {
        Ok(())
    }
}
