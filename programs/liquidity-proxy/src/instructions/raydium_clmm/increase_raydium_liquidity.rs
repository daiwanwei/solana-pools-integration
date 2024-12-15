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
    utils::token::{transfer_from_position_vault_to_user, transfer_from_user_to_position_vault},
};

#[derive(Accounts)]
#[instruction(reciever: Pubkey)]
pub struct IncreaseRaydiumLiquidity<'info> {
    #[account(mut)]
    pub signer: Signer<'info>,

    #[account(mut)]
    pub config: Account<'info, Config>,

    #[account(mut)]
    pub raydium_protocol_position: Box<Account<'info, RaydiumProtocolPosition>>,

    #[account(
        init_if_needed,
        payer = signer,
        space = 8 + RaydiumUserPosition::INIT_SPACE,
        seeds = [
            b"raydium_user_position",
            raydium_protocol_position.key().as_ref(),
            reciever.as_ref(),
        ],
        bump,
    )]
    pub raydium_user_position: Box<Account<'info, RaydiumUserPosition>>,

    pub clmm_program: Program<'info, AmmV3>,

    /// The token account for nft
    #[account(
        mut,
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
        mut,
        address = token_vault_0.mint
    )]
    pub vault_0_mint: Box<InterfaceAccount<'info, Mint>>,

    /// The mint of token vault 1
    #[account(
        mut,
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
    reciever: Pubkey,
    liquidity: u128,
    amount_0_max: u64,
    amount_1_max: u64,
    base_flag: Option<bool>,
) -> Result<()> {
    transfer_from_user_to_position_vault(
        ctx.accounts.signer.clone(),
        &ctx.accounts.token_account_0.to_account_info(),
        &ctx.accounts.position_vault_0.to_account_info(),
        Some(ctx.accounts.vault_0_mint.clone()),
        &ctx.accounts.token_program.to_account_info(),
        Some(ctx.accounts.token_program_2022.to_account_info()),
        amount_0_max,
    )?;

    transfer_from_user_to_position_vault(
        ctx.accounts.signer.clone(),
        &ctx.accounts.token_account_1.to_account_info(),
        &ctx.accounts.position_vault_1.to_account_info(),
        Some(ctx.accounts.vault_1_mint.clone()),
        &ctx.accounts.token_program.to_account_info(),
        Some(ctx.accounts.token_program_2022.to_account_info()),
        amount_1_max,
    )?;

    let cpi_accounts = cpi::accounts::IncreaseLiquidityV2 {
        nft_owner: ctx.accounts.raydium_protocol_position.to_account_info(),
        nft_account: ctx.accounts.nft_account.to_account_info(),
        pool_state: ctx.accounts.pool_state.to_account_info(),
        protocol_position: ctx.accounts.protocol_position.to_account_info(),
        personal_position: ctx.accounts.personal_position.to_account_info(),
        tick_array_lower: ctx.accounts.tick_array_lower.to_account_info(),
        tick_array_upper: ctx.accounts.tick_array_upper.to_account_info(),
        token_account_0: ctx.accounts.position_vault_0.to_account_info(),
        token_account_1: ctx.accounts.position_vault_1.to_account_info(),
        token_vault_0: ctx.accounts.token_vault_0.to_account_info(),
        token_vault_1: ctx.accounts.token_vault_1.to_account_info(),
        token_program: ctx.accounts.token_program.to_account_info(),
        token_program_2022: ctx.accounts.token_program_2022.to_account_info(),
        vault_0_mint: ctx.accounts.vault_0_mint.to_account_info(),
        vault_1_mint: ctx.accounts.vault_1_mint.to_account_info(),
    };

    let pool_state_key = ctx.accounts.raydium_protocol_position.raydium_pool;
    let signer_seeds: [&[&[u8]]; 1] = {
        let tick_lower_index = ctx.accounts.raydium_protocol_position.tick_lower_index;
        let tick_upper_index = ctx.accounts.raydium_protocol_position.tick_upper_index;
        let bump = ctx.accounts.raydium_protocol_position.bump;
        [&[
            b"raydium_protocol_position",
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
        ctx.accounts.raydium_user_position.owner = reciever;
        ctx.accounts.raydium_user_position.raydium_protocol_position =
            ctx.accounts.raydium_protocol_position.key();
    } else {
        if ctx.accounts.raydium_user_position.owner != reciever {
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

    // transfer remaining token to user
    ctx.accounts.position_vault_0.reload()?;
    ctx.accounts.position_vault_1.reload()?;
    let remaining_token_0 = ctx.accounts.position_vault_0.amount;
    let remaining_token_1 = ctx.accounts.position_vault_1.amount;

    transfer_from_position_vault_to_user(
        ctx.accounts.raydium_protocol_position.clone(),
        &ctx.accounts.position_vault_0.to_account_info(),
        &ctx.accounts.token_account_0.to_account_info(),
        Some(ctx.accounts.vault_0_mint.clone()),
        &ctx.accounts.token_program.to_account_info(),
        Some(ctx.accounts.token_program_2022.to_account_info()),
        remaining_token_0,
    )?;

    transfer_from_position_vault_to_user(
        ctx.accounts.raydium_protocol_position.clone(),
        &ctx.accounts.position_vault_1.to_account_info(),
        &ctx.accounts.token_account_1.to_account_info(),
        Some(ctx.accounts.vault_1_mint.clone()),
        &ctx.accounts.token_program.to_account_info(),
        Some(ctx.accounts.token_program_2022.to_account_info()),
        remaining_token_1,
    )?;

    Ok(())
}
