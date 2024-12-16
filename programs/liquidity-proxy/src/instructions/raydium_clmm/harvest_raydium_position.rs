use anchor_lang::prelude::*;
use anchor_spl::{
    token::Token,
    token_interface::{Mint, Token2022, TokenAccount},
};
use raydium_clmm_cpi::{
    cpi,
    program::AmmV3,
    state::{
        personal_position::PersonalPositionState, pool::PoolState,
        protocol_position::ProtocolPositionState, tick_array::TickArrayState,
    },
};

use crate::{
    constants::RAYDIUM_PROTOCOL_POSITION_SEED,
    error::ErrorCode,
    state::{
        config::Config, protocol_position::RaydiumProtocolPosition,
        user_position::RaydiumUserPosition,
    },
    utils::token::transfer_from_position_vault_to_user,
};

#[derive(Accounts)]
pub struct HarvestRaydiumPosition<'info> {
    #[account(mut)]
    pub signer: Signer<'info>,

    #[account(mut)]
    pub config: Account<'info, Config>,

    #[account(mut)]
    pub raydium_protocol_position: Box<Account<'info, RaydiumProtocolPosition>>,

    #[account(mut)]
    pub raydium_user_position: Box<Account<'info, RaydiumUserPosition>>,

    #[account(
        mut,
        token::mint = token_vault_0.mint
    )]
    pub position_vault_0: Box<InterfaceAccount<'info, TokenAccount>>,

    #[account(
        mut,
        token::mint = token_vault_1.mint
    )]
    pub position_vault_1: Box<InterfaceAccount<'info, TokenAccount>>,

    pub clmm_program: Program<'info, AmmV3>,

    /// The token account for nft
    #[account(
        constraint = nft_account.mint == personal_position.nft_mint,
        token::token_program = token_program,
    )]
    pub nft_account: Box<InterfaceAccount<'info, TokenAccount>>,

    #[account(mut)]
    pub pool_state: AccountLoader<'info, PoolState>,

    #[account(
        mut,
        // seeds = [
        //     POSITION_SEED.as_bytes(),
        //     pool_state.key().as_ref(),
        //     &personal_position.tick_lower_index.to_be_bytes(),
        //     &personal_position.tick_upper_index.to_be_bytes(),
        // ],
        // seeds::program = clmm_program,
        // bump,
        constraint = protocol_position.pool_id == pool_state.key(),
    )]
    pub protocol_position: Box<Account<'info, ProtocolPositionState>>,

    /// Increase liquidity for this position
    #[account(mut, constraint = personal_position.pool_id == pool_state.key())]
    pub personal_position: Box<Account<'info, PersonalPositionState>>,

    /// The address that holds pool tokens for token_0
    #[account(
        mut,
        constraint = token_vault_0.key() == pool_state.load()?.token_vault_0
    )]
    pub token_vault_0: Box<InterfaceAccount<'info, TokenAccount>>,

    /// The address that holds pool tokens for token_1
    #[account(
        mut,
        constraint = token_vault_1.key() == pool_state.load()?.token_vault_1
    )]
    pub token_vault_1: Box<InterfaceAccount<'info, TokenAccount>>,

    /// Stores init state for the lower tick
    #[account(mut, constraint = tick_array_lower.load()?.pool_id == pool_state.key())]
    pub tick_array_lower: AccountLoader<'info, TickArrayState>,

    /// Stores init state for the upper tick
    #[account(mut, constraint = tick_array_upper.load()?.pool_id == pool_state.key())]
    pub tick_array_upper: AccountLoader<'info, TickArrayState>,

    /// The destination token account for receive amount_0
    #[account(
        mut,
        token::mint = token_vault_0.mint
    )]
    pub recipient_token_account_0: Box<InterfaceAccount<'info, TokenAccount>>,

    /// The destination token account for receive amount_1
    #[account(
        mut,
        token::mint = token_vault_1.mint
    )]
    pub recipient_token_account_1: Box<InterfaceAccount<'info, TokenAccount>>,

    /// Program to create mint account and mint tokens
    pub token_program: Program<'info, Token>,

    /// Token program 2022
    pub token_program_2022: Program<'info, Token2022>,

    /// memo program
    /// CHECK:
    // #[account(
    //     address = spl_memo::id()
    // )]
    pub memo_program: UncheckedAccount<'info>,

    /// The mint of token vault 0
    #[account(
            address = token_vault_0.mint
    )]
    pub vault_0_mint: Box<InterfaceAccount<'info, Mint>>,

    /// The mint of token vault 1
    #[account(
            address = token_vault_1.mint
    )]
    pub vault_1_mint: Box<InterfaceAccount<'info, Mint>>,
    // remaining account
    // #[account(
    //     seeds = [
    //         POOL_TICK_ARRAY_BITMAP_SEED.as_bytes(),
    //         pool_state.key().as_ref(),
    //     ],
    //     bump
    // )]
    // pub tick_array_bitmap: AccountLoader<'info, TickArrayBitmapExtension>,
}

