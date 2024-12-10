use anchor_lang::prelude::*;

#[derive(Accounts)]
pub struct OpenRaydiumPosition {}

pub fn handler(ctx: Context<OpenRaydiumPosition>) -> Result<()> {
    Ok(())
}
