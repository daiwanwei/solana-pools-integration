use anchor_lang::prelude::*;
use anchor_spl::{token, token_2022, token_interface::Mint};

use crate::state::protocol_position::RaydiumProtocolPosition;

pub fn transfer_from_user_to_position_vault<'info>(
    signer: Signer<'info>,
    from: &AccountInfo<'info>,
    to_vault: &AccountInfo<'info>,
    mint: Option<Box<InterfaceAccount<'info, Mint>>>,
    token_program: &AccountInfo<'info>,
    token_program_2022: Option<AccountInfo<'info>>,
    amount: u64,
) -> Result<()> {
    if amount == 0 {
        return Ok(());
    }

    let mut token_program_info = token_program.to_account_info();
    let from_info = from.to_account_info();

    match (mint, token_program_2022) {
        (Some(mint), Some(token_program_2022)) => {
            if from_info.owner == token_program_2022.key {
                token_program_info = token_program_2022.to_account_info();
            }
            token_2022::transfer_checked(
                CpiContext::new(
                    token_program_info,
                    token_2022::TransferChecked {
                        from: from_info,
                        mint: mint.to_account_info(),
                        to: to_vault.to_account_info(),
                        authority: signer.to_account_info(),
                    },
                ),
                amount,
                mint.decimals,
            )
        }
        _ => token::transfer(
            CpiContext::new(
                token_program_info,
                token::Transfer {
                    from: from_info,
                    to: to_vault.to_account_info(),
                    authority: signer.to_account_info(),
                },
            ),
            amount,
        ),
    }
}

pub fn transfer_from_position_vault_to_user<'info>(
    protocol_position: Box<Account<'info, RaydiumProtocolPosition>>,
    from_vault: &AccountInfo<'info>,
    to: &AccountInfo<'info>,
    mint: Option<Box<InterfaceAccount<'info, Mint>>>,
    token_program: &AccountInfo<'info>,
    token_program_2022: Option<AccountInfo<'info>>,
    amount: u64,
) -> Result<()> {
    if amount == 0 {
        return Ok(());
    }

    let mut token_program_info = token_program.to_account_info();
    let from_vault_info = from_vault.to_account_info();

    let signer_seed = &[
        b"raydium_protocol_position",
        protocol_position.raydium_pool.as_ref(),
        &protocol_position.tick_lower_index.to_le_bytes(),
        &protocol_position.tick_upper_index.to_le_bytes(),
        &[protocol_position.bump],
    ];

    match (mint, token_program_2022) {
        (Some(mint), Some(token_program_2022)) => {
            if from_vault_info.owner == token_program_2022.key {
                token_program_info = token_program_2022.to_account_info();
            }
            token_2022::transfer_checked(
                CpiContext::new_with_signer(
                    token_program_info,
                    token_2022::TransferChecked {
                        from: from_vault_info,
                        mint: mint.to_account_info(),
                        to: to.to_account_info(),
                        authority: protocol_position.to_account_info(),
                    },
                    &[signer_seed],
                ),
                amount,
                mint.decimals,
            )
        }
        _ => token::transfer(
            CpiContext::new_with_signer(
                token_program_info,
                token::Transfer {
                    from: from_vault_info,
                    to: to.to_account_info(),
                    authority: protocol_position.to_account_info(),
                },
                &[signer_seed],
            ),
            amount,
        ),
    }
}
