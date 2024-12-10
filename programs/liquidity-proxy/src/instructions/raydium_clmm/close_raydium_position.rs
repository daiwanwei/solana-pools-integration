use anchor_lang::prelude::*;

#[derive(Accounts)]
pub struct CloseRaydiumPosition {}

pub fn handler(ctx: Context<CloseRaydiumPosition>) -> Result<()> {
    Ok(())
}
