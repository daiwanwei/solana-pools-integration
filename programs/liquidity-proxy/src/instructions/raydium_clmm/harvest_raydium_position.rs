use anchor_lang::prelude::*;

#[derive(Accounts)]
pub struct HarvestRaydiumPosition {}

pub fn handler(ctx: Context<HarvestRaydiumPosition>) -> Result<()> {
    Ok(())
}
