use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    metadata::Metadata,
    token::Token,
    token_interface::{Mint, Token2022, TokenAccount},
};
use raydium_clmm_cpi::{
    cpi,
    program::AmmV3,
    state::{PoolState, ProtocolPositionState},
};

use crate::{
    error::ErrorCode,
    state::{
        config::Config, protocol_position::RaydiumProtocolPosition,
        user_position::RaydiumUserPosition,
    },
};

#[derive(Accounts)]
pub struct OpenRaydiumPosition<'info> {
    #[account(mut)]
    pub signer: Signer<'info>,

    #[account(mut)]
    pub config: Account<'info, Config>,

    #[account(
        init,
        payer = signer,
        space = 8 + RaydiumProtocolPosition::INIT_SPACE,
    )]
    pub raydium_protocol_position: Account<'info, RaydiumProtocolPosition>,

    #[account(
        init,
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
    #[account(mut)]
    pub payer: Signer<'info>,

    /// CHECK: Receives the position NFT
    #[account(mut)]
    pub position_nft_owner: UncheckedAccount<'info>,

    /// CHECK: Unique token mint address, random keypair
    #[account(mut)]
    pub position_nft_mint: Signer<'info>,

    /// CHECK: Token account where position NFT will be minted
    /// This account created in the contract by cpi to avoid large stack variables
    #[account(mut)]
    pub position_nft_account: UncheckedAccount<'info>,

    /// To store metaplex metadata
    /// CHECK: Safety check performed inside function body
    #[account(mut)]
    pub metadata_account: UncheckedAccount<'info>,

    /// Add liquidity for this pool
    #[account(mut)]
    pub pool_state: AccountLoader<'info, PoolState>,

    /// CHECK: Store the information of market marking in range
    #[account(
        mut,
        // seeds = [
        //     POSITION_SEED.as_bytes(),
        //     pool_state.key().as_ref(),
        //     &tick_lower_index.to_be_bytes(),
        //     &tick_upper_index.to_be_bytes(),
        // ],
        // seeds::program = clmm_program,
        // bump,
    )]
    pub protocol_position: UncheckedAccount<'info>,

    /// CHECK: Account to mark the lower tick as initialized
    #[account(
        mut,
        // seeds = [
        //     TICK_ARRAY_SEED.as_bytes(),
        //     pool_state.key().as_ref(),
        //     &tick_array_lower_start_index.to_be_bytes(),
        // ],
        // seeds::program = clmm_program,
        // bump,
    )]
    pub tick_array_lower: UncheckedAccount<'info>,

    /// CHECK:Account to store data for the position's upper tick
    #[account(
        mut,
        // seeds = [
        //     TICK_ARRAY_SEED.as_bytes(),
        //     pool_state.key().as_ref(),
        //     &tick_array_upper_start_index.to_be_bytes(),
        // ],
        // seeds::program = clmm_program,
        // bump,
    )]
    pub tick_array_upper: UncheckedAccount<'info>,

    /// CHECK: personal position state
    #[account(
        mut,
        // seeds = [POSITION_SEED.as_bytes(), position_nft_mint.key().as_ref()],
        // bump,
    )]
    pub personal_position: UncheckedAccount<'info>,

    /// The token_0 account deposit token to the pool
    #[account(
        mut,
        token::mint = token_vault_0.mint
    )]
    pub token_account_0: Box<InterfaceAccount<'info, TokenAccount>>,

    /// The token_1 account deposit token to the pool
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

    /// Sysvar for token mint and ATA creation
    pub rent: Sysvar<'info, Rent>,

    /// Program to create the position manager state account
    pub system_program: Program<'info, System>,

    /// Program to create mint account and mint tokens
    pub token_program: Program<'info, Token>,
    /// Program to create an ATA for receiving position NFT
    pub associated_token_program: Program<'info, AssociatedToken>,

    /// Program to create NFT metadata
    /// CHECK: Metadata program address constraint applied
    pub metadata_program: Program<'info, Metadata>,
    /// Program to create mint account and mint tokens
    pub token_program_2022: Program<'info, Token2022>,
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
    ctx: Context<'a, 'b, 'c, 'info, OpenRaydiumPosition<'info>>,
    tick_lower_index: i32,
    tick_upper_index: i32,
    tick_array_lower_start_index: i32,
    tick_array_upper_start_index: i32,
    liquidity: u128,
    amount_0_max: u64,
    amount_1_max: u64,
    with_matedata: bool,
    base_flag: Option<bool>,
) -> Result<()> {
    if ctx.accounts.config.admin != ctx.accounts.signer.key() {
        return Err(ErrorCode::InvalidAdmin.into());
    }

    let cpi_accounts = cpi::accounts::OpenPositionV2 {
        payer: ctx.accounts.payer.to_account_info(),
        position_nft_owner: ctx.accounts.position_nft_owner.to_account_info(),
        position_nft_mint: ctx.accounts.position_nft_mint.to_account_info(),
        position_nft_account: ctx.accounts.position_nft_account.to_account_info(),
        metadata_account: ctx.accounts.metadata_account.to_account_info(),
        pool_state: ctx.accounts.pool_state.to_account_info(),
        protocol_position: ctx.accounts.protocol_position.to_account_info(),
        tick_array_lower: ctx.accounts.tick_array_lower.to_account_info(),
        tick_array_upper: ctx.accounts.tick_array_upper.to_account_info(),
        personal_position: ctx.accounts.personal_position.to_account_info(),
        token_account_0: ctx.accounts.token_account_0.to_account_info(),
        token_account_1: ctx.accounts.token_account_1.to_account_info(),
        token_vault_0: ctx.accounts.token_vault_0.to_account_info(),
        token_vault_1: ctx.accounts.token_vault_1.to_account_info(),
        rent: ctx.accounts.rent.to_account_info(),
        system_program: ctx.accounts.system_program.to_account_info(),
        token_program: ctx.accounts.token_program.to_account_info(),
        associated_token_program: ctx.accounts.associated_token_program.to_account_info(),
        metadata_program: ctx.accounts.metadata_program.to_account_info(),
        token_program_2022: ctx.accounts.token_program_2022.to_account_info(),
        vault_0_mint: ctx.accounts.vault_0_mint.to_account_info(),
        vault_1_mint: ctx.accounts.vault_1_mint.to_account_info(),
    };
    let cpi_context = CpiContext::new(ctx.accounts.clmm_program.to_account_info(), cpi_accounts)
        .with_remaining_accounts(ctx.remaining_accounts.to_vec());
    cpi::open_position_v2(
        cpi_context,
        tick_lower_index,
        tick_upper_index,
        tick_array_lower_start_index,
        tick_array_upper_start_index,
        liquidity,
        amount_0_max,
        amount_1_max,
        with_matedata,
        base_flag,
    )?;

    let protocol_position = {
        let info = ctx.accounts.protocol_position.to_account_info();
        let mut buf = info.data.borrow_mut();
        ProtocolPositionState::deserialize(&mut &buf[..])?
    };

    // init protocol position
    ctx.accounts.raydium_protocol_position.config = ctx.accounts.config.key();
    ctx.accounts.raydium_protocol_position.raydium_pool = ctx.accounts.pool_state.key();
    ctx.accounts.raydium_protocol_position.raydium_position_nft =
        ctx.accounts.position_nft_mint.key();
    ctx.accounts.raydium_protocol_position.total_shares = liquidity;
    ctx.accounts.raydium_protocol_position.fee_growth_inside_0_last_x64 =
        protocol_position.fee_growth_inside_0_last_x64;
    ctx.accounts.raydium_protocol_position.fee_growth_inside_1_last_x64 =
        protocol_position.fee_growth_inside_1_last_x64;

    // init user position
    ctx.accounts.raydium_user_position.bump = ctx.bumps.raydium_user_position;
    ctx.accounts.raydium_user_position.shares = liquidity;
    ctx.accounts.raydium_user_position.owner = ctx.accounts.signer.key();
    ctx.accounts.raydium_user_position.raydium_protocol_position =
        ctx.accounts.raydium_protocol_position.key();
    ctx.accounts.raydium_user_position.fee_growth_inside_0_last_x64 =
        protocol_position.fee_growth_inside_0_last_x64;
    ctx.accounts.raydium_user_position.fee_growth_inside_1_last_x64 =
        protocol_position.fee_growth_inside_1_last_x64;

    Ok(())
}
