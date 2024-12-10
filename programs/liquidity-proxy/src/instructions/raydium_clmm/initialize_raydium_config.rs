use anchor_lang::prelude::*;

#[derive(Accounts)]
pub struct InitializeRaydiumConfig {}

pub fn handler(ctx: Context<InitializeRaydiumConfig>) -> Result<()> {
    Ok(())
}
