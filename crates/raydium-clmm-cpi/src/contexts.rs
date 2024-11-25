use anchor_lang::prelude::*;

#[account]
pub struct AccountPlaceholder {}

#[derive(Accounts)]
pub struct OpenPosition<'info> {
    /// Pays to mint the position
    #[account(mut)]
    pub payer: Signer<'info>,

    /// CHECK: Receives the position NFT
    pub position_nft_owner: Account<'info, AccountPlaceholder>,

    /// Unique token mint address
    #[account(mut)]
    pub position_nft_mint: Signer<'info>,

    /// Token account where position NFT will be minted
    /// This account created in the contract by cpi to avoid large stack variables
    #[account(mut)]
    pub position_nft_account: Account<'info, AccountPlaceholder>,

    /// To store metaplex metadata
    /// CHECK: Safety check performed inside function body
    #[account(mut)]
    pub metadata_account: Account<'info, AccountPlaceholder>,

    /// Add liquidity for this pool
    #[account(mut)]
    pub pool_state: Account<'info, AccountPlaceholder>,

    /// Store the information of market marking in range
    #[account(mut)]
    pub protocol_position: Account<'info, AccountPlaceholder>,

    /// CHECK: Account to mark the lower tick as initialized
    #[account(mut)]
    pub tick_array_lower: Account<'info, AccountPlaceholder>,

    /// CHECK:Account to store data for the position's upper tick
    #[account(mut)]
    pub tick_array_upper: Account<'info, AccountPlaceholder>,

    /// personal position state
    #[account(mut)]
    pub personal_position: Account<'info, AccountPlaceholder>,

    /// The token_0 account deposit token to the pool
    #[account(mut)]
    pub token_account_0: Account<'info, AccountPlaceholder>,

    /// The token_1 account deposit token to the pool
    #[account(mut)]
    pub token_account_1: Account<'info, AccountPlaceholder>,
    /// The address that holds pool tokens for token_0
    #[account(mut)]
    pub token_vault_0: Account<'info, AccountPlaceholder>,

    /// The address that holds pool tokens for token_1
    #[account(mut)]
    pub token_vault_1: Account<'info, AccountPlaceholder>,

    /// Sysvar for token mint and ATA creation
    pub rent: Account<'info, AccountPlaceholder>,

    /// Program to create the position manager state account
    pub system_program: Account<'info, AccountPlaceholder>,

    /// Program to create mint account and mint tokens
    pub token_program: Account<'info, AccountPlaceholder>,
    /// Program to create an ATA for receiving position NFT
    pub associated_token_program: Account<'info, AccountPlaceholder>,

    /// Program to create NFT metadata
    /// CHECK: Metadata program address constraint applied
    pub metadata_program: Account<'info, AccountPlaceholder>,
}

#[derive(Accounts)]
pub struct OpenPositionV2<'info> {
    /// Pays to mint the position
    #[account(mut)]
    pub payer: Signer<'info>,

    /// CHECK: Receives the position NFT
    pub position_nft_owner: Account<'info, AccountPlaceholder>,

    /// Unique token mint address
    #[account(mut)]
    pub position_nft_mint: Signer<'info>,

    /// Token account where position NFT will be minted
    /// This account created in the contract by cpi to avoid large stack variables
    #[account(mut)]
    pub position_nft_account: Account<'info, AccountPlaceholder>,

    /// To store metaplex metadata
    /// CHECK: Safety check performed inside function body
    #[account(mut)]
    pub metadata_account: Account<'info, AccountPlaceholder>,

    /// Add liquidity for this pool
    #[account(mut)]
    pub pool_state: Account<'info, AccountPlaceholder>,

    /// Store the information of market marking in range
    #[account(mut)]
    pub protocol_position: Account<'info, AccountPlaceholder>,

    /// CHECK: Account to mark the lower tick as initialized
    #[account(mut)]
    pub tick_array_lower: Account<'info, AccountPlaceholder>,

    /// CHECK:Account to store data for the position's upper tick
    #[account(mut)]
    pub tick_array_upper: Account<'info, AccountPlaceholder>,

    /// personal position state
    #[account(mut)]
    pub personal_position: Account<'info, AccountPlaceholder>,

    /// The token_0 account deposit token to the pool
    #[account(mut)]
    pub token_account_0: Account<'info, AccountPlaceholder>,

    /// The token_1 account deposit token to the pool
    #[account(mut)]
    pub token_account_1: Account<'info, AccountPlaceholder>,

    /// The address that holds pool tokens for token_0
    #[account(mut)]
    pub token_vault_0: Account<'info, AccountPlaceholder>,

    /// The address that holds pool tokens for token_1
    #[account(mut)]
    pub token_vault_1: Account<'info, AccountPlaceholder>,
    /// Sysvar for token mint and ATA creation
    pub rent: Sysvar<'info, Rent>,

    /// Program to create the position manager state account
    pub system_program: Account<'info, AccountPlaceholder>,

    /// Program to create mint account and mint tokens
    pub token_program: Account<'info, AccountPlaceholder>,
    /// Program to create an ATA for receiving position NFT
    pub associated_token_program: Account<'info, AccountPlaceholder>,

    /// Program to create NFT metadata
    /// CHECK: Metadata program address constraint applied
    pub metadata_program: Account<'info, AccountPlaceholder>,
    /// Program to create mint account and mint tokens
    pub token_program_2022: Account<'info, AccountPlaceholder>,
    /// The mint of token vault 0
    pub vault_0_mint: Account<'info, AccountPlaceholder>,
    /// The mint of token vault 1
    pub vault_1_mint: Account<'info, AccountPlaceholder>,
}

