/**
 * This code was AUTOGENERATED using the codama library.
 * Please DO NOT EDIT THIS FILE, instead use visitors
 * to add features, then rerun codama to update it.
 *
 * @see https://github.com/codama-idl/codama
 */

import {
  assertAccountExists,
  assertAccountsExist,
  combineCodec,
  decodeAccount,
  fetchEncodedAccount,
  fetchEncodedAccounts,
  fixDecoderSize,
  fixEncoderSize,
  getAddressDecoder,
  getAddressEncoder,
  getArrayDecoder,
  getArrayEncoder,
  getBytesDecoder,
  getBytesEncoder,
  getI32Decoder,
  getI32Encoder,
  getStructDecoder,
  getStructEncoder,
  getU128Decoder,
  getU128Encoder,
  getU16Decoder,
  getU16Encoder,
  getU64Decoder,
  getU64Encoder,
  getU8Decoder,
  getU8Encoder,
  transformEncoder,
  type Account,
  type Address,
  type Codec,
  type Decoder,
  type EncodedAccount,
  type Encoder,
  type FetchAccountConfig,
  type FetchAccountsConfig,
  type MaybeAccount,
  type MaybeEncodedAccount,
  type ReadonlyUint8Array,
} from '@solana/web3.js';
import {
  getRewardInfoDecoder,
  getRewardInfoEncoder,
  type RewardInfo,
  type RewardInfoArgs,
} from '../types';

export const POOL_STATE_DISCRIMINATOR = new Uint8Array([
  247, 237, 227, 245, 215, 195, 222, 70,
]);

export function getPoolStateDiscriminatorBytes() {
  return fixEncoderSize(getBytesEncoder(), 8).encode(POOL_STATE_DISCRIMINATOR);
}

export type PoolState = {
  discriminator: ReadonlyUint8Array;
  /** Bump to identify PDA */
  bump: Array<number>;
  ammConfig: Address;
  owner: Address;
  /** Token pair of the pool, where token_mint_0 address < token_mint_1 address */
  tokenMint0: Address;
  tokenMint1: Address;
  /** Token pair vault */
  tokenVault0: Address;
  tokenVault1: Address;
  /** observation account key */
  observationKey: Address;
  /** mint0 and mint1 decimals */
  mintDecimals0: number;
  mintDecimals1: number;
  /** The minimum number of ticks between initialized ticks */
  tickSpacing: number;
  /** The currently in range liquidity available to the pool. */
  liquidity: bigint;
  /** The current price of the pool as a sqrt(token_1/token_0) Q64.64 value */
  sqrtPriceX64: bigint;
  /** The current tick of the pool, i.e. according to the last tick transition that was run. */
  tickCurrent: number;
  padding3: number;
  padding4: number;
  /**
   * The fee growth as a Q64.64 number, i.e. fees of token_0 and token_1 collected per
   * unit of liquidity for the entire life of the pool.
   */
  feeGrowthGlobal0X64: bigint;
  feeGrowthGlobal1X64: bigint;
  /** The amounts of token_0 and token_1 that are owed to the protocol. */
  protocolFeesToken0: bigint;
  protocolFeesToken1: bigint;
  /** The amounts in and out of swap token_0 and token_1 */
  swapInAmountToken0: bigint;
  swapOutAmountToken1: bigint;
  swapInAmountToken1: bigint;
  swapOutAmountToken0: bigint;
  /**
   * Bitwise representation of the state of the pool
   * bit0, 1: disable open position and increase liquidity, 0: normal
   * bit1, 1: disable decrease liquidity, 0: normal
   * bit2, 1: disable collect fee, 0: normal
   * bit3, 1: disable collect reward, 0: normal
   * bit4, 1: disable swap, 0: normal
   */
  status: number;
  /** Leave blank for future use */
  padding: Array<number>;
  rewardInfos: Array<RewardInfo>;
  /** Packed initialized tick array state */
  tickArrayBitmap: Array<bigint>;
  /** except protocol_fee and fund_fee */
  totalFeesToken0: bigint;
  /** except protocol_fee and fund_fee */
  totalFeesClaimedToken0: bigint;
  totalFeesToken1: bigint;
  totalFeesClaimedToken1: bigint;
  fundFeesToken0: bigint;
  fundFeesToken1: bigint;
  openTime: bigint;
  recentEpoch: bigint;
  padding1: Array<bigint>;
  padding2: Array<bigint>;
};

