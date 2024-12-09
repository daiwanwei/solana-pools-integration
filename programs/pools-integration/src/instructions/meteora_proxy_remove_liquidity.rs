use anchor_lang::prelude::*;
use meteora_dlmm_cpi::cpi;

use crate::instructions::meteora_proxy_add_liquidity::MeteoraProxyModifyLiquidity;

pub fn handler<'a, 'b, 'c, 'info>(
    ctx: Context<'a, 'b, 'c, 'info, MeteoraProxyModifyLiquidity<'info>>,
    from_bin_id: i32,
    to_bin_id: i32,
    bps_to_remove: u16,
) -> Result<()> {
    let cpi_program = ctx.accounts.dlmm_program.to_account_info();

    let cpi_accounts = cpi::accounts::ModifyLiquidity {
        position: ctx.accounts.position.to_account_info(),
        lb_pair: ctx.accounts.lb_pair.to_account_info(),
        bin_array_bitmap_extension: ctx
            .accounts
            .bin_array_bitmap_extension
            .as_mut()
            .map(|account| account.to_account_info()),
        user_token_x: ctx.accounts.user_token_x.to_account_info(),
        user_token_y: ctx.accounts.user_token_y.to_account_info(),
        reserve_x: ctx.accounts.reserve_x.to_account_info(),
        reserve_y: ctx.accounts.reserve_y.to_account_info(),
        token_x_mint: ctx.accounts.token_x_mint.to_account_info(),
        token_y_mint: ctx.accounts.token_y_mint.to_account_info(),
        bin_array_lower: ctx.accounts.bin_array_lower.to_account_info(),
        bin_array_upper: ctx.accounts.bin_array_upper.to_account_info(),
        sender: ctx.accounts.sender.to_account_info(),
        token_x_program: ctx.accounts.token_x_program.to_account_info(),
        token_y_program: ctx.accounts.token_y_program.to_account_info(),
        event_authority: ctx.accounts.event_authority.to_account_info(),
        program: ctx.accounts.dlmm_program.to_account_info(),
    };

    let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts)
        .with_remaining_accounts(ctx.remaining_accounts.to_vec());

    cpi::remove_liquidity_by_range(cpi_ctx, from_bin_id, to_bin_id, bps_to_remove)
}
