use anchor_lang::prelude::*;
use anchor_spl::token_interface::{Mint, TokenAccount, TokenInterface};
use meteora_dlmm_cpi::{cpi, program::LbClmm};

#[derive(Accounts)]
pub struct MeteoraProxyInitializeReward<'info> {
    pub dlmm_program: Program<'info, LbClmm>,

    /// CHECK:
    #[account(mut)]
    pub lb_pair: UncheckedAccount<'info>,

    /// CHECK:
    #[account(mut)]
    pub reward_vault: UncheckedAccount<'info>,
    pub reward_mint: Box<InterfaceAccount<'info, Mint>>,

    #[account(mut)]
    pub admin: Signer<'info>,

    pub token_program: Interface<'info, TokenInterface>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,

    /// CHECK:
    pub event_authority: UncheckedAccount<'info>,
}

pub fn handler<'a, 'b, 'c, 'info>(
    ctx: Context<'a, 'b, 'c, 'info, MeteoraProxyInitializeReward<'info>>,
    index: u64,
    reward_duration: u64,
    funder: Pubkey,
) -> Result<()> {
    let cpi_program = ctx.accounts.dlmm_program.to_account_info();

    let cpi_accounts = cpi::accounts::InitializeReward {
        lb_pair: ctx.accounts.lb_pair.to_account_info(),
        reward_vault: ctx.accounts.reward_vault.to_account_info(),
        reward_mint: ctx.accounts.reward_mint.to_account_info(),
        admin: ctx.accounts.admin.to_account_info(),
        token_program: ctx.accounts.token_program.to_account_info(),
        system_program: ctx.accounts.system_program.to_account_info(),
        rent: ctx.accounts.rent.to_account_info(),
        event_authority: ctx.accounts.event_authority.to_account_info(),
        program: ctx.accounts.dlmm_program.to_account_info(),
    };

    let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts)
        .with_remaining_accounts(ctx.remaining_accounts.to_vec());

    cpi::initialize_reward(cpi_ctx, index, reward_duration, funder)
}