export type PoolStateArgs = {
  /** Bump to identify PDA */
  bump: Array<number>;
  ammConfig: Address;
  owner: Address;
  /** Token pair of the pool, where token_mint_0 address < token_mint_1 address */
  tokenMint0: Address;
  tokenMint1: Address;
  /** Token pair vault */
  tokenVault0: Address;
  tokenVault1: Address;
  /** observation account key */
  observationKey: Address;
  /** mint0 and mint1 decimals */
  mintDecimals0: number;
  mintDecimals1: number;
  /** The minimum number of ticks between initialized ticks */
  tickSpacing: number;
  /** The currently in range liquidity available to the pool. */
  liquidity: number | bigint;
  /** The current price of the pool as a sqrt(token_1/token_0) Q64.64 value */
  sqrtPriceX64: number | bigint;
  /** The current tick of the pool, i.e. according to the last tick transition that was run. */
  tickCurrent: number;
  padding3: number;
  padding4: number;
  /**
   * The fee growth as a Q64.64 number, i.e. fees of token_0 and token_1 collected per
   * unit of liquidity for the entire life of the pool.
   */
  feeGrowthGlobal0X64: number | bigint;
  feeGrowthGlobal1X64: number | bigint;
  /** The amounts of token_0 and token_1 that are owed to the protocol. */
  protocolFeesToken0: number | bigint;
  protocolFeesToken1: number | bigint;
  /** The amounts in and out of swap token_0 and token_1 */
  swapInAmountToken0: number | bigint;
  swapOutAmountToken1: number | bigint;
  swapInAmountToken1: number | bigint;
  swapOutAmountToken0: number | bigint;
  /**
   * Bitwise representation of the state of the pool
   * bit0, 1: disable open position and increase liquidity, 0: normal
   * bit1, 1: disable decrease liquidity, 0: normal
   * bit2, 1: disable collect fee, 0: normal
   * bit3, 1: disable collect reward, 0: normal
   * bit4, 1: disable swap, 0: normal
   */
  status: number;
  /** Leave blank for future use */
  padding: Array<number>;
  rewardInfos: Array<RewardInfoArgs>;
  /** Packed initialized tick array state */
  tickArrayBitmap: Array<number | bigint>;
  /** except protocol_fee and fund_fee */
  totalFeesToken0: number | bigint;
  /** except protocol_fee and fund_fee */
  totalFeesClaimedToken0: number | bigint;
  totalFeesToken1: number | bigint;
  totalFeesClaimedToken1: number | bigint;
  fundFeesToken0: number | bigint;
  fundFeesToken1: number | bigint;
  openTime: number | bigint;
  recentEpoch: number | bigint;
  padding1: Array<number | bigint>;
  padding2: Array<number | bigint>;
};

export function getPoolStateEncoder(): Encoder<PoolStateArgs> {
  return transformEncoder(
    getStructEncoder([
      ['discriminator', fixEncoderSize(getBytesEncoder(), 8)],
      ['bump', getArrayEncoder(getU8Encoder(), { size: 1 })],
      ['ammConfig', getAddressEncoder()],
      ['owner', getAddressEncoder()],
      ['tokenMint0', getAddressEncoder()],
      ['tokenMint1', getAddressEncoder()],
      ['tokenVault0', getAddressEncoder()],
      ['tokenVault1', getAddressEncoder()],
      ['observationKey', getAddressEncoder()],
      ['mintDecimals0', getU8Encoder()],
      ['mintDecimals1', getU8Encoder()],
      ['tickSpacing', getU16Encoder()],
      ['liquidity', getU128Encoder()],
      ['sqrtPriceX64', getU128Encoder()],
      ['tickCurrent', getI32Encoder()],
      ['padding3', getU16Encoder()],
      ['padding4', getU16Encoder()],
      ['feeGrowthGlobal0X64', getU128Encoder()],
      ['feeGrowthGlobal1X64', getU128Encoder()],
      ['protocolFeesToken0', getU64Encoder()],
      ['protocolFeesToken1', getU64Encoder()],
      ['swapInAmountToken0', getU128Encoder()],
      ['swapOutAmountToken1', getU128Encoder()],
      ['swapInAmountToken1', getU128Encoder()],
      ['swapOutAmountToken0', getU128Encoder()],
      ['status', getU8Encoder()],
      ['padding', getArrayEncoder(getU8Encoder(), { size: 7 })],
      ['rewardInfos', getArrayEncoder(getRewardInfoEncoder(), { size: 3 })],
      ['tickArrayBitmap', getArrayEncoder(getU64Encoder(), { size: 16 })],
      ['totalFeesToken0', getU64Encoder()],
      ['totalFeesClaimedToken0', getU64Encoder()],
      ['totalFeesToken1', getU64Encoder()],
      ['totalFeesClaimedToken1', getU64Encoder()],
      ['fundFeesToken0', getU64Encoder()],
      ['fundFeesToken1', getU64Encoder()],
      ['openTime', getU64Encoder()],
      ['recentEpoch', getU64Encoder()],
      ['padding1', getArrayEncoder(getU64Encoder(), { size: 24 })],
      ['padding2', getArrayEncoder(getU64Encoder(), { size: 32 })],
    ]),
    (value) => ({ ...value, discriminator: POOL_STATE_DISCRIMINATOR })
  );
}

