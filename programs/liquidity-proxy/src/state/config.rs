use anchor_lang::prelude::*;

#[account]
#[derive(Debug, Default, InitSpace)]
pub struct Config {
    pub bump: u8,
    pub index: u16,
    pub admin: Pubkey,
}
