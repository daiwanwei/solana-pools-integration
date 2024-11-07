use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, Token, TokenAccount};
use whirlpool_cpi::{self, program::Whirlpool as WhirlpoolProgram, state::*};

#[derive(Accounts)]
pub struct OrcaProxyClosePosition<'info> {
    pub whirlpool_program: Program<'info, WhirlpoolProgram>,

    pub position_authority: Signer<'info>,

    /// CHECK: safe (the account to receive the remaining balance of the closed account)
    #[account(mut)]
    pub receiver: UncheckedAccount<'info>,

    #[account(mut)]
    pub position: Account<'info, Position>,

    #[account(mut, address = position.position_mint)]
    pub position_mint: Account<'info, Mint>,

    #[account(mut,
      constraint = position_token_account.amount == 1,
      constraint = position_token_account.mint == position.position_mint)]
    pub position_token_account: Box<Account<'info, TokenAccount>>,

    #[account(address = token::ID)]
    pub token_program: Program<'info, Token>,
}

pub fn handler(ctx: Context<OrcaProxyClosePosition>) -> Result<()> {
    let cpi_program = ctx.accounts.whirlpool_program.to_account_info();

    let cpi_accounts = whirlpool_cpi::cpi::accounts::ClosePosition {
        position_authority: ctx.accounts.position_authority.to_account_info(),
        receiver: ctx.accounts.receiver.to_account_info(),
        position: ctx.accounts.position.to_account_info(),
        position_mint: ctx.accounts.position_mint.to_account_info(),
        position_token_account: ctx.accounts.position_token_account.to_account_info(),
        token_program: ctx.accounts.token_program.to_account_info(),
    };

    let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);

    // execute CPI
    msg!("CPI: whirlpool close_position instruction");
    whirlpool_cpi::cpi::close_position(cpi_ctx)?;

    Ok(())
}
