import { AnchorProvider } from "@coral-xyz/anchor";
import {
  getAssociatedTokenAddressSync,
  NATIVE_MINT,
  AccountLayout,
  createTransferInstruction,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { Keypair, PublicKey, SystemProgram } from "@solana/web3.js";
import {
  CLMM_PROGRAM_ID,
  Raydium,
  TxVersion,
  ApiV3Token,
  getPdaPoolId,
  getPdaPoolVaultId,
  TickUtils as RaydiumTickUtils,
  PositionInfoLayout,
} from "@raydium-io/raydium-sdk-v2";
import {
  TickUtil,
  InitConfigParams,
  InitPoolParams,
  WhirlpoolContext,
  PDAUtil,
  PoolUtil,
  ORCA_WHIRLPOOLS_CONFIG,
  WhirlpoolIx,
  ORCA_WHIRLPOOL_PROGRAM_ID,
} from "@orca-so/whirlpools-sdk";

import {
  TransactionBuilder,
  PDA,
  TransactionBuilderOptions,
  resolveOrCreateATA,
  MathUtil,
} from "@orca-so/common-sdk";
import { createMint, createAndMintToAssociatedTokenAccount } from "../utils/token";
import { initTickArrayRange } from "../utils/orca/tick";
import BN from "bn.js";
import Decimal from "decimal.js";
import {
  ORCA_FEE_TIER_ACCOUNT_1,
  ORCA_FEE_TIER_ACCOUNT_64,
  ORCA_FEE_TIER_ACCOUNT_128,
  RAYDIUM_CLMM_CONFIG_4,
} from "../constants";

export class TestFixture {
  private provider: AnchorProvider;

  private whirlpoolCtx: WhirlpoolContext;

  private raydiumSdk: Raydium;

  private tokenAMint: PublicKey = PublicKey.default;
  private tokenBMint: PublicKey = PublicKey.default;

  private orcaPoolInfo: OrcaPoolInfo = defaultOrcaPoolInfo();

  private raydiumPoolInfo: RaydiumPoolInfo = defaultRaydiumPoolInfo();

  private userInfo: UserInfo = defaultUserInfo();

  private initialized = false;

  constructor(provider: AnchorProvider, whirlpoolCtx?: WhirlpoolContext) {
    this.provider = provider;
    this.whirlpoolCtx =
      whirlpoolCtx || WhirlpoolContext.withProvider(provider, ORCA_WHIRLPOOL_PROGRAM_ID);
  }

  public async init(params: InitParams = defaultInitParams()): Promise<void> {
    await this.initMints();
    await this.initUser();

    await this.initOrcaPool(params.orca);

    await this.initRaydiumSdk();

    await this.initRaydiumPool(params.raydium);

    this.initialized = true;
  }

  public async initMints(): Promise<void> {
    const token_1 = await createMint(this.provider);
    const token_2 = await createMint(this.provider);
    let [token_a, token_b] = PoolUtil.orderMints(token_1, token_2);
    this.tokenAMint = token_a as PublicKey;
    this.tokenBMint = token_b as PublicKey;

    await createAndMintToAssociatedTokenAccount(
      this.provider,
      this.tokenAMint,
      new BN(10_000_000_000),
    );
    await createAndMintToAssociatedTokenAccount(
      this.provider,
      this.tokenBMint,
      new BN(10_000_000_000),
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

    await this.airdropToken(this.userInfo.wallet.publicKey, this.tokenAMint, new BN(10_000_000));
    await this.airdropToken(this.userInfo.wallet.publicKey, this.tokenBMint, new BN(1000000000));
  }

  public async initOrcaWhirlpoolPool(initSqrtPrice: BN, tickSpacing: number): Promise<void> {
    const funder = this.provider.wallet.publicKey;

    const whirlpoolPda = PDAUtil.getWhirlpool(
      this.whirlpoolCtx.program.programId,
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

    const transaction = new TransactionBuilder(
      this.provider.connection,
      this.provider.wallet,
      this.getTxBuilderOpts(),
    ).addInstruction(initPoolIx);

    await this.sendAndConfirmTx(transaction);

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
    await this.initRaydiumClmmPoolPool(params.sqrtPrice, params.tickSpacing);

    await sleep(1000);

    const position = await this.createRaydiumPoolPosition(params.LowerPrice, params.UpperPrice);

    await sleep(1000);

    await this.increaseRaydiumPoolLiquidity(position, new BN(1000));
  }

  public async initOrcaTickArrayRange(
    startTickIndex: number,
    arrayCount: number,
    tickSpacing: number,
    aToB: boolean = false,
  ) {
    await initTickArrayRange(
      this.whirlpoolCtx,
      this.orcaPoolInfo.whirlpoolPda.publicKey,
      startTickIndex,
      arrayCount,
      tickSpacing,
      aToB,
    );
  }

  public async openOrcaPosition(
    tickLowerIndex: number,
    tickUpperIndex: number,
    payer?: Keypair,
  ): Promise<PublicKey> {
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

    const transaction = new TransactionBuilder(
      this.provider.connection,
      this.provider.wallet,
      this.getTxBuilderOpts(),
    )
      .addInstruction(openPositionIx)
      .addSigner(positionMint);

    if (payer) {
      transaction.addSigner(payer);
    }

    await this.sendAndConfirmTx(transaction);
    return positionMint.publicKey;
  }

  public async increaseOrcaPoolLiquidity(
    positionMint: PublicKey,
    tickLowerIndex: number,
    tickUpperIndex: number,
    amount: BN,
    payer?: Keypair,
  ): Promise<void> {
    const owner = payer?.publicKey || this.provider.wallet.publicKey;
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

    const tx = new TransactionBuilder(
      this.provider.connection,
      this.provider.wallet,
      this.getTxBuilderOpts(),
    ).addInstruction(increaseLiquidityIx);

    if (payer) {
      tx.addSigner(payer);
    }

    await this.sendAndConfirmTx(tx);
  }

  public getOrcaPoolInfo(): OrcaPoolInfo {
    return this.orcaPoolInfo;
  }

  public getRaydiumPoolInfo(): RaydiumPoolInfo {
    return this.raydiumPoolInfo;
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

  public getTxBuilderOpts(): TransactionBuilderOptions {
    return {
      defaultBuildOption: {
        maxSupportedTransactionVersion: "legacy",
        blockhashCommitment: "confirmed",
      },
      defaultConfirmationCommitment: "confirmed",
      defaultSendOption: {
        skipPreflight: false,
      },
    };
  }

  public async initRaydiumSdk(): Promise<void> {
    this.raydiumSdk = await Raydium.load({
      owner: this.provider.wallet.publicKey,
      connection: this.provider.connection,
      cluster: "devnet",
      disableFeatureCheck: true,
      disableLoadToken: false,
      blockhashCommitment: "confirmed",
      signAllTransactions: async (txs) => {
        const signedTxs = await this.provider.wallet.signAllTransactions(txs);
        return signedTxs;
      },
    });
  }

  public async initRaydiumClmmPoolPool(
    initSqrtPrice: Decimal,
    tickSpacing: number,
  ): Promise<PublicKey> {
    const mint1 = generateDummyApiV3Token(this.tokenAMint);
    const mint2 = generateDummyApiV3Token(this.tokenBMint);
    const clmmConfig = RAYDIUM_CLMM_CONFIG_4;
    const { execute } = await this.raydiumSdk.clmm.createPool({
      programId: CLMM_PROGRAM_ID,
      mint1,
      mint2,
      ammConfig: {
        ...clmmConfig,
        id: new PublicKey(clmmConfig.id),
        fundOwner: "",
        description: "",
      },
      initialPrice: initSqrtPrice,
      startTime: new BN(0),
      txVersion: TxVersion.V0,
    });
    // // don't want to wait confirm, set sendAndConfirm to false or don't pass any params to execute
    const { txId } = await execute({ sendAndConfirm: true });

    const poolId = getPdaPoolId(
      CLMM_PROGRAM_ID,
      new PublicKey(clmmConfig.id),
      this.tokenAMint,
      this.tokenBMint,
    ).publicKey;

    this.raydiumPoolInfo.clmmPool = poolId;
    this.raydiumPoolInfo.tickSpacing = tickSpacing;
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
    const raydium = await this.getRaydiumSdk(wallet);
    const poolId = this.raydiumPoolInfo.clmmPool;
    const { poolInfo, poolKeys } = await raydium.clmm.getPoolInfoFromRpc(poolId.toBase58());

    const { tick: lowerTick } = RaydiumTickUtils.getPriceAndTick({
      poolInfo,
      price: lowerPrice,
      baseIn: true,
    });

    const { tick: upperTick } = RaydiumTickUtils.getPriceAndTick({
      poolInfo,
      price: upperPrice,
      baseIn: true,
    });

    const { execute, extInfo } = await raydium.clmm.openPositionFromBase({
      poolInfo,
      poolKeys,
      tickUpper: Math.max(lowerTick, upperTick),
      tickLower: Math.min(lowerTick, upperTick),
      base: "MintA",
      ownerInfo: {
        useSOLBalance: false,
      },
      baseAmount: new BN(new Decimal(1).toFixed(0)),
      otherAmountMax: new BN(1_000),
      txVersion: TxVersion.V0,
      computeBudgetConfig: {
        units: 20_000_000,
        microLamports: 100000,
      },
    });

    const res = await execute({ sendAndConfirm: true });

    return extInfo.personalPosition;
  }

  public async increaseRaydiumPoolLiquidity(
    userPosition: PublicKey,
    liquidity: BN,
    wallet?: Keypair,
  ) {
    const raydium = await this.getRaydiumSdk(wallet);
    const poolId = this.raydiumPoolInfo.clmmPool;
    const { poolInfo, poolKeys } = await raydium.clmm.getPoolInfoFromRpc(poolId.toBase58());

    const getPosition = async (p: PublicKey) => {
      const account = await this.provider.connection.getAccountInfo(p);
      const position = PositionInfoLayout.decode(account.data);
      return position;
    };
    const position = await getPosition(userPosition);
    const { execute } = await raydium.clmm.increasePositionFromLiquidity({
      poolInfo,
      poolKeys,
      ownerPosition: position,
      ownerInfo: {
        useSOLBalance: true,
      },
      liquidity: liquidity,
      amountMaxA: new BN(1_000_000),
      amountMaxB: new BN(1_000_000),
      checkCreateATAOwner: true,
      txVersion: TxVersion.V0,
    });
    // don't want to wait confirm, set sendAndConfirm to false or don't pass any params to execute
    await execute({ sendAndConfirm: true });
  }

  public getUserInfo(): UserInfo {
    return this.userInfo;
  }

  public async airdropSol(receiver: PublicKey, amount: BN): Promise<void> {
    const transferIx = SystemProgram.transfer({
      fromPubkey: this.provider.wallet.publicKey,
      toPubkey: receiver,
      lamports: amount.toNumber(),
    });
    const transaction = new TransactionBuilder(
      this.provider.connection,
      this.provider.wallet,
      this.getTxBuilderOpts(),
    ).addInstruction({
      instructions: [transferIx],
      cleanupInstructions: [],
      signers: [],
    });
    await this.sendAndConfirmTx(transaction);
  }

  public async airdropToken(receiver: PublicKey, mint: PublicKey, amount: BN): Promise<void> {
    const sender = this.provider.wallet.publicKey;
    const source = getAssociatedTokenAddressSync(mint, sender);
    const ata = await resolveOrCreateATA(
      this.provider.connection,
      receiver,
      mint,
      this.rentAta,
      new BN(0),
      sender,
    );
    const transferIx = createTransferInstruction(source, ata.address, sender, amount.toNumber());
    const transaction = new TransactionBuilder(
      this.provider.connection,
      this.provider.wallet,
      this.getTxBuilderOpts(),
    )
      .addInstruction(ata)
      .addInstruction({
        instructions: [transferIx],
        cleanupInstructions: [],
        signers: [],
      });
    await this.sendAndConfirmTx(transaction);
  }

  public async sendAndConfirmTx(transaction: TransactionBuilder): Promise<void> {
    let sig = await transaction.buildAndExecute();
    await this.provider.connection.confirmTransaction(sig);
  }

  async rentAta() {
    return this.provider.connection.getMinimumBalanceForRentExemption(AccountLayout.span);
  }

  async getRaydiumSdk(user?: Keypair): Promise<Raydium> {
    if (user) {
      return await Raydium.load({
        owner: user.publicKey,
        connection: this.provider.connection,
        cluster: "devnet",
        disableFeatureCheck: true,
        disableLoadToken: false,
        blockhashCommitment: "confirmed",
        signAllTransactions: async (txs) => {
          const signedTxs = await this.provider.wallet.signAllTransactions(txs);
          return signedTxs;
        },
      });
    }
    return this.raydiumSdk;
  }
}

export type InitParams = {
  orca: InitOrcaParams;
  raydium: InitRaydiumParams;
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

export type OrcaPoolInfo = {
  whirlpoolPda: PDA;
  tickSpacing: number;
} & PoolTokensInfo;

export type RaydiumPoolInfo = {
  clmmPool: PublicKey;
  tickSpacing: number;
} & PoolTokensInfo;

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

function defaultInitParams(): InitParams {
  return {
    orca: defaultInitOrcaParams(),
    raydium: defaultInitRaydiumParams(),
  };
}

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

function defaultUserInfo(): UserInfo {
  return {
    wallet: Keypair.generate(),
    tokenAAccount: PublicKey.default,
    tokenBAccount: PublicKey.default,
  };
}

function generateDummyApiV3Token(mint: PublicKey): ApiV3Token {
  return {
    chainId: 101,
    address: mint.toBase58(),
    programId: TOKEN_PROGRAM_ID.toBase58(),
    logoURI: "",
    symbol: "DUMMY",
    name: "DUMMY",
    decimals: 6,
    tags: [],
    extensions: {},
  };
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
