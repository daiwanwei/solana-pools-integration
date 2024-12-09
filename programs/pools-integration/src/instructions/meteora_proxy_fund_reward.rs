use anchor_lang::prelude::*;
use anchor_spl::token_interface::{Mint, TokenAccount, TokenInterface};
use meteora_dlmm_cpi::{cpi, program::LbClmm};

#[derive(Accounts)]
pub struct MeteoraProxyClaimReward<'info> {
    pub dlmm_program: Program<'info, LbClmm>,

    /// CHECK:
    #[account(mut)]
    pub position: UncheckedAccount<'info>,

    /// CHECK:
    #[account(mut)]
    pub lb_pair: UncheckedAccount<'info>,

    #[account(
        mut,
        token::mint = reward_mint
    )]
    pub user_token_account: Box<InterfaceAccount<'info, TokenAccount>>,

    #[account(mut)]
    pub reward_vault: Box<InterfaceAccount<'info, TokenAccount>>,
    pub reward_mint: Box<InterfaceAccount<'info, Mint>>,

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
    ctx: Context<'a, 'b, 'c, 'info, MeteoraProxyClaimReward<'info>>,
) -> Result<()> {
    let cpi_program = ctx.accounts.dlmm_program.to_account_info();

    let cpi_accounts = cpi::accounts::ClaimReward {
        position: ctx.accounts.position.to_account_info(),
        lb_pair: ctx.accounts.lb_pair.to_account_info(),
        user_token_account: ctx.accounts.user_token_account.to_account_info(),
        reward_vault: ctx.accounts.reward_vault.to_account_info(),
        reward_mint: ctx.accounts.reward_mint.to_account_info(),
        bin_array_lower: ctx.accounts.bin_array_lower.to_account_info(),
        bin_array_upper: ctx.accounts.bin_array_upper.to_account_info(),
        sender: ctx.accounts.sender.to_account_info(),
        token_program: ctx.accounts.token_program.to_account_info(),
        event_authority: ctx.accounts.event_authority.to_account_info(),
        program: ctx.accounts.dlmm_program.to_account_info(),
    };

    let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts)
        .with_remaining_accounts(ctx.remaining_accounts.to_vec());

    cpi::claim_reward(cpi_ctx)
}
