use anchor_lang::prelude::*;

#[derive(Accounts)]
pub struct IncreaseRaydiumLiquidity {}

pub fn handler(ctx: Context<IncreaseRaydiumLiquidity>) -> Result<()> {
    Ok(())
}
