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
    error::ErrorCode,
    state::{
        config::Config, protocol_position::RaydiumProtocolPosition,
        user_position::RaydiumUserPosition,
    },
};

#[derive(Accounts)]
pub struct IncreaseRaydiumLiquidity<'info> {
    #[account(mut)]
    pub signer: Signer<'info>,

    #[account(mut)]
    pub config: Account<'info, Config>,

    pub raydium_protocol_position: Account<'info, RaydiumProtocolPosition>,

    #[account(
        init_if_needed,
        payer = signer,
        space = 8 + RaydiumUserPosition::INIT_SPACE,
        seeds = [
            b"raydium_user_position",
            raydium_protocol_position.key().as_ref(),
            signer.key().as_ref(),
        ],
        bump,
    )]
    pub raydium_user_position: Account<'info, RaydiumUserPosition>,

    pub clmm_program: Program<'info, AmmV3>,
    /// Pays to mint the position
    pub nft_owner: Signer<'info>,

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

    /// Stores init state for the lower tick
    #[account(mut, constraint = tick_array_lower.load()?.pool_id == pool_state.key())]
    pub tick_array_lower: AccountLoader<'info, TickArrayState>,

    /// Stores init state for the upper tick
    #[account(mut, constraint = tick_array_upper.load()?.pool_id == pool_state.key())]
    pub tick_array_upper: AccountLoader<'info, TickArrayState>,

    /// The payer's token account for token_0
    #[account(
        mut,
        token::mint = token_vault_0.mint
    )]
    pub token_account_0: Box<InterfaceAccount<'info, TokenAccount>>,

    /// The token account spending token_1 to mint the position
    #[account(
        mut,
        token::mint = token_vault_1.mint
    )]
    pub token_account_1: Box<InterfaceAccount<'info, TokenAccount>>,

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

    /// Program to create mint account and mint tokens
    pub token_program: Program<'info, Token>,

    /// Token program 2022
    pub token_program_2022: Program<'info, Token2022>,

    pub system_program: Program<'info, System>,

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

pub fn handler<'a, 'b, 'c: 'info, 'info>(
    ctx: Context<'a, 'b, 'c, 'info, IncreaseRaydiumLiquidity<'info>>,
    liquidity: u128,
    amount_0_max: u64,
    amount_1_max: u64,
    base_flag: Option<bool>,
) -> Result<()> {
    let cpi_accounts = cpi::accounts::IncreaseLiquidityV2 {
        nft_owner: ctx.accounts.nft_owner.to_account_info(),
        nft_account: ctx.accounts.nft_account.to_account_info(),
        pool_state: ctx.accounts.pool_state.to_account_info(),
        protocol_position: ctx.accounts.protocol_position.to_account_info(),
        personal_position: ctx.accounts.personal_position.to_account_info(),
        tick_array_lower: ctx.accounts.tick_array_lower.to_account_info(),
        tick_array_upper: ctx.accounts.tick_array_upper.to_account_info(),
        token_account_0: ctx.accounts.token_account_0.to_account_info(),
        token_account_1: ctx.accounts.token_account_1.to_account_info(),
        token_vault_0: ctx.accounts.token_vault_0.to_account_info(),
        token_vault_1: ctx.accounts.token_vault_1.to_account_info(),
        token_program: ctx.accounts.token_program.to_account_info(),
        token_program_2022: ctx.accounts.token_program_2022.to_account_info(),
        vault_0_mint: ctx.accounts.vault_0_mint.to_account_info(),
        vault_1_mint: ctx.accounts.vault_1_mint.to_account_info(),
    };
    let cpi_context = CpiContext::new(ctx.accounts.clmm_program.to_account_info(), cpi_accounts)
        .with_remaining_accounts(ctx.remaining_accounts.to_vec());
    cpi::increase_liquidity_v2(cpi_context, liquidity, amount_0_max, amount_1_max, base_flag)?;

    ctx.accounts.personal_position.reload()?;

    // update protocol position
    ctx.accounts.raydium_protocol_position.total_shares = ctx
        .accounts
        .raydium_protocol_position
        .total_shares
        .checked_add(liquidity)
        .ok_or(ErrorCode::Overflow)?;
    ctx.accounts.raydium_protocol_position.fee_growth_inside_0_last_x64 =
        ctx.accounts.personal_position.fee_growth_inside_0_last_x64;
    ctx.accounts.raydium_protocol_position.fee_growth_inside_1_last_x64 =
        ctx.accounts.personal_position.fee_growth_inside_1_last_x64;

    // update user position
    if ctx.accounts.raydium_user_position.raydium_protocol_position == Pubkey::default() {
        ctx.accounts.raydium_user_position.bump = ctx.bumps.raydium_user_position;
        ctx.accounts.raydium_user_position.shares = liquidity;
        ctx.accounts.raydium_user_position.owner = ctx.accounts.signer.key();
        ctx.accounts.raydium_user_position.raydium_protocol_position =
            ctx.accounts.raydium_protocol_position.key();
    } else {
        if ctx.accounts.raydium_user_position.owner != ctx.accounts.signer.key() {
            return Err(ErrorCode::InvalidUser.into());
        }
        ctx.accounts.raydium_user_position.shares = ctx
            .accounts
            .raydium_user_position
            .shares
            .checked_add(liquidity)
            .ok_or(ErrorCode::Overflow)?;
    }
    ctx.accounts.raydium_user_position.fee_growth_inside_0_last_x64 =
        ctx.accounts.personal_position.fee_growth_inside_0_last_x64;
    ctx.accounts.raydium_user_position.fee_growth_inside_1_last_x64 =
        ctx.accounts.personal_position.fee_growth_inside_1_last_x64;
    ctx.accounts.raydium_user_position.token_fees_owed_0 =
        ctx.accounts.personal_position.token_fees_owed_0;
    ctx.accounts.raydium_user_position.token_fees_owed_1 =
        ctx.accounts.personal_position.token_fees_owed_1;

    Ok(())
}
