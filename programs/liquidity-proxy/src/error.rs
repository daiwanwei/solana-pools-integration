use anchor_lang::prelude::*;

#[error_code]
pub enum ErrorCode {
    #[msg("Custom error message")]
    CustomError,

    #[msg("Invalid admin")]
    InvalidAdmin,

    #[msg("Invalid user")]
    InvalidUser,

    #[msg("Overflow")]
    Overflow,
}