#[derive(Accounts)]
pub struct IncreaseLiquidity<'info> {
    /// Pays to mint the position
    pub nft_owner: Signer<'info>,

    /// The token account for nft
    pub nft_account: Account<'info, AccountPlaceholder>,

    #[account(mut)]
    pub pool_state: Account<'info, AccountPlaceholder>,

    #[account(mut)]
    pub protocol_position: Account<'info, AccountPlaceholder>,

    /// Increase liquidity for this position
    #[account(mut)]
    pub personal_position: Account<'info, AccountPlaceholder>,

    /// Stores init state for the lower tick
    #[account(mut)]
    pub tick_array_lower: Account<'info, AccountPlaceholder>,

    /// Stores init state for the upper tick
    #[account(mut)]
    pub tick_array_upper: Account<'info, AccountPlaceholder>,
    /// The payer's token account for token_0
    #[account(mut)]
    pub token_account_0: Account<'info, AccountPlaceholder>,

    /// The token account spending token_1 to mint the position
    #[account(mut)]
    pub token_account_1: Account<'info, AccountPlaceholder>,

    /// The address that holds pool tokens for token_0
    #[account(mut)]
    pub token_vault_0: Account<'info, AccountPlaceholder>,

    /// The address that holds pool tokens for token_1
    #[account(mut)]
    pub token_vault_1: Account<'info, AccountPlaceholder>,

    /// Program to create mint account and mint tokens
    pub token_program: Account<'info, AccountPlaceholder>,
}

#[derive(Accounts)]
pub struct IncreaseLiquidityV2<'info> {
    /// Pays to mint the position
    pub nft_owner: Signer<'info>,

    /// The token account for nft
    pub nft_account: Account<'info, AccountPlaceholder>,

    #[account(mut)]
    pub pool_state: Account<'info, AccountPlaceholder>,

    #[account(mut)]
    pub protocol_position: Account<'info, AccountPlaceholder>,

    /// Increase liquidity for this position
    #[account(mut)]
    pub personal_position: Account<'info, AccountPlaceholder>,

    /// Stores init state for the lower tick
    #[account(mut)]
    pub tick_array_lower: Account<'info, AccountPlaceholder>,

    /// Stores init state for the upper tick
    #[account(mut)]
    pub tick_array_upper: Account<'info, AccountPlaceholder>,

    /// The payer's token account for token_0
    #[account(mut)]
    pub token_account_0: Account<'info, AccountPlaceholder>,

    /// The token account spending token_1 to mint the position
    #[account(mut)]
    pub token_account_1: Account<'info, AccountPlaceholder>,

    /// The address that holds pool tokens for token_0
    #[account(mut)]
    pub token_vault_0: Account<'info, AccountPlaceholder>,

    /// The address that holds pool tokens for token_1
    #[account(mut)]
    pub token_vault_1: Account<'info, AccountPlaceholder>,

    /// Program to create mint account and mint tokens
    pub token_program: Account<'info, AccountPlaceholder>,

    /// Token program 2022
    pub token_program_2022: Account<'info, AccountPlaceholder>,

    /// The mint of token vault 0
    pub vault_0_mint: Account<'info, AccountPlaceholder>,

    /// The mint of token vault 1
    pub vault_1_mint: Account<'info, AccountPlaceholder>,
}

#[derive(Accounts)]
pub struct DecreaseLiquidityV2<'info> {
    /// Pays to mint the position
    pub nft_owner: Signer<'info>,

    /// The token account for nft
    pub nft_account: Account<'info, AccountPlaceholder>,

    /// Increase liquidity for this position
    #[account(mut)]
    pub personal_position: Account<'info, AccountPlaceholder>,

    #[account(mut)]
    pub pool_state: Account<'info, AccountPlaceholder>,

    #[account(mut)]
    pub protocol_position: Account<'info, AccountPlaceholder>,

    /// The address that holds pool tokens for token_0
    #[account(mut)]
    pub token_vault_0: Account<'info, AccountPlaceholder>,

    /// The address that holds pool tokens for token_1
    #[account(mut)]
    pub token_vault_1: Account<'info, AccountPlaceholder>,

    /// Stores init state for the lower tick
    #[account(mut)]
    pub tick_array_lower: Account<'info, AccountPlaceholder>,

    /// Stores init state for the upper tick
    #[account(mut)]
    pub tick_array_upper: Account<'info, AccountPlaceholder>,

    /// The destination token account for receive amount_0
    #[account(mut)]
    pub recipient_token_account_0: Account<'info, AccountPlaceholder>,

    /// The destination token account for receive amount_1
    #[account(mut)]
    pub recipient_token_account_1: Account<'info, AccountPlaceholder>,

    /// Program to create mint account and mint tokens
    pub token_program: Account<'info, AccountPlaceholder>,

    /// Token program 2022
    pub token_program_2022: Account<'info, AccountPlaceholder>,

    /// memo program
    pub memo_program: Account<'info, AccountPlaceholder>,

    /// The mint of token vault 0
    pub vault_0_mint: Account<'info, AccountPlaceholder>,

    /// The mint of token vault 1
    pub vault_1_mint: Account<'info, AccountPlaceholder>,
}
