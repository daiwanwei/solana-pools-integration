use anchor_lang::prelude::*;

#[derive(Accounts)]
pub struct DecreaseRaydiumLiquidity {}

pub fn handler(ctx: Context<DecreaseRaydiumLiquidity>) -> Result<()> {
    Ok(())
}
