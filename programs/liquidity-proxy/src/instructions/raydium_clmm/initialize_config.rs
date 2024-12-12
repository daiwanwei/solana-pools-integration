use anchor_lang::prelude::*;

use crate::state::Config;

#[derive(Accounts)]
#[instruction(admin: Pubkey, index: u16)]
pub struct InitializeConfig<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,

    #[account(
        init,
        payer = payer,
        space = 8 + Config::INIT_SPACE,
        seeds = [b"config", index.to_le_bytes().as_ref()],
        bump
    )]
    pub config: Account<'info, Config>,

    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<InitializeConfig>, admin: Pubkey, index: u16) -> Result<()> {
    ctx.accounts.config.admin = admin;
    ctx.accounts.config.index = index;
    ctx.accounts.config.bump = ctx.bumps.config;
    Ok(())
}
