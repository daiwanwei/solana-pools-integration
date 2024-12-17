/**
 * This code was AUTOGENERATED using the codama library.
 * Please DO NOT EDIT THIS FILE, instead use visitors
 * to add features, then rerun codama to update it.
 *
 * @see https://github.com/codama-idl/codama
 */

import {
  isProgramError,
  type Address,
  type SOLANA_ERROR__INSTRUCTION_ERROR__CUSTOM,
  type SolanaError,
} from '@solana/web3.js';
import { LIQUIDITY_PROXY_PROGRAM_ADDRESS } from '../programs';

/** CustomError: Custom error message */
export const LIQUIDITY_PROXY_ERROR__CUSTOM_ERROR = 0x1770; // 6000
/** InvalidAdmin: Invalid admin */
export const LIQUIDITY_PROXY_ERROR__INVALID_ADMIN = 0x1771; // 6001
/** InvalidUser: Invalid user */
export const LIQUIDITY_PROXY_ERROR__INVALID_USER = 0x1772; // 6002
/** Overflow: Overflow */
export const LIQUIDITY_PROXY_ERROR__OVERFLOW = 0x1773; // 6003
/** InsufficientLiquidity: Insufficient liquidity */
export const LIQUIDITY_PROXY_ERROR__INSUFFICIENT_LIQUIDITY = 0x1774; // 6004
/** InvalidLiquidity: Invalid liquidity */
export const LIQUIDITY_PROXY_ERROR__INVALID_LIQUIDITY = 0x1775; // 6005
/** ProtocolPositionNotEmpty: Protocol position not empty */
export const LIQUIDITY_PROXY_ERROR__PROTOCOL_POSITION_NOT_EMPTY = 0x1776; // 6006

export type LiquidityProxyError =
  | typeof LIQUIDITY_PROXY_ERROR__CUSTOM_ERROR
  | typeof LIQUIDITY_PROXY_ERROR__INSUFFICIENT_LIQUIDITY
  | typeof LIQUIDITY_PROXY_ERROR__INVALID_ADMIN
  | typeof LIQUIDITY_PROXY_ERROR__INVALID_LIQUIDITY
  | typeof LIQUIDITY_PROXY_ERROR__INVALID_USER
  | typeof LIQUIDITY_PROXY_ERROR__OVERFLOW
  | typeof LIQUIDITY_PROXY_ERROR__PROTOCOL_POSITION_NOT_EMPTY;

let liquidityProxyErrorMessages:
  | Record<LiquidityProxyError, string>
  | undefined;
if (process.env.NODE_ENV !== 'production') {
  liquidityProxyErrorMessages = {
    [LIQUIDITY_PROXY_ERROR__CUSTOM_ERROR]: `Custom error message`,
    [LIQUIDITY_PROXY_ERROR__INSUFFICIENT_LIQUIDITY]: `Insufficient liquidity`,
    [LIQUIDITY_PROXY_ERROR__INVALID_ADMIN]: `Invalid admin`,
    [LIQUIDITY_PROXY_ERROR__INVALID_LIQUIDITY]: `Invalid liquidity`,
    [LIQUIDITY_PROXY_ERROR__INVALID_USER]: `Invalid user`,
    [LIQUIDITY_PROXY_ERROR__OVERFLOW]: `Overflow`,
    [LIQUIDITY_PROXY_ERROR__PROTOCOL_POSITION_NOT_EMPTY]: `Protocol position not empty`,
  };
}

export function getLiquidityProxyErrorMessage(
  code: LiquidityProxyError
): string {
  if (process.env.NODE_ENV !== 'production') {
    return (liquidityProxyErrorMessages as Record<LiquidityProxyError, string>)[
      code
    ];
  }

  return 'Error message not available in production bundles.';
}

export function isLiquidityProxyError<
  TProgramErrorCode extends LiquidityProxyError,
>(
  error: unknown,
  transactionMessage: {
    instructions: Record<number, { programAddress: Address }>;
  },
  code?: TProgramErrorCode
): error is SolanaError<typeof SOLANA_ERROR__INSTRUCTION_ERROR__CUSTOM> &
  Readonly<{ context: Readonly<{ code: TProgramErrorCode }> }> {
  return isProgramError<TProgramErrorCode>(
    error,
    transactionMessage,
    LIQUIDITY_PROXY_PROGRAM_ADDRESS,
    code
  );
}