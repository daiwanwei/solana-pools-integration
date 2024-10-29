use anchor_lang::prelude::*;

#[account]
pub struct AccountPlaceholder {}

#[derive(Accounts)]
pub struct InitializePosition<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,

    #[account(mut)]
    pub position: Signer<'info>,

    pub lb_pair: Account<'info, AccountPlaceholder>,

    pub owner: Signer<'info>,

    pub system_program: Account<'info, AccountPlaceholder>,
    pub rent: Account<'info, AccountPlaceholder>,
}

pub struct CompositeDepositInfo {
    pub liquidity_share: u128,
    pub protocol_token_x_fee_amount: u64,
    pub protocol_token_y_fee_amount: u64,
}

#[derive(AnchorSerialize, AnchorDeserialize, Eq, PartialEq, Clone, Debug)]
pub struct BinLiquidityDistribution {
    /// Define the bin ID wish to deposit to.
    pub bin_id: i32,
    /// DistributionX (or distributionY) is the percentages of amountX (or amountY) you want to add to each bin.
    pub distribution_x: u16,
    /// DistributionX (or distributionY) is the percentages of amountX (or amountY) you want to add to each bin.
    pub distribution_y: u16,
}

#[derive(AnchorSerialize, AnchorDeserialize, Eq, PartialEq, Clone, Debug)]
pub struct LiquidityParameter {
    /// Amount of X token to deposit
    pub amount_x: u64,
    /// Amount of Y token to deposit
    pub amount_y: u64,
    /// Liquidity distribution to each bins
    pub bin_liquidity_dist: Vec<BinLiquidityDistribution>,
}

#[derive(Accounts)]
pub struct ModifyLiquidity<'info> {
    #[account(mut)]
    pub position: Account<'info, AccountPlaceholder>,

    #[account(mut)]
    pub lb_pair: Account<'info, AccountPlaceholder>,

    #[account(mut)]
    pub bin_array_bitmap_extension: Option<Account<'info, AccountPlaceholder>>,

    #[account(mut)]
    pub user_token_x: Account<'info, AccountPlaceholder>,
    #[account(mut)]
    pub user_token_y: Account<'info, AccountPlaceholder>,

    #[account(mut)]
    pub reserve_x: Account<'info, AccountPlaceholder>,
    #[account(mut)]
    pub reserve_y: Account<'info, AccountPlaceholder>,

    pub token_x_mint: Account<'info, AccountPlaceholder>,
    pub token_y_mint: Account<'info, AccountPlaceholder>,

    #[account(mut)]
    pub bin_array_lower: Account<'info, AccountPlaceholder>,
    #[account(mut)]
    pub bin_array_upper: Account<'info, AccountPlaceholder>,

    pub sender: Signer<'info>,
    pub token_x_program: Account<'info, AccountPlaceholder>,
    pub token_y_program: Account<'info, AccountPlaceholder>,
}
