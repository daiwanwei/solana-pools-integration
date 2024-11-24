use std::cell::Ref;

use anchor_lang::prelude::*;
use meteora_dlmm_cpi::state::{bin::BinArray, lb_pair::LbPair, position::PositionV2};

use crate::events::FeeLogEvent;

#[derive(Accounts)]
pub struct MeteoraLogPositionFee<'info> {
    /// CHECK:
    #[account(mut)]
    pub position: AccountLoader<'info, PositionV2>,

    /// CHECK:
    pub lb_pair: AccountLoader<'info, LbPair>,

    /// CHECK:
    pub bin_array_lower: AccountLoader<'info, BinArray>,
    /// CHECK:
    pub bin_array_upper: AccountLoader<'info, BinArray>,
}

pub fn handler(ctx: Context<MeteoraLogPositionFee>) -> Result<()> {
    let bin_arrays: Vec<Ref<BinArray>> =
        vec![ctx.accounts.bin_array_lower.load()?, ctx.accounts.bin_array_upper.load()?];

    let (fee_x, fee_y) =
        ctx.accounts.position.load()?.get_claimable_fee_per_position(&bin_arrays)?;

    emit!(FeeLogEvent { token_fees_0: fee_x, token_fees_1: fee_y });

    Ok(())
}
