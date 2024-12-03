use anchor_lang::prelude::*;
use meteora_dlmm_cpi::{cpi, program::LbClmm};

#[derive(Accounts)]
pub struct MeteoraProxyClosePosition<'info> {
    pub dlmm_program: Program<'info, LbClmm>,

    /// CHECK:
    #[account(mut)]
    pub position: UncheckedAccount<'info>,

    /// CHECK:
    #[account(mut)]
    pub lb_pair: UncheckedAccount<'info>,

    /// CHECK:
    #[account(mut)]
    pub bin_array_lower: UncheckedAccount<'info>,
    /// CHECK:
    #[account(mut)]
    pub bin_array_upper: UncheckedAccount<'info>,

    pub sender: Signer<'info>,

    /// CHECK: Account to receive closed account rental SOL
    #[account(mut)]
    pub rent_receiver: UncheckedAccount<'info>,

    /// CHECK:
    pub event_authority: UncheckedAccount<'info>,
}

pub fn handler<'a, 'b, 'c, 'info>(
    ctx: Context<'a, 'b, 'c, 'info, MeteoraProxyClosePosition<'info>>,
) -> Result<()> {
    let cpi_program = ctx.accounts.dlmm_program.to_account_info();

    let cpi_accounts = cpi::accounts::ClosePosition {
        position: ctx.accounts.position.to_account_info(),
        lb_pair: ctx.accounts.lb_pair.to_account_info(),
        bin_array_lower: ctx.accounts.bin_array_lower.to_account_info(),
        bin_array_upper: ctx.accounts.bin_array_upper.to_account_info(),
        sender: ctx.accounts.sender.to_account_info(),
        rent_receiver: ctx.accounts.rent_receiver.to_account_info(),
        event_authority: ctx.accounts.event_authority.to_account_info(),
        program: ctx.accounts.dlmm_program.to_account_info(),
    };

    let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts)
        .with_remaining_accounts(ctx.remaining_accounts.to_vec());

    cpi::close_position(cpi_ctx)
}
