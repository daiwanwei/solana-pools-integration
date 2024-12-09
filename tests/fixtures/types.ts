import BN from "bn.js";
import { Decimal } from "decimal.js";
import { PublicKey, Keypair } from "@solana/web3.js";
import { PDA } from "@orca-so/common-sdk";

export type InitParams = {
  orca: InitOrcaParams;
  raydium: InitRaydiumParams;
  meteora: InitMeteoraParams;
};

export type InitOrcaParams = {
  sqrtPrice: BN;
  tickSpacing: number;
  tickStartIndex: number;
  tickArrayCount: number;
};

export type InitRaydiumParams = {
  sqrtPrice: Decimal;
  tickSpacing: number;
  LowerPrice: Decimal;
  UpperPrice: Decimal;
};

export type InitMeteoraParams = {
  binStep: BN;
  baseFactor: BN;
  amount: BN;
};

export type OrcaPoolInfo = {
  whirlpoolPda: PDA;
  tickSpacing: number;
} & PoolTokensInfo;

export type RaydiumPoolInfo = {
  clmmPool: PublicKey;
  tickSpacing: number;
} & PoolTokensInfo;

export type MeteoraPoolInfo = {
  dlmmPool: PublicKey;
  binStep: BN;
  baseFactor: BN;
} & PoolTokensInfo;

export type PoolTokensInfo = {
  tokenAMint: PublicKey;
  tokenBMint: PublicKey;
  tokenAVault: PublicKey;
  tokenBVault: PublicKey;
};

export type UserInfo = {
  wallet: Keypair;
  tokenAAccount: PublicKey;
  tokenBAccount: PublicKey;
};

export type TokenInfo = {
  mint: PublicKey;
  decimals: number;
};
