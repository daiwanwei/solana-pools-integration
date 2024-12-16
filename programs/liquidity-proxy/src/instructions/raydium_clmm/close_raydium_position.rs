use anchor_lang::prelude::*;
use anchor_spl::token::Token;
use anchor_spl::token_interface::{Mint, TokenAccount};
use raydium_clmm_cpi::{
    constants::POSITION_SEED, cpi, program::AmmV3, state::PersonalPositionState,
};

use crate::{
    constants::RAYDIUM_PROTOCOL_POSITION_SEED,
    error::ErrorCode,
    state::{config::Config, protocol_position::RaydiumProtocolPosition},
};

#[derive(Accounts)]
pub struct CloseRaydiumPosition<'info> {
    #[account(mut)]
    pub signer: Signer<'info>,

    #[account(mut)]
    pub config: Account<'info, Config>,

    #[account(mut)]
    pub raydium_protocol_position: Box<Account<'info, RaydiumProtocolPosition>>,

    pub clmm_program: Program<'info, AmmV3>,

    /// Unique token mint address
    #[account(
      mut,
      address = personal_position.nft_mint,
      mint::token_program = token_program,
    )]
    pub position_nft_mint: Box<InterfaceAccount<'info, Mint>>,

    /// Token account where position NFT will be minted
    #[account(
        mut,
        associated_token::mint = position_nft_mint,
        associated_token::authority = raydium_protocol_position,
        constraint = position_nft_account.amount == 1,
        token::token_program = token_program,
    )]
    pub position_nft_account: Box<InterfaceAccount<'info, TokenAccount>>,

    /// To store metaplex metadata
    /// CHECK: Safety check performed inside function body
    // #[account(mut)]
    // pub metadata_account: UncheckedAccount<'info>,

    /// Metadata for the tokenized position
    #[account(
        mut,
        // seeds = [POSITION_SEED.as_bytes(), position_nft_mint.key().as_ref()],
        // seeds::program = clmm_program,
        // bump,
        // close = nft_owner
    )]
    pub personal_position: Box<Account<'info, PersonalPositionState>>,

    /// Program to create the position manager state account
    pub system_program: Program<'info, System>,
    /// Program to create mint account and mint tokens
    pub token_program: Program<'info, Token>,
    // /// Reserved for upgrade
    // pub token_program_2022: Program<'info, Token2022>,
}

pub fn handler<'a, 'b, 'c, 'info>(
    ctx: Context<'a, 'b, 'c, 'info, CloseRaydiumPosition<'info>>,
) -> Result<()> {
    if ctx.accounts.config.admin != ctx.accounts.signer.key() {
        return Err(ErrorCode::InvalidAdmin.into());
    }

    if ctx.accounts.raydium_protocol_position.total_shares != 0 {
        return Err(ErrorCode::ProtocolPositionNotEmpty.into());
    }

    let cpi_accounts = cpi::accounts::ClosePosition {
        nft_owner: ctx.accounts.raydium_protocol_position.to_account_info(),
        position_nft_mint: ctx.accounts.position_nft_mint.to_account_info(),
        position_nft_account: ctx.accounts.position_nft_account.to_account_info(),
        personal_position: ctx.accounts.personal_position.to_account_info(),
        system_program: ctx.accounts.system_program.to_account_info(),
        token_program: ctx.accounts.token_program.to_account_info(),
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
    cpi::close_position(cpi_context)?;

    if ctx.accounts.raydium_protocol_position.total_shares == 0 {
        let account = ctx.accounts.raydium_protocol_position.to_account_info();

        let dest_starting_lamports = ctx.accounts.signer.lamports();

        **ctx.accounts.signer.lamports.borrow_mut() =
            dest_starting_lamports.checked_add(account.lamports()).unwrap();
        **account.lamports.borrow_mut() = 0;
        let mut source_data = account.data.borrow_mut();
        source_data.fill(0);
    }
    Ok(())
}
