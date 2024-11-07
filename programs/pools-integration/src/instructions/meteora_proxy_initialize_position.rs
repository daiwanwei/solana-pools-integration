use anchor_lang::prelude::*;
use meteora_dlmm_cpi::{cpi, program::LbClmm};

#[derive(Accounts)]
pub struct MeteoraProxyInitializePosition<'info> {
    pub dlmm_program: Program<'info, LbClmm>,

    #[account(mut)]
    pub payer: Signer<'info>,

    /// CHECK: safe (the account to initialize)
    #[account(mut)]
    pub position: Signer<'info>,

    /// CHECK: safe (the account to initialize)
    pub lb_pair: UncheckedAccount<'info>,

    pub owner: Signer<'info>,

    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,

    /// CHECK:
    pub event_authority: UncheckedAccount<'info>,
}

pub fn handler<'a, 'b, 'c: 'info, 'info>(
    ctx: Context<'a, 'b, 'c, 'info, MeteoraProxyInitializePosition<'info>>,
    lower_bin_id: i32,
    width: i32,
) -> Result<()> {
    let cpi_program = ctx.accounts.dlmm_program.to_account_info();
    let cpi_accounts = cpi::accounts::InitializePosition {
        payer: ctx.accounts.payer.to_account_info(),
        position: ctx.accounts.position.to_account_info(),
        lb_pair: ctx.accounts.lb_pair.to_account_info(),
        owner: ctx.accounts.owner.to_account_info(),
        system_program: ctx.accounts.system_program.to_account_info(),
        rent: ctx.accounts.rent.to_account_info(),
        event_authority: ctx.accounts.event_authority.to_account_info(),
        program: ctx.accounts.dlmm_program.to_account_info(),
    };
    let cpi_context = CpiContext::new(cpi_program.to_account_info(), cpi_accounts)
        .with_remaining_accounts(ctx.remaining_accounts.to_vec());
    cpi::initialize_position(cpi_context, lower_bin_id, width)
}
