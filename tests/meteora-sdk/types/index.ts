import { BN, IdlAccounts, IdlTypes, Program, ProgramAccount } from "@coral-xyz/anchor";
import { MeteoraDlmm } from "../idls/meteora_dlmm";
import { PublicKey, TransactionInstruction } from "@solana/web3.js";
import Decimal from "decimal.js";
import { u64, i64, struct } from "@coral-xyz/borsh";

export interface FeeInfo {
  baseFeeRatePercentage: Decimal;
  maxFeeRatePercentage: Decimal;
  protocolFeePercentage: Decimal;
}

export interface BinAndAmount {
  binId: number;
  xAmountBpsOfTotal: BN;
  yAmountBpsOfTotal: BN;
}

export interface TokenReserve {
  publicKey: PublicKey;
  reserve: PublicKey;
  amount: bigint;
  decimal: number;
}

export type ClmmProgram = Program<MeteoraDlmm>;

export type LbPair = IdlAccounts<MeteoraDlmm>["lbPair"];
export type LbPairAccount = ProgramAccount<IdlAccounts<MeteoraDlmm>["lbPair"]>;

export type Bin = IdlTypes<MeteoraDlmm>["bin"];
export type BinArray = IdlAccounts<MeteoraDlmm>["binArray"];
export type BinArrayAccount = ProgramAccount<IdlAccounts<MeteoraDlmm>["binArray"]>;

export type Position = IdlAccounts<MeteoraDlmm>["position"];
export type PositionV2 = IdlAccounts<MeteoraDlmm>["positionV2"];

export type vParameters = IdlAccounts<MeteoraDlmm>["lbPair"]["vParameters"];
export type sParameters = IdlAccounts<MeteoraDlmm>["lbPair"]["parameters"];

export type InitPermissionPairIx = IdlTypes<MeteoraDlmm>["initPermissionPairIx"];

export type BinLiquidityDistribution = IdlTypes<MeteoraDlmm>["binLiquidityDistribution"];
export type BinLiquidityReduction = IdlTypes<MeteoraDlmm>["binLiquidityReduction"];

export type BinArrayBitmapExtensionAccount = ProgramAccount<
  IdlAccounts<MeteoraDlmm>["binArrayBitmapExtension"]
>;
export type BinArrayBitmapExtension = IdlAccounts<MeteoraDlmm>["binArrayBitmapExtension"];

export type LiquidityParameterByWeight = IdlTypes<MeteoraDlmm>["liquidityParameterByWeight"];
export type LiquidityOneSideParameter = IdlTypes<MeteoraDlmm>["liquidityOneSideParameter"];

export type LiquidityParameterByStrategy = IdlTypes<MeteoraDlmm>["liquidityParameterByStrategy"];
export type LiquidityParameterByStrategyOneSide =
  IdlTypes<MeteoraDlmm>["liquidityParameterByStrategyOneSide"];

export type ProgramStrategyParameter = IdlTypes<MeteoraDlmm>["strategyParameters"];
export type ProgramStrategyType = IdlTypes<MeteoraDlmm>["strategyType"];

export type CompressedBinDepositAmount = IdlTypes<MeteoraDlmm>["compressedBinDepositAmount"];
export type CompressedBinDepositAmounts = CompressedBinDepositAmount[];

export interface LbPosition {
  publicKey: PublicKey;
  positionData: PositionData;
  version: PositionVersion;
}

export interface PositionInfo {
  publicKey: PublicKey;
  lbPair: LbPair;
  tokenX: TokenReserve;
  tokenY: TokenReserve;
  lbPairPositionsData: Array<LbPosition>;
}

export interface FeeInfo {
  baseFeeRatePercentage: Decimal;
  maxFeeRatePercentage: Decimal;
  protocolFeePercentage: Decimal;
}

export interface EmissionRate {
  rewardOne: Decimal | undefined;
  rewardTwo: Decimal | undefined;
}

export interface SwapFee {
  feeX: BN;
  feeY: BN;
}

export interface LMRewards {
  rewardOne: BN;
  rewardTwo: BN;
}

export enum PositionVersion {
  V1,
  V2,
}

export enum PairType {
  Permissionless,
  Permissioned,
}

export const Strategy = {
  SpotOneSide: { spotOneSide: {} },
  CurveOneSide: { curveOneSide: {} },
  BidAskOneSide: { bidAskOneSide: {} },
  SpotBalanced: { spotBalanced: {} },
  CurveBalanced: { curveBalanced: {} },
  BidAskBalanced: { bidAskBalanced: {} },
  SpotImBalanced: { spotImBalanced: {} },
  CurveImBalanced: { curveImBalanced: {} },
  BidAskImBalanced: { bidAskImBalanced: {} },
};

export enum StrategyType {
  SpotOneSide,
  CurveOneSide,
  BidAskOneSide,
  SpotImBalanced,
  CurveImBalanced,
  BidAskImBalanced,
  SpotBalanced,
  CurveBalanced,
  BidAskBalanced,
}

export enum ActivationType {
  Slot,
  Timestamp,
}

export interface StrategyParameters {
  maxBinId: number;
  minBinId: number;
  strategyType: StrategyType;
  singleSidedX?: boolean;
}

export interface TQuoteCreatePositionParams {
  strategy: StrategyParameters;
}

export interface TInitializePositionAndAddLiquidityParams {
  positionPubKey: PublicKey;
  totalXAmount: BN;
  totalYAmount: BN;
  xYAmountDistribution: BinAndAmount[];
  user: PublicKey;
  slippage?: number;
}

export interface TInitializePositionAndAddLiquidityParamsByStrategy {
  positionPubKey: PublicKey;
  totalXAmount: BN;
  totalYAmount: BN;
  strategy: StrategyParameters;
  user: PublicKey;
  slippage?: number;
}

export interface BinLiquidity {
  binId: number;
  xAmount: BN;
  yAmount: BN;
  supply: BN;
  version: number;
  price: string;
  pricePerToken: string;
}

export interface SwapQuote {
  consumedInAmount: BN;
  outAmount: BN;
  fee: BN;
  protocolFee: BN;
  minOutAmount: BN;
  priceImpact: Decimal;
  binArraysPubkey: any[];
  endPrice: Decimal;
}

export interface SwapQuoteExactOut {
  inAmount: BN;
  outAmount: BN;
  fee: BN;
  priceImpact: Decimal;
  protocolFee: BN;
  maxInAmount: BN;
  binArraysPubkey: any[];
}

export interface IAccountsCache {
  binArrays: Map<String, BinArray>;
  lbPair: LbPair;
}

export interface PositionBinData {
  binId: number;
  price: string;
  pricePerToken: string;
  binXAmount: string;
  binYAmount: string;
  binLiquidity: string;
  positionLiquidity: string;
  positionXAmount: string;
  positionYAmount: string;
}

export interface PositionData {
  totalXAmount: string;
  totalYAmount: string;
  positionBinData: PositionBinData[];
  lastUpdatedAt: BN;
  upperBinId: number;
  lowerBinId: number;
  feeX: BN;
  feeY: BN;
  rewardOne: BN;
  rewardTwo: BN;
  feeOwner: PublicKey;
  totalClaimedFeeXAmount: BN;
  totalClaimedFeeYAmount: BN;
}

export interface SwapWithPriceImpactParams {
  /**
   * mint of in token
   */
  inToken: PublicKey;
  /**
   * mint of out token
   */
  outToken: PublicKey;
  /**
   * in token amount
   */
  inAmount: BN;
  /**
   * price impact in bps
   */
  priceImpact: BN;
  /**
   * desired lbPair to swap against
   */
  lbPair: PublicKey;
  /**
   * user
   */
  user: PublicKey;
  binArraysPubkey: PublicKey[];
}

export interface SwapParams {
  /**
   * mint of in token
   */
  inToken: PublicKey;
  /**
   * mint of out token
   */
  outToken: PublicKey;
  /**
   * in token amount
   */
  inAmount: BN;
  /**
   * minimum out with slippage
   */
  minOutAmount: BN;
  /**
   * desired lbPair to swap against
   */
  lbPair: PublicKey;
  /**
   * user
   */
  user: PublicKey;
  binArraysPubkey: PublicKey[];
}

export interface SwapExactOutParams {
  /**
   * mint of in token
   */
  inToken: PublicKey;
  /**
   * mint of out token
   */
  outToken: PublicKey;
  /**
   * out token amount
   */
  outAmount: BN;
  /**
   * maximum in amount, also known as slippage
   */
  maxInAmount: BN;
  /**
   * desired lbPair to swap against
   */
  lbPair: PublicKey;
  /**
   * user
   */
  user: PublicKey;
  binArraysPubkey: PublicKey[];
}

export interface GetOrCreateATAResponse {
  ataPubKey: PublicKey;
  ix?: TransactionInstruction;
}

export enum BitmapType {
  U1024,
  U512,
}

export interface SeedLiquidityResponse {
  initializeBinArraysAndPositionIxs: TransactionInstruction[][];
  addLiquidityIxs: TransactionInstruction[][];
}

export interface Clock {
  slot: BN;
  epochStartTimestamp: BN;
  epoch: BN;
  leaderScheduleEpoch: BN;
  unixTimestamp: BN;
}

export const ClockLayout = struct([
  u64("slot"),
  i64("epochStartTimestamp"),
  u64("epoch"),
  u64("leaderScheduleEpoch"),
  i64("unixTimestamp"),
]);

export enum PairStatus {
  Enabled,
  Disabled,
}
