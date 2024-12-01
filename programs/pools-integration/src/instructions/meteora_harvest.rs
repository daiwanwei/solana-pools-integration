use anchor_lang::prelude::*;
use anchor_spl::token_interface::{Mint, TokenAccount, TokenInterface};
use meteora_dlmm_cpi::{cpi, program::LbClmm, LiquidityParameter, LiquidityParameterByStrategy};

#[derive(Accounts)]
pub struct MeteoraHarvest<'info> {
    pub dlmm_program: Program<'info, LbClmm>,

    /// CHECK:
    #[account(mut)]
    pub position: UncheckedAccount<'info>,

    /// CHECK:
    #[account(mut)]
    pub lb_pair: UncheckedAccount<'info>,

    #[account(
        mut,
        token::mint = token_x_mint
    )]
    pub user_token_x: Box<InterfaceAccount<'info, TokenAccount>>,
    #[account(
        mut,
        token::mint = token_y_mint
    )]
    pub user_token_y: Box<InterfaceAccount<'info, TokenAccount>>,

    #[account(mut)]
    pub reserve_x: Box<InterfaceAccount<'info, TokenAccount>>,
    #[account(mut)]
    pub reserve_y: Box<InterfaceAccount<'info, TokenAccount>>,

    pub token_x_mint: Box<InterfaceAccount<'info, Mint>>,
    pub token_y_mint: Box<InterfaceAccount<'info, Mint>>,

    /// CHECK:
    #[account(mut)]
    pub bin_array_lower: UncheckedAccount<'info>,
    /// CHECK:
    #[account(mut)]
    pub bin_array_upper: UncheckedAccount<'info>,

    pub sender: Signer<'info>,
    pub token_program: Interface<'info, TokenInterface>,

    /// CHECK:
    pub event_authority: UncheckedAccount<'info>,
}

pub fn handler<'a, 'b, 'c, 'info>(
    ctx: Context<'a, 'b, 'c, 'info, MeteoraHarvest<'info>>,
) -> Result<()> {
    let cpi_program = ctx.accounts.dlmm_program.to_account_info();

    let cpi_accounts = cpi::accounts::ClaimFee {
        position: ctx.accounts.position.to_account_info(),
        lb_pair: ctx.accounts.lb_pair.to_account_info(),
        user_token_x: ctx.accounts.user_token_x.to_account_info(),
        user_token_y: ctx.accounts.user_token_y.to_account_info(),
        reserve_x: ctx.accounts.reserve_x.to_account_info(),
        reserve_y: ctx.accounts.reserve_y.to_account_info(),
        token_x_mint: ctx.accounts.token_x_mint.to_account_info(),
        token_y_mint: ctx.accounts.token_y_mint.to_account_info(),
        bin_array_lower: ctx.accounts.bin_array_lower.to_account_info(),
        bin_array_upper: ctx.accounts.bin_array_upper.to_account_info(),
        sender: ctx.accounts.sender.to_account_info(),
        token_program: ctx.accounts.token_program.to_account_info(),
        event_authority: ctx.accounts.event_authority.to_account_info(),
        program: ctx.accounts.dlmm_program.to_account_info(),
    };

    let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts)
        .with_remaining_accounts(ctx.remaining_accounts.to_vec());

    cpi::claim_fee(cpi_ctx)
}