pub fn handler<'a, 'b, 'c, 'info>(
    ctx: Context<'a, 'b, 'c, 'info, HarvestRaydiumPosition<'info>>,
) -> Result<()> {
    if ctx.accounts.signer.key() != ctx.accounts.raydium_user_position.owner {
        return Err(ErrorCode::InvalidUser.into());
    }

    let cpi_accounts = cpi::accounts::DecreaseLiquidityV2 {
        nft_owner: ctx.accounts.raydium_protocol_position.to_account_info(),
        nft_account: ctx.accounts.nft_account.to_account_info(),
        pool_state: ctx.accounts.pool_state.to_account_info(),
        protocol_position: ctx.accounts.protocol_position.to_account_info(),
        personal_position: ctx.accounts.personal_position.to_account_info(),
        token_vault_0: ctx.accounts.token_vault_0.to_account_info(),
        token_vault_1: ctx.accounts.token_vault_1.to_account_info(),
        tick_array_lower: ctx.accounts.tick_array_lower.to_account_info(),
        tick_array_upper: ctx.accounts.tick_array_upper.to_account_info(),
        recipient_token_account_0: ctx.accounts.position_vault_0.to_account_info(),
        recipient_token_account_1: ctx.accounts.position_vault_1.to_account_info(),
        token_program: ctx.accounts.token_program.to_account_info(),
        token_program_2022: ctx.accounts.token_program_2022.to_account_info(),
        vault_0_mint: ctx.accounts.vault_0_mint.to_account_info(),
        vault_1_mint: ctx.accounts.vault_1_mint.to_account_info(),
        memo_program: ctx.accounts.memo_program.to_account_info(),
    };
    let pool_state_key = ctx.accounts.raydium_protocol_position.raydium_pool;
    let signer_seeds: [&[&[u8]]; 1] = {
        let tick_lower_index = ctx.accounts.raydium_protocol_position.tick_lower_index;
        let tick_upper_index = ctx.accounts.raydium_protocol_position.tick_upper_index;
        let bump = ctx.accounts.raydium_protocol_position.bump;
        [&[
            &RAYDIUM_PROTOCOL_POSITION_SEED.as_bytes(),
            pool_state_key.as_ref(),
            &tick_lower_index.to_le_bytes(),
            &tick_upper_index.to_le_bytes(),
            &[bump],
        ]]
    };
    let cpi_context = CpiContext::new_with_signer(
        ctx.accounts.clmm_program.to_account_info(),
        cpi_accounts,
        &signer_seeds,
    )
    .with_remaining_accounts(ctx.remaining_accounts.to_vec());
    cpi::decrease_liquidity_v2(cpi_context, 0, 0, 0)?;

    ctx.accounts.position_vault_0.reload()?;
    ctx.accounts.position_vault_1.reload()?;
    // transfer from position vault to user
    // FIXME: use correct token amount
    let remaining_token_0 = ctx.accounts.position_vault_0.amount;
    let remaining_token_1 = ctx.accounts.position_vault_1.amount;
    transfer_from_position_vault_to_user(
        ctx.accounts.raydium_protocol_position.clone(),
        &ctx.accounts.position_vault_0.to_account_info(),
        &ctx.accounts.recipient_token_account_0.to_account_info(),
        Some(ctx.accounts.vault_0_mint.clone()),
        &ctx.accounts.token_program.to_account_info(),
        Some(ctx.accounts.token_program_2022.to_account_info()),
        remaining_token_0,
    )?;

    transfer_from_position_vault_to_user(
        ctx.accounts.raydium_protocol_position.clone(),
        &ctx.accounts.position_vault_1.to_account_info(),
        &ctx.accounts.recipient_token_account_1.to_account_info(),
        Some(ctx.accounts.vault_1_mint.clone()),
        &ctx.accounts.token_program.to_account_info(),
        Some(ctx.accounts.token_program_2022.to_account_info()),
        remaining_token_1,
    )?;

    Ok(())
}