export function getPoolStateDecoder(): Decoder<PoolState> {
  return getStructDecoder([
    ['discriminator', fixDecoderSize(getBytesDecoder(), 8)],
    ['bump', getArrayDecoder(getU8Decoder(), { size: 1 })],
    ['ammConfig', getAddressDecoder()],
    ['owner', getAddressDecoder()],
    ['tokenMint0', getAddressDecoder()],
    ['tokenMint1', getAddressDecoder()],
    ['tokenVault0', getAddressDecoder()],
    ['tokenVault1', getAddressDecoder()],
    ['observationKey', getAddressDecoder()],
    ['mintDecimals0', getU8Decoder()],
    ['mintDecimals1', getU8Decoder()],
    ['tickSpacing', getU16Decoder()],
    ['liquidity', getU128Decoder()],
    ['sqrtPriceX64', getU128Decoder()],
    ['tickCurrent', getI32Decoder()],
    ['padding3', getU16Decoder()],
    ['padding4', getU16Decoder()],
    ['feeGrowthGlobal0X64', getU128Decoder()],
    ['feeGrowthGlobal1X64', getU128Decoder()],
    ['protocolFeesToken0', getU64Decoder()],
    ['protocolFeesToken1', getU64Decoder()],
    ['swapInAmountToken0', getU128Decoder()],
    ['swapOutAmountToken1', getU128Decoder()],
    ['swapInAmountToken1', getU128Decoder()],
    ['swapOutAmountToken0', getU128Decoder()],
    ['status', getU8Decoder()],
    ['padding', getArrayDecoder(getU8Decoder(), { size: 7 })],
    ['rewardInfos', getArrayDecoder(getRewardInfoDecoder(), { size: 3 })],
    ['tickArrayBitmap', getArrayDecoder(getU64Decoder(), { size: 16 })],
    ['totalFeesToken0', getU64Decoder()],
    ['totalFeesClaimedToken0', getU64Decoder()],
    ['totalFeesToken1', getU64Decoder()],
    ['totalFeesClaimedToken1', getU64Decoder()],
    ['fundFeesToken0', getU64Decoder()],
    ['fundFeesToken1', getU64Decoder()],
    ['openTime', getU64Decoder()],
    ['recentEpoch', getU64Decoder()],
    ['padding1', getArrayDecoder(getU64Decoder(), { size: 24 })],
    ['padding2', getArrayDecoder(getU64Decoder(), { size: 32 })],
  ]);
}

export function getPoolStateCodec(): Codec<PoolStateArgs, PoolState> {
  return combineCodec(getPoolStateEncoder(), getPoolStateDecoder());
}

export function decodePoolState<TAddress extends string = string>(
  encodedAccount: EncodedAccount<TAddress>
): Account<PoolState, TAddress>;
export function decodePoolState<TAddress extends string = string>(
  encodedAccount: MaybeEncodedAccount<TAddress>
): MaybeAccount<PoolState, TAddress>;
export function decodePoolState<TAddress extends string = string>(
  encodedAccount: EncodedAccount<TAddress> | MaybeEncodedAccount<TAddress>
): Account<PoolState, TAddress> | MaybeAccount<PoolState, TAddress> {
  return decodeAccount(
    encodedAccount as MaybeEncodedAccount<TAddress>,
    getPoolStateDecoder()
  );
}

export async function fetchPoolState<TAddress extends string = string>(
  rpc: Parameters<typeof fetchEncodedAccount>[0],
  address: Address<TAddress>,
  config?: FetchAccountConfig
): Promise<Account<PoolState, TAddress>> {
  const maybeAccount = await fetchMaybePoolState(rpc, address, config);
  assertAccountExists(maybeAccount);
  return maybeAccount;
}

export async function fetchMaybePoolState<TAddress extends string = string>(
  rpc: Parameters<typeof fetchEncodedAccount>[0],
  address: Address<TAddress>,
  config?: FetchAccountConfig
): Promise<MaybeAccount<PoolState, TAddress>> {
  const maybeAccount = await fetchEncodedAccount(rpc, address, config);
  return decodePoolState(maybeAccount);
}

export async function fetchAllPoolState(
  rpc: Parameters<typeof fetchEncodedAccounts>[0],
  addresses: Array<Address>,
  config?: FetchAccountsConfig
): Promise<Account<PoolState>[]> {
  const maybeAccounts = await fetchAllMaybePoolState(rpc, addresses, config);
  assertAccountsExist(maybeAccounts);
  return maybeAccounts;
}

export async function fetchAllMaybePoolState(
  rpc: Parameters<typeof fetchEncodedAccounts>[0],
  addresses: Array<Address>,
  config?: FetchAccountsConfig
): Promise<MaybeAccount<PoolState>[]> {
  const maybeAccounts = await fetchEncodedAccounts(rpc, addresses, config);
  return maybeAccounts.map((maybeAccount) => decodePoolState(maybeAccount));
}

export function getPoolStateSize(): number {
  return 1544;
}