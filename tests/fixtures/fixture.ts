import { AnchorProvider, Program } from "@coral-xyz/anchor";
import {
  getAssociatedTokenAddressSync,
  AccountLayout,
  createTransferInstruction,
} from "@solana/spl-token";
import {
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
  TransactionMessage,
  TransactionInstruction,
  VersionedTransaction,
  Connection,
} from "@solana/web3.js";
import {
  CLMM_PROGRAM_ID,
  getPdaPoolVaultId,
  getPdaPersonalPositionAddress,
} from "@raydium-io/raydium-sdk-v2";
import {
  TickUtil,
  WhirlpoolContext,
  PDAUtil,
  PoolUtil,
  ORCA_WHIRLPOOLS_CONFIG,
  WhirlpoolIx,
  ORCA_WHIRLPOOL_PROGRAM_ID,
} from "@orca-so/whirlpools-sdk";

import { MathUtil } from "@orca-so/common-sdk";
import {
  prepareCreateMintInstructions,
  prepareCreateAndMintToATAInstruction,
  prepareCreateATAInstruction,
} from "../utils/token";
import { prepareInitTickArrayInstructions } from "../utils/orca/tick";
import BN from "bn.js";
import Decimal from "decimal.js";
import {
  ORCA_FEE_TIER_ACCOUNT_1,
  ORCA_FEE_TIER_ACCOUNT_64,
  ORCA_FEE_TIER_ACCOUNT_128,
  RAYDIUM_CLMM_CONFIG_4,
  METEORA_CLMM_PROGRAM_ID,
  METEORA_ADMIN_KEY,
} from "../constants";
import { prepareComputeUnitIx } from "../utils/instructions";

import {
  derivePresetParameter2,
  deriveReserve,
  StrategyType,
  BinLiquidity,
} from "@meteora-ag/dlmm";

import { BanksClient, BanksTransactionMeta, ProgramTestContext } from "solana-bankrun";
import { BankrunProvider } from "anchor-bankrun";
import { processTransaction } from "../utils/bankrun";
import { MeteoraDlmm } from "../meteora-sdk/idls/meteora_dlmm";
import METEORA_DLMM_IDL from "../meteora-sdk/idls/meteora_dlmm.json";
import { AmmV3 as RaydiumClmm } from "../raydium-sdk/idls/raydium_clmm";
import RAYDIUM_CLMM_IDL from "../raydium-sdk/idls/raydium_clmm.json";
import { Client as RaydiumClient } from "../raydium-sdk";
import { PositionUtils } from "../raydium-sdk/helpers/position";
import { Client as MeteoraClient } from "../meteora-sdk";
import { getActiveBin, getBins, getClaimableSwapFee } from "../meteora-sdk/state";
import { fromPricePerLamport } from "../meteora-sdk/helpers/math";
import {
  MeteoraPoolInfo,
  InitParams,
  OrcaPoolInfo,
  RaydiumPoolInfo,
  UserInfo,
  InitOrcaParams,
  InitRaydiumParams,
  InitMeteoraParams,
} from "./types";

export class TestFixture {
  private testContext: ProgramTestContext;
  private provider: BankrunProvider;
  private client: BanksClient;

  private lbClmmProgram: Program<MeteoraDlmm>;
  private lbClmmClient: MeteoraClient;

  private raydiumClmmProgram: Program<RaydiumClmm>;
  private raydiumClient: RaydiumClient;

  private adminWallet: PublicKey;

  private whirlpoolCtx: WhirlpoolContext;

  private tokenAInfo: TokenInfo = defaultTokenInfo();
  private tokenBInfo: TokenInfo = defaultTokenInfo();
  private tokenAMint: PublicKey = PublicKey.default;
  private tokenBMint: PublicKey = PublicKey.default;

  private orcaPoolInfo: OrcaPoolInfo = defaultOrcaPoolInfo();

  private raydiumPoolInfo: RaydiumPoolInfo = defaultRaydiumPoolInfo();

  private meteoraPoolInfo: MeteoraPoolInfo = defaultMeteoraPoolInfo();

  private userInfo: UserInfo = defaultUserInfo();

  private initialized = false;

  constructor(context: ProgramTestContext) {
    this.testContext = context;
    this.provider = new BankrunProvider(context);
    this.client = context.banksClient;

    this.lbClmmProgram = new Program<MeteoraDlmm>(METEORA_DLMM_IDL as MeteoraDlmm, this.provider);
    this.lbClmmClient = new MeteoraClient(this.lbClmmProgram);

    this.raydiumClmmProgram = new Program<RaydiumClmm>(
      RAYDIUM_CLMM_IDL as RaydiumClmm,
      this.provider,
    );
    this.raydiumClient = new RaydiumClient(this.raydiumClmmProgram);

    this.adminWallet = this.provider.wallet.publicKey;
    this.whirlpoolCtx = WhirlpoolContext.from(
      this.provider.connection,
      this.provider.wallet,
      ORCA_WHIRLPOOL_PROGRAM_ID,
    );
  }

  public async init(params: InitParams = defaultInitParams()): Promise<void> {
    await this.initMints();
    await this.initUser();

    await this.initOrcaPool(params.orca);

    await this.initRaydiumPool(params.raydium);

    await this.initMeteoraPool(params.meteora);

    this.initialized = true;
  }

  public async initMints(): Promise<void> {
    const connection = this.getConnection();
    const { mint: token_1, instructions: token_1_instructions } =
      await prepareCreateMintInstructions(connection, this.adminWallet, this.adminWallet, 9);
    const { mint: token_2, instructions: token_2_instructions } =
      await prepareCreateMintInstructions(connection, this.adminWallet, this.adminWallet, 9);

    await this.prepareAndProcessTransaction(
      [...token_1_instructions, ...token_2_instructions],
      this.adminWallet,
    );

    let [token_a, token_b] = PoolUtil.orderMints(token_1, token_2);

    this.tokenAMint = token_a as PublicKey;
    this.tokenBMint = token_b as PublicKey;
    this.tokenAInfo = {
      mint: this.tokenAMint,
      decimals: 9,
    };

    this.tokenBInfo = {
      mint: this.tokenBMint,
      decimals: 9,
    };

    const { tokenAccount: userAtaA, instructions: tokenAInstructions } =
      await prepareCreateAndMintToATAInstruction(
        connection,
        this.adminWallet,
        this.tokenAMint,
        new BN(10_000_000_000_000),
      );
    const { tokenAccount: userAtaB, instructions: tokenBInstructions } =
      await prepareCreateAndMintToATAInstruction(
        connection,
        this.adminWallet,
        this.tokenBMint,
        new BN(10_000_000_000_000),
      );

    await this.prepareAndProcessTransaction(
      [...tokenAInstructions, ...tokenBInstructions],
      this.adminWallet,
    );
  }

  async initUser() {
    await this.airdropSol(this.userInfo.wallet.publicKey, new BN(1000000000));

    const userTokenAAccount = getAssociatedTokenAddressSync(
      this.tokenAMint,
      this.userInfo.wallet.publicKey,
    );
    const userTokenBAccount = getAssociatedTokenAddressSync(
      this.tokenBMint,
      this.userInfo.wallet.publicKey,
    );

    this.userInfo.tokenAAccount = userTokenAAccount;
    this.userInfo.tokenBAccount = userTokenBAccount;

    await this.airdropToken(
      this.userInfo.wallet.publicKey,
      this.tokenAMint,
      new BN(1_000_000_000_000),
    );
    await this.airdropToken(
      this.userInfo.wallet.publicKey,
      this.tokenBMint,
      new BN(1_000_000_000_000),
    );
  }

  public async initOrcaWhirlpoolPool(initSqrtPrice: BN, tickSpacing: number): Promise<void> {
    const funder = this.provider.wallet.publicKey;
    const connection = this.getConnection();

    const whirlpoolPda = PDAUtil.getWhirlpool(
      ORCA_WHIRLPOOL_PROGRAM_ID,
      ORCA_WHIRLPOOLS_CONFIG,
      this.tokenAMint,
      this.tokenBMint,
      tickSpacing,
    );

    const tokenVaultAKeypair = Keypair.generate();
    const tokenVaultBKeypair = Keypair.generate();

    const initPoolIx = WhirlpoolIx.initializePoolIx(this.whirlpoolCtx.program, {
      tokenMintA: this.tokenAMint,
      tokenMintB: this.tokenBMint,
      whirlpoolsConfig: ORCA_WHIRLPOOLS_CONFIG,
      whirlpoolPda: whirlpoolPda,
      tokenVaultAKeypair,
      tokenVaultBKeypair,
      feeTierKey: this.getFeeTierAccount(tickSpacing),
      initSqrtPrice: initSqrtPrice,
      tickSpacing,
      funder,
    });

    await this.prepareAndProcessTransaction([...initPoolIx.instructions], this.adminWallet);

    this.orcaPoolInfo.whirlpoolPda = whirlpoolPda;
    this.orcaPoolInfo.tickSpacing = tickSpacing;

    this.orcaPoolInfo.tokenAVault = tokenVaultAKeypair.publicKey;
    this.orcaPoolInfo.tokenBVault = tokenVaultBKeypair.publicKey;
    this.orcaPoolInfo.tokenAMint = this.tokenAMint;
    this.orcaPoolInfo.tokenBMint = this.tokenBMint;
  }

  public async initOrcaPool(params: InitOrcaParams): Promise<void> {
    await this.initOrcaWhirlpoolPool(params.sqrtPrice, params.tickSpacing);
    await this.initOrcaTickArrayRange(
      params.tickStartIndex,
      params.tickArrayCount,
      params.tickSpacing,
    );
    const tickUpperIndex = params.tickStartIndex + params.tickArrayCount * params.tickSpacing;
    const positionMint = await this.openOrcaPosition(params.tickStartIndex, tickUpperIndex);
    await this.increaseOrcaPoolLiquidity(
      positionMint,
      params.tickStartIndex,
      tickUpperIndex,
      new BN(1_000_000_000),
    );
  }

  public async initRaydiumPool(params: InitRaydiumParams): Promise<void> {
    await this.initRaydiumClmmPool(params.sqrtPrice);

    const position = await this.createRaydiumPoolPosition(params.LowerPrice, params.UpperPrice);

    await this.increaseRaydiumPoolLiquidity(position, new BN(10));
  }

  public async initMeteoraPool(params: InitMeteoraParams): Promise<void> {
    await this.airdropSol(METEORA_ADMIN_KEY, new BN(1000000000));
    await this.initMeteoraDlmmPool(params.binStep, params.baseFactor);
    const position = await this.addMeteoraLiquidity(this.meteoraPoolInfo.dlmmPool, params.amount);
  }

  public async initOrcaTickArrayRange(
    startTickIndex: number,
    arrayCount: number,
    tickSpacing: number,
    aToB: boolean = false,
  ) {
    const instructions = prepareInitTickArrayInstructions(
      this.whirlpoolCtx,
      this.orcaPoolInfo.whirlpoolPda.publicKey,
      startTickIndex,
      arrayCount,
      tickSpacing,
      aToB,
    );

    await this.prepareAndProcessTransaction(
      instructions.map((i) => i.ix.instructions).flat(),
      this.adminWallet,
    );
  }

  public async openOrcaPosition(
    tickLowerIndex: number,
    tickUpperIndex: number,
    payer?: Keypair,
  ): Promise<PublicKey> {
    const connection = this.getConnection();
    const positionMint = Keypair.generate();
    const owner = payer?.publicKey || this.provider.wallet.publicKey;
    const positionTokenAccount = getAssociatedTokenAddressSync(positionMint.publicKey, owner);

    const openPositionIx = WhirlpoolIx.openPositionIx(this.whirlpoolCtx.program, {
      whirlpool: this.orcaPoolInfo.whirlpoolPda.publicKey,
      owner,
      positionPda: PDAUtil.getPosition(this.whirlpoolCtx.program.programId, positionMint.publicKey),
      positionMintAddress: positionMint.publicKey,
      positionTokenAccount,
      tickLowerIndex,
      tickUpperIndex,
      funder: owner,
    });

    await this.prepareAndProcessTransaction([...openPositionIx.instructions], this.adminWallet);
    return positionMint.publicKey;
  }

  public async increaseOrcaPoolLiquidity(
    positionMint: PublicKey,
    tickLowerIndex: number,
    tickUpperIndex: number,
    amount: BN,
    payer?: Keypair,
  ): Promise<void> {
    const owner = payer?.publicKey || this.adminWallet;
    const connection = this.getConnection();
    const positionTokenAccountAddress = getAssociatedTokenAddressSync(positionMint, owner);
    const userTokenAAccount = getAssociatedTokenAddressSync(this.tokenAMint, owner);
    const userTokenBAccount = getAssociatedTokenAddressSync(this.tokenBMint, owner);
    const increaseLiquidityIx = WhirlpoolIx.increaseLiquidityIx(this.whirlpoolCtx.program, {
      whirlpool: this.orcaPoolInfo.whirlpoolPda.publicKey,
      position: PDAUtil.getPosition(this.whirlpoolCtx.program.programId, positionMint).publicKey,
      positionTokenAccount: positionTokenAccountAddress,
      tokenOwnerAccountA: userTokenAAccount,
      tokenOwnerAccountB: userTokenBAccount,
      tokenVaultA: this.orcaPoolInfo.tokenAVault,
      tokenVaultB: this.orcaPoolInfo.tokenBVault,
      tickArrayLower: PDAUtil.getTickArray(
        this.whirlpoolCtx.program.programId,
        this.orcaPoolInfo.whirlpoolPda.publicKey,
        TickUtil.getStartTickIndex(tickLowerIndex, this.orcaPoolInfo.tickSpacing),
      ).publicKey,
      tickArrayUpper: PDAUtil.getTickArray(
        this.whirlpoolCtx.program.programId,
        this.orcaPoolInfo.whirlpoolPda.publicKey,
        TickUtil.getStartTickIndex(tickUpperIndex, this.orcaPoolInfo.tickSpacing),
      ).publicKey,
      positionAuthority: owner,
      liquidityAmount: amount,
      tokenMaxA: new BN(100_000_000),
      tokenMaxB: new BN(100_000_000),
    });

    await this.prepareAndProcessTransaction(
      [...increaseLiquidityIx.instructions],
      this.adminWallet,
    );
  }

  public getOrcaPoolInfo(): OrcaPoolInfo {
    return this.orcaPoolInfo;
  }

  public getRaydiumPoolInfo(): RaydiumPoolInfo {
    return this.raydiumPoolInfo;
  }

  public getMeteoraPoolInfo(): MeteoraPoolInfo {
    return this.meteoraPoolInfo;
  }

  public getFeeTierAccount(tickSpacing: number): PublicKey {
    switch (tickSpacing) {
      case 1:
        return ORCA_FEE_TIER_ACCOUNT_1;
      case 64:
        return ORCA_FEE_TIER_ACCOUNT_64;
      case 128:
        return ORCA_FEE_TIER_ACCOUNT_128;
      default:
        throw new Error("Invalid tick spacing");
    }
  }

  public async initRaydiumClmmPool(initSqrtPrice: Decimal): Promise<PublicKey> {
    const clmmConfig = RAYDIUM_CLMM_CONFIG_4;
    const { ix, poolId } = await this.raydiumClient.createPool(
      new PublicKey(clmmConfig.id),
      this.tokenAMint,
      this.tokenBMint,
      this.tokenAInfo.decimals,
      this.tokenBInfo.decimals,
      initSqrtPrice,
      this.adminWallet,
    );

    await this.prepareAndProcessTransaction([ix], this.adminWallet);

    this.raydiumPoolInfo.clmmPool = poolId;
    this.raydiumPoolInfo.tickSpacing = clmmConfig.tickSpacing;
    this.raydiumPoolInfo.tokenAMint = this.tokenAMint;
    this.raydiumPoolInfo.tokenBMint = this.tokenBMint;
    this.raydiumPoolInfo.tokenAVault = getPdaPoolVaultId(
      CLMM_PROGRAM_ID,
      poolId,
      this.tokenAMint,
    ).publicKey;
    this.raydiumPoolInfo.tokenBVault = getPdaPoolVaultId(
      CLMM_PROGRAM_ID,
      poolId,
      this.tokenBMint,
    ).publicKey;

    return poolId;
  }

  public async createRaydiumPoolPosition(
    lowerPrice: Decimal,
    upperPrice: Decimal,
    wallet?: Keypair,
  ): Promise<PublicKey> {
    const user = wallet?.publicKey || this.adminWallet;
    const poolId = this.raydiumPoolInfo.clmmPool;

    const { ix, nftMint, personalPosition } = await this.raydiumClient.openPosition(
      poolId,
      new BN(1),
      new BN(1_000),
      new BN(1_000),
      lowerPrice,
      upperPrice,
      user,
      user,
    );

    await this.prepareAndProcessTransaction([ix], user);

    return nftMint;
  }

  public async increaseRaydiumPoolLiquidity(nftMint: PublicKey, liquidity: BN, wallet?: Keypair) {
    const user = wallet?.publicKey || this.adminWallet;
    const poolId = this.raydiumPoolInfo.clmmPool;
    const ix = await this.raydiumClient.increasePosition(
      poolId,
      user,
      nftMint,
      liquidity,
      new BN(1_000_000),
      new BN(1_000_000),
      user,
    );
    await this.prepareAndProcessTransaction(ix, user);
  }

  public async decreaseRaydiumPoolLiquidity(nftMint: PublicKey, liquidity: BN, wallet?: Keypair) {
    const user = wallet?.publicKey || this.adminWallet;
    const poolId = this.raydiumPoolInfo.clmmPool;
    const ix = await this.raydiumClient.decreasePosition(
      poolId,
      user,
      nftMint,
      liquidity,
      new BN(0),
      new BN(0),
    );
    await this.prepareAndProcessTransaction(ix, user);
  }

  public async initMeteoraDlmmPool(binStep: BN, baseFactor: BN): Promise<PublicKey> {
    const DEFAULT_ACTIVE_ID = new BN(5660);
    const [presetParamPda] = derivePresetParameter2(binStep, baseFactor, METEORA_CLMM_PROGRAM_ID);
    const wallet = this.adminWallet;

    let { ix, lbPair } = await this.lbClmmClient.createLbPair({
      funder: wallet,
      tokenX: this.tokenAMint,
      tokenY: this.tokenBMint,
      binStep,
      baseFactor,
      presetParameter: presetParamPda,
      activeId: DEFAULT_ACTIVE_ID,
    });

    await this.prepareAndProcessTransaction([ix], this.adminWallet);

    this.meteoraPoolInfo.dlmmPool = lbPair;
    this.meteoraPoolInfo.binStep = binStep;
    this.meteoraPoolInfo.baseFactor = baseFactor;
    this.meteoraPoolInfo.tokenAMint = this.tokenAMint;
    this.meteoraPoolInfo.tokenBMint = this.tokenBMint;
    this.meteoraPoolInfo.tokenAVault = deriveReserve(
      this.tokenAMint,
      lbPair,
      METEORA_CLMM_PROGRAM_ID,
    )[0];
    this.meteoraPoolInfo.tokenBVault = deriveReserve(
      this.tokenBMint,
      lbPair,
      METEORA_CLMM_PROGRAM_ID,
    )[0];

    return lbPair;
  }

  async getMeteoraActiveBin(): Promise<BinLiquidity> {
    return getActiveBin(
      this.lbClmmProgram,
      this.meteoraPoolInfo.dlmmPool,
      this.tokenAInfo.decimals,
      this.tokenBInfo.decimals,
      this.meteoraPoolInfo.binStep.toNumber(),
    );
  }

  getMeteoraActiveBinPrice(pricePerLamport: number): string {
    return fromPricePerLamport(pricePerLamport, this.tokenAInfo.decimals, this.tokenBInfo.decimals);
  }

  async addMeteoraLiquidity(lbPair: PublicKey, amount: BN, wallet?: Keypair): Promise<PublicKey> {
    const activeBin = await this.getMeteoraActiveBin();

    const TOTAL_RANGE_INTERVAL = 10; // 10 bins on each side of the active bin
    const minBinId = activeBin.binId - TOTAL_RANGE_INTERVAL;
    const maxBinId = activeBin.binId + TOTAL_RANGE_INTERVAL;

    const activeBinPricePerToken = fromPricePerLamport(
      Number(activeBin.price),
      this.tokenAInfo.decimals,
      this.tokenBInfo.decimals,
    );
    const totalXAmount = amount;
    const totalYAmount = totalXAmount.mul(new BN(Number(activeBinPricePerToken)));

    const position = Keypair.generate();

    let user = wallet?.publicKey || this.provider.wallet.publicKey;

    const ixs = await this.lbClmmClient.initializePositionAndAddLiquidityByStrategy({
      lbPair,
      totalXAmount,
      totalYAmount,
      positionPubKey: position.publicKey,
      strategy: {
        maxBinId,
        minBinId,
        strategyType: StrategyType.SpotBalanced,
        parameteres: [],
      },
      slippage: 100,
      user,
    });

    await this.prepareAndProcessTransaction(ixs, user);

    return position.publicKey;
  }

  async removeMeteoraLiquidity(position: PublicKey, bps: BN, wallet?: Keypair): Promise<void> {
    let user = wallet?.publicKey || this.provider.wallet.publicKey;
    const { lbPair, lowerBinId, upperBinId } =
      await this.lbClmmProgram.account.positionV2.fetch(position);

    const binIdsToRemove = (
      await getBins(
        this.lbClmmProgram,
        lbPair,
        lowerBinId,
        upperBinId,
        this.tokenAInfo.decimals,
        this.tokenBInfo.decimals,
        this.meteoraPoolInfo.binStep.toNumber(),
      )
    ).map((bin) => bin.binId);

    const ixs = await this.lbClmmClient.removeLiquidity({
      positionPubKey: position,
      user,
      binIds: binIdsToRemove,
      bps: bps.toNumber(),
    });
    await this.prepareAndProcessTransaction(ixs, this.adminWallet);

    const claimSwapFeeIx = await this.lbClmmClient.claimSwapFee({
      positionPubKey: position,
      user,
    });
    await this.prepareAndProcessTransaction(claimSwapFeeIx, this.adminWallet);

    const claimRewardIx = await this.lbClmmClient.claimRewards({
      positionPubKey: position,
      user,
    });
    await this.prepareAndProcessTransaction(claimRewardIx, this.adminWallet);

    const closePositionIx = await this.lbClmmClient.closePosition({
      positionPubKey: position,
      user,
    });
    await this.prepareAndProcessTransaction(closePositionIx, this.adminWallet);
  }

  public getUserInfo(): UserInfo {
    return this.userInfo;
  }

  public getTokens(): PublicKey[] {
    return [this.tokenAMint, this.tokenBMint];
  }

  public async airdropSol(receiver: PublicKey, amount: BN): Promise<void> {
    const connection = this.getConnection();
    const transferIx = SystemProgram.transfer({
      fromPubkey: this.provider.wallet.publicKey,
      toPubkey: receiver,
      lamports: amount.toNumber(),
    });

    await this.prepareAndProcessTransaction([transferIx], this.adminWallet);
  }

  public async airdropToken(receiver: PublicKey, mint: PublicKey, amount: BN): Promise<void> {
    const sender = this.adminWallet;
    const connection = this.getConnection();
    const source = getAssociatedTokenAddressSync(mint, sender);
    const ata = await this.getOrCreateATA(connection, receiver, mint);
    const transferIx = createTransferInstruction(source, ata, sender, amount.toNumber());
    await this.prepareAndProcessTransaction([transferIx], sender);
  }

  async getOrCreateATA(
    connection: Connection,
    owner: PublicKey,
    mint: PublicKey,
  ): Promise<PublicKey> {
    const ata = getAssociatedTokenAddressSync(mint, owner);
    try {
      const account = await connection.getAccountInfo(ata);
      return ata;
    } catch (e) {
      const createIx = prepareCreateATAInstruction(mint, owner, this.adminWallet);
      await this.prepareAndProcessTransaction([createIx.instruction], this.adminWallet);
      return createIx.ataAddress;
    }
  }

  async rentAta() {
    return this.getConnection().getMinimumBalanceForRentExemption(AccountLayout.span);
  }

  getConnection() {
    return this.provider.connection;
  }

  async processTransaction(tx: VersionedTransaction | Transaction): Promise<BanksTransactionMeta> {
    return processTransaction(this.client, tx);
  }

  async prepareAndProcessTransaction(
    instructions: TransactionInstruction[],
    payer: PublicKey,
    signers?: Keypair[],
  ): Promise<BanksTransactionMeta> {
    const msg = new TransactionMessage({
      payerKey: payer,
      recentBlockhash: (await this.client.getLatestBlockhash())[0],
      instructions: [...prepareComputeUnitIx(100_000, 20_000_000), ...instructions],
    }).compileToV0Message();
    const tx = new VersionedTransaction(msg);
    if (signers) tx.sign(signers);

    return processTransaction(this.client, tx);
  }

  async getMeteoraPositionFee(position: PublicKey): Promise<{
    feeX: BN;
    feeY: BN;
  }> {
    return getClaimableSwapFee(this.lbClmmProgram, position);
  }

  async getRaydiumPositionFee(
    pool: PublicKey,
    nftMint: PublicKey,
  ): Promise<{
    feeX: BN;
    feeY: BN;
  }> {
    const poolState = await this.raydiumClmmProgram.account.poolState.fetch(pool);
    const { publicKey: personalPosition } = getPdaPersonalPositionAddress(CLMM_PROGRAM_ID, nftMint);
    const positionAccount =
      await this.raydiumClmmProgram.account.personalPositionState.fetch(personalPosition);

    const tickLowerState = await this.raydiumClient.getTickState(
      pool,
      positionAccount.tickLowerIndex,
      poolState.tickSpacing,
    );
    const tickUpperState = await this.raydiumClient.getTickState(
      pool,
      positionAccount.tickUpperIndex,
      poolState.tickSpacing,
    );

    const tokenFees = PositionUtils.GetPositionFeesV2(
      positionAccount.liquidity,
      positionAccount.feeGrowthInside0LastX64,
      positionAccount.feeGrowthInside1LastX64,
      positionAccount.tokenFeesOwed0,
      positionAccount.tokenFeesOwed1,
      poolState.feeGrowthGlobal0X64,
      poolState.feeGrowthGlobal1X64,
      poolState.tickCurrent,
      tickLowerState,
      tickUpperState,
    );

    return {
      feeX: tokenFees.tokenFeeAmountA,
      feeY: tokenFees.tokenFeeAmountB,
    };
  }
}

function defaultInitOrcaParams(): InitOrcaParams {
  return {
    sqrtPrice: MathUtil.toX64(new Decimal(5)),
    tickSpacing: 128,
    tickStartIndex: 22528,
    tickArrayCount: 3,
  };
}

function defaultInitRaydiumParams(): InitRaydiumParams {
  return {
    sqrtPrice: new Decimal(5),
    tickSpacing: 128,
    LowerPrice: new Decimal(0.000001),
    UpperPrice: new Decimal(1000000),
  };
}

function defaultInitMeteoraParams(): InitMeteoraParams {
  return {
    binStep: new BN(10),
    baseFactor: new BN(10000),
    amount: new BN(1_000_000),
  };
}

function defaultOrcaPoolInfo(): OrcaPoolInfo {
  return {
    whirlpoolPda: {
      publicKey: PublicKey.default,
      bump: 0,
    },
    tickSpacing: 128,
    tokenAMint: PublicKey.default,
    tokenBMint: PublicKey.default,
    tokenAVault: PublicKey.default,
    tokenBVault: PublicKey.default,
  };
}

function defaultRaydiumPoolInfo(): RaydiumPoolInfo {
  return {
    clmmPool: PublicKey.default,
    tickSpacing: 128,
    tokenAMint: PublicKey.default,
    tokenBMint: PublicKey.default,
    tokenAVault: PublicKey.default,
    tokenBVault: PublicKey.default,
  };
}

function defaultMeteoraPoolInfo(): MeteoraPoolInfo {
  return {
    dlmmPool: PublicKey.default,
    binStep: new BN(10),
    baseFactor: new BN(10000),
    tokenAMint: PublicKey.default,
    tokenBMint: PublicKey.default,
    tokenAVault: PublicKey.default,
    tokenBVault: PublicKey.default,
  };
}

function defaultInitParams(): InitParams {
  return {
    orca: defaultInitOrcaParams(),
    raydium: defaultInitRaydiumParams(),
    meteora: defaultInitMeteoraParams(),
  };
}

function defaultUserInfo(): UserInfo {
  return {
    wallet: Keypair.generate(),
    tokenAAccount: PublicKey.default,
    tokenBAccount: PublicKey.default,
  };
}

export type TokenInfo = {
  mint: PublicKey;
  decimals: number;
};

function defaultTokenInfo(): TokenInfo {
  return {
    mint: PublicKey.default,
    decimals: 9,
  };
}
