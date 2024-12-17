/**
 * This code was AUTOGENERATED using the codama library.
 * Please DO NOT EDIT THIS FILE, instead use visitors
 * to add features, then rerun codama to update it.
 *
 * @see https://github.com/codama-idl/codama
 */

import {
  combineCodec,
  getStructDecoder,
  getStructEncoder,
  getU128Decoder,
  getU128Encoder,
  getU64Decoder,
  getU64Encoder,
  type Codec,
  type Decoder,
  type Encoder,
} from '@solana/web3.js';

export type PositionRewardInfo = {
  growthInsideLastX64: bigint;
  rewardAmountOwed: bigint;
};

export type PositionRewardInfoArgs = {
  growthInsideLastX64: number | bigint;
  rewardAmountOwed: number | bigint;
};

export function getPositionRewardInfoEncoder(): Encoder<PositionRewardInfoArgs> {
  return getStructEncoder([
    ['growthInsideLastX64', getU128Encoder()],
    ['rewardAmountOwed', getU64Encoder()],
  ]);
}

export function getPositionRewardInfoDecoder(): Decoder<PositionRewardInfo> {
  return getStructDecoder([
    ['growthInsideLastX64', getU128Decoder()],
    ['rewardAmountOwed', getU64Decoder()],
  ]);
}

export function getPositionRewardInfoCodec(): Codec<
  PositionRewardInfoArgs,
  PositionRewardInfo
> {
  return combineCodec(
    getPositionRewardInfoEncoder(),
    getPositionRewardInfoDecoder()
  );
}