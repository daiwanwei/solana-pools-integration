import { BN, Program, Provider } from "@coral-xyz/anchor";
import {
  PublicKey,
  SystemProgram,
  SYSVAR_RENT_PUBKEY,
  Transaction,
  TransactionInstruction,
} from "@solana/web3.js";
import { MeteoraDlmm } from "./idls/meteora_dlmm";
import { LiquidityParameterByStrategy } from "./types";
import {
  binIdToBinArrayIndex,
  isOverflowDefaultBinArrayBitmap,
  deriveBinArrayBitmapExtension,
} from "./helpers/binArray";
import { getOrCreateATAInstruction } from "./helpers/token";
import { deriveBinArray, deriveLbPair2, deriveOracle, deriveReserve } from "./helpers/derive";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { METEORA_CLMM_PROGRAM_ID } from "../constants";
import { MAX_ACTIVE_BIN_SLIPPAGE } from "./constants";
import { getPairPubkeyIfExists } from "./helpers/pool";
import { StrategyParameters, toStrategyParameters } from "@meteora-ag/dlmm";

export class Client {
  private program: Program<MeteoraDlmm>;
  private provider: Provider;

  constructor(program: Program<MeteoraDlmm>) {
    this.program = program;
    this.provider = program.provider;
  }

  async createLbPair(args: CreateLbPairParams): Promise<{
    ix: TransactionInstruction;
    lbPair: PublicKey;
  }> {
    const { tokenX, tokenY, binStep, baseFactor, presetParameter, activeId, funder } = args;
    const existsPool = await getPairPubkeyIfExists(
      this.program,
      tokenX,
      tokenY,
      binStep,
      baseFactor
    );
    if (existsPool) {
      throw new Error("Pool already exists");
    }

    const [lbPair] = deriveLbPair2(tokenX, tokenY, binStep, baseFactor, this.program.programId);

    const [reserveX] = deriveReserve(tokenX, lbPair, this.program.programId);
    const [reserveY] = deriveReserve(tokenY, lbPair, this.program.programId);
    const [oracle] = deriveOracle(lbPair, this.program.programId);

    const activeBinArrayIndex = binIdToBinArrayIndex(activeId);
    const binArrayBitmapExtension = isOverflowDefaultBinArrayBitmap(activeBinArrayIndex)
      ? deriveBinArrayBitmapExtension(lbPair, this.program.programId)[0]
      : null;

    const ix = await this.program.methods
      .initializeLbPair(activeId.toNumber(), binStep.toNumber())
      .accounts({
        funder,
        lbPair,
        rent: SYSVAR_RENT_PUBKEY,
        reserveX,
        reserveY,
        binArrayBitmapExtension: null,
        tokenMintX: tokenX,
        tokenMintY: tokenY,
        tokenProgram: TOKEN_PROGRAM_ID,
        oracle,
        presetParameter,
        systemProgram: SystemProgram.programId,
        eventAuthority: this.getEventAuthority(),
        program: this.program.programId,
      })
      .instruction();

    return {
      ix,
      lbPair,
    };
  }

  async initializePositionAndAddLiquidityByStrategy(
    args: InitializePositionAndAddLiquidityByStrategyParams
  ): Promise<TransactionInstruction[]> {
    const { lbPair, totalXAmount, totalYAmount, positionPubKey, strategy, slippage, user } = args;

    const initializePositionIxs = await this.initializePosition({
      lbPair,
      positionPubKey,
      user,
      minBinId: strategy.minBinId,
      maxBinId: strategy.maxBinId,
    });

    const addLiquidityIxs = await this.addLiquidityByStrategy(args);

    return [...initializePositionIxs, ...addLiquidityIxs];
  }

  async initializePosition(args: InitializePositionParams): Promise<TransactionInstruction[]> {
    const { lbPair, positionPubKey, user, minBinId, maxBinId } = args;

    const ixs: TransactionInstruction[] = [];

    const lowerBinArrayIndex = binIdToBinArrayIndex(new BN(minBinId));

    const upperBinArrayIndex = BN.max(
      lowerBinArrayIndex.add(new BN(1)),
      binIdToBinArrayIndex(new BN(maxBinId))
    );

    const createBinArrayIxs = await this.createBinArraysIfNeeded(
      lbPair,
      upperBinArrayIndex,
      lowerBinArrayIndex,
      user
    );

    ixs.push(...createBinArrayIxs);

    const initializePositionIx = await this.program.methods
      .initializePosition(minBinId, maxBinId - minBinId + 1)
      .accounts({
        payer: user,
        position: positionPubKey,
        lbPair,
        owner: user,
        systemProgram: SystemProgram.programId,
        rent: SYSVAR_RENT_PUBKEY,
        eventAuthority: this.getEventAuthority(),
        program: this.program.programId,
      })
      .instruction();

    ixs.push(initializePositionIx);
    return ixs;
  }

  async addLiquidityByStrategy(
    args: AddLiquidityByStrategyParams
  ): Promise<TransactionInstruction[]> {
    const { lbPair, totalXAmount, totalYAmount, positionPubKey, strategy, slippage, user } = args;

    const { reserveX, reserveY, tokenXMint, tokenYMint, binStep, activeId } =
      await this.program.account.lbPair.fetch(lbPair);

    const { maxBinId, minBinId } = strategy;

    const maxActiveBinSlippage = slippage
      ? Math.ceil(slippage / (binStep / 100))
      : MAX_ACTIVE_BIN_SLIPPAGE;

    const ixs = [];

    const lowerBinArrayIndex = binIdToBinArrayIndex(new BN(minBinId));
    const [binArrayLower] = deriveBinArray(lbPair, lowerBinArrayIndex, METEORA_CLMM_PROGRAM_ID);

    const upperBinArrayIndex = BN.max(
      lowerBinArrayIndex.add(new BN(1)),
      binIdToBinArrayIndex(new BN(maxBinId))
    );
    const [binArrayUpper] = deriveBinArray(lbPair, upperBinArrayIndex, METEORA_CLMM_PROGRAM_ID);

    const [
      { ataPubKey: userTokenX, ix: createPayerTokenXIx },
      { ataPubKey: userTokenY, ix: createPayerTokenYIx },
    ] = await Promise.all([
      getOrCreateATAInstruction(this.program.provider.connection, tokenXMint, user),
      getOrCreateATAInstruction(this.program.provider.connection, tokenYMint, user),
    ]);
    createPayerTokenXIx && ixs.push(createPayerTokenXIx);
    createPayerTokenYIx && ixs.push(createPayerTokenYIx);

    const minBinArrayIndex = binIdToBinArrayIndex(new BN(minBinId));
    const maxBinArrayIndex = binIdToBinArrayIndex(new BN(maxBinId));

    const useExtension =
      isOverflowDefaultBinArrayBitmap(minBinArrayIndex) ||
      isOverflowDefaultBinArrayBitmap(maxBinArrayIndex);

    const binArrayBitmapExtension = useExtension
      ? deriveBinArrayBitmapExtension(lbPair, this.program.programId)[0]
      : null;

    const liquidityParams: LiquidityParameterByStrategy = {
      amountX: totalXAmount,
      amountY: totalYAmount,
      activeId,
      maxActiveBinSlippage,
      strategyParameters: toStrategyParameters(strategy),
    };

    const addLiquidityAccounts = {
      position: positionPubKey,
      lbPair,
      userTokenX,
      userTokenY,
      reserveX: reserveX,
      reserveY: reserveY,
      tokenXMint,
      tokenYMint,
      binArrayLower,
      binArrayUpper,
      binArrayBitmapExtension,
      sender: user,
      tokenXProgram: TOKEN_PROGRAM_ID,
      tokenYProgram: TOKEN_PROGRAM_ID,
    };

    const createPositionTx = await this.program.methods
      .addLiquidityByStrategy(liquidityParams)
      .accounts(addLiquidityAccounts)
      .instruction();

    ixs.push(createPositionTx);

    return ixs;
  }

  async removeLiquidity(args: RemoveLiquidityParams): Promise<TransactionInstruction[]> {
    const { positionPubKey, user, binIds, bps } = args;

    const { lbPair, lowerBinId, owner, feeOwner } = await this.program.account.positionV2.fetch(
      positionPubKey
    );

    const { reserveX, reserveY, tokenXMint, tokenYMint } = await this.program.account.lbPair.fetch(
      lbPair
    );

    const lowerBinArrayIndex = binIdToBinArrayIndex(new BN(lowerBinId));
    const upperBinArrayIndex = lowerBinArrayIndex.add(new BN(1));
    const [binArrayLower] = deriveBinArray(lbPair, lowerBinArrayIndex, this.program.programId);
    const [binArrayUpper] = deriveBinArray(lbPair, upperBinArrayIndex, this.program.programId);

    const walletToReceiveFee = feeOwner.equals(PublicKey.default) ? user : feeOwner;

    const ixs: TransactionInstruction[] = [];

    const [
      { ataPubKey: userTokenX, ix: createPayerTokenXIx },
      { ataPubKey: userTokenY, ix: createPayerTokenYIx },
      { ataPubKey: feeOwnerTokenX, ix: createFeeOwnerTokenXIx },
      { ataPubKey: feeOwnerTokenY, ix: createFeeOwnerTokenYIx },
    ] = await Promise.all([
      getOrCreateATAInstruction(this.program.provider.connection, tokenXMint, owner, user),
      getOrCreateATAInstruction(
        this.program.provider.connection,
        tokenYMint,
        walletToReceiveFee,
        user
      ),
      getOrCreateATAInstruction(
        this.program.provider.connection,
        tokenXMint,
        walletToReceiveFee,
        user
      ),
      getOrCreateATAInstruction(
        this.program.provider.connection,
        tokenYMint,
        walletToReceiveFee,
        user
      ),
    ]);

    createPayerTokenXIx && ixs.push(createPayerTokenXIx);
    createPayerTokenYIx && ixs.push(createPayerTokenYIx);

    if (!walletToReceiveFee.equals(owner)) {
      createFeeOwnerTokenXIx && ixs.push(createFeeOwnerTokenXIx);
      createFeeOwnerTokenYIx && ixs.push(createFeeOwnerTokenYIx);
    }

    const postInstructions: Array<TransactionInstruction> = [];

    // if (shouldClaimAndClose) {
    //   const claimSwapFeeIx = await program.methods
    //     .claimFee()
    //     .accounts({
    //       binArrayLower,
    //       binArrayUpper,
    //       lbPair: this.pubkey,
    //       sender: user,
    //       position: positionPubKey,
    //       reserveX,
    //       reserveY,
    //       tokenProgram: TOKEN_PROGRAM_ID,
    //       tokenXMint: tokenXMint,
    //       tokenYMint: tokenYMint,
    //       userTokenX: feeOwnerTokenX,
    //       userTokenY: feeOwnerTokenY,
    //     })
    //     .instruction();

    //   for (let i = 0; i < 2; i++) {
    //     const rewardInfo = this.lbPair.rewardInfos[i];
    //     if (!rewardInfo || rewardInfo.mint.equals(PublicKey.default)) continue;

    //     const { ataPubKey, ix: rewardAtaIx } = await getOrCreateATAInstruction(
    //       this.program.provider.connection,
    //       rewardInfo.mint,
    //       user
    //     );
    //     rewardAtaIx && preInstructions.push(rewardAtaIx);

    //     const claimRewardIx = await this.program.methods
    //       .claimReward(new BN(i))
    //       .accounts({
    //         lbPair: this.pubkey,
    //         sender: user,
    //         position,
    //         binArrayLower,
    //         binArrayUpper,
    //         rewardVault: rewardInfo.vault,
    //         rewardMint: rewardInfo.mint,
    //         tokenProgram: TOKEN_PROGRAM_ID,
    //         userTokenAccount: ataPubKey,
    //       })
    //       .instruction();
    //     secondTransactionsIx.push(claimRewardIx);
    //   }

    //   const closePositionIx = await this.program.methods
    //     .closePosition()
    //     .accounts({
    //       binArrayLower,
    //       binArrayUpper,
    //       rentReceiver: owner, // Must be position owner
    //       position,
    //       lbPair: this.pubkey,
    //       sender: user,
    //     })
    //     .instruction();
    //   if (secondTransactionsIx.length) {
    //     secondTransactionsIx.push(closePositionIx);
    //   } else {
    //     postInstructions.push(closePositionIx);
    //   }
    // }

    const minBinId = Math.min(...binIds);
    const maxBinId = Math.max(...binIds);

    const minBinArrayIndex = binIdToBinArrayIndex(new BN(minBinId));
    const maxBinArrayIndex = binIdToBinArrayIndex(new BN(maxBinId));

    const useExtension =
      isOverflowDefaultBinArrayBitmap(minBinArrayIndex) ||
      isOverflowDefaultBinArrayBitmap(maxBinArrayIndex);

    const binArrayBitmapExtension = useExtension
      ? deriveBinArrayBitmapExtension(lbPair, this.program.programId)[0]
      : null;

    const removeLiquidityTx = await this.program.methods
      .removeLiquidityByRange(minBinId, maxBinId, bps)
      .accounts({
        position: positionPubKey,
        lbPair,
        userTokenX,
        userTokenY,
        reserveX,
        reserveY,
        tokenXMint,
        tokenYMint,
        binArrayLower,
        binArrayUpper,
        binArrayBitmapExtension,
        tokenXProgram: TOKEN_PROGRAM_ID,
        tokenYProgram: TOKEN_PROGRAM_ID,
        sender: user,
      })
      .instruction();

    ixs.push(removeLiquidityTx);

    return ixs;
  }

  async claimSwapFee(args: ClaimFeeParams): Promise<TransactionInstruction[]> {
    const { positionPubKey, user } = args;

    const ixs: TransactionInstruction[] = [];

    const { lbPair, lowerBinId, owner, feeOwner } = await this.program.account.positionV2.fetch(
      positionPubKey
    );

    const { reserveX, reserveY, tokenXMint, tokenYMint } = await this.program.account.lbPair.fetch(
      lbPair
    );

    const lowerBinArrayIndex = binIdToBinArrayIndex(new BN(lowerBinId));
    const upperBinArrayIndex = lowerBinArrayIndex.add(new BN(1));
    const [binArrayLower] = deriveBinArray(lbPair, lowerBinArrayIndex, this.program.programId);
    const [binArrayUpper] = deriveBinArray(lbPair, upperBinArrayIndex, this.program.programId);

    const walletToReceiveFee = feeOwner.equals(PublicKey.default) ? user : feeOwner;

    const [
      { ataPubKey: feeOwnerTokenX, ix: createFeeOwnerTokenXIx },
      { ataPubKey: feeOwnerTokenY, ix: createFeeOwnerTokenYIx },
    ] = await Promise.all([
      getOrCreateATAInstruction(
        this.program.provider.connection,
        tokenXMint,
        walletToReceiveFee,
        user
      ),
      getOrCreateATAInstruction(
        this.program.provider.connection,
        tokenYMint,
        walletToReceiveFee,
        user
      ),
    ]);

    createFeeOwnerTokenXIx && ixs.push(createFeeOwnerTokenXIx);
    createFeeOwnerTokenYIx && ixs.push(createFeeOwnerTokenYIx);

    const claimSwapFeeIx = await this.program.methods
      .claimFee()
      .accounts({
        binArrayLower,
        binArrayUpper,
        lbPair,
        sender: user,
        position: positionPubKey,
        reserveX,
        reserveY,
        tokenProgram: TOKEN_PROGRAM_ID,
        tokenXMint: tokenXMint,
        tokenYMint: tokenYMint,
        userTokenX: feeOwnerTokenX,
        userTokenY: feeOwnerTokenY,
      })
      .instruction();

    ixs.push(claimSwapFeeIx);

    return ixs;
  }

  async claimRewards(args: ClaimRewardsParams): Promise<TransactionInstruction[]> {
    const { positionPubKey, user } = args;

    const ixs: TransactionInstruction[] = [];

    const { lbPair, lowerBinId, owner, feeOwner } = await this.program.account.positionV2.fetch(
      positionPubKey
    );

    const { rewardInfos } = await this.program.account.lbPair.fetch(lbPair);

    const lowerBinArrayIndex = binIdToBinArrayIndex(new BN(lowerBinId));
    const upperBinArrayIndex = lowerBinArrayIndex.add(new BN(1));
    const [binArrayLower] = deriveBinArray(lbPair, lowerBinArrayIndex, this.program.programId);
    const [binArrayUpper] = deriveBinArray(lbPair, upperBinArrayIndex, this.program.programId);

    for (let i = 0; i < 2; i++) {
      const rewardInfo = rewardInfos[i];
      if (!rewardInfo || rewardInfo.mint.equals(PublicKey.default)) continue;

      const { ataPubKey, ix: rewardAtaIx } = await getOrCreateATAInstruction(
        this.program.provider.connection,
        rewardInfo.mint,
        user
      );
      rewardAtaIx && ixs.push(rewardAtaIx);

      const claimRewardIx = await this.program.methods
        .claimReward(new BN(i))
        .accounts({
          lbPair,
          sender: user,
          position: positionPubKey,
          binArrayLower,
          binArrayUpper,
          rewardVault: rewardInfo.vault,
          rewardMint: rewardInfo.mint,
          tokenProgram: TOKEN_PROGRAM_ID,
          userTokenAccount: ataPubKey,
        })
        .instruction();
      ixs.push(claimRewardIx);
    }

    return ixs;
  }

  async closePosition(args: ClosePositionParams) {
    const { positionPubKey, user } = args;

    const ixs: TransactionInstruction[] = [];

    const { lbPair, lowerBinId, owner } = await this.program.account.positionV2.fetch(
      positionPubKey
    );

    const lowerBinArrayIndex = binIdToBinArrayIndex(new BN(lowerBinId));
    const upperBinArrayIndex = lowerBinArrayIndex.add(new BN(1));
    const [binArrayLower] = deriveBinArray(lbPair, lowerBinArrayIndex, this.program.programId);
    const [binArrayUpper] = deriveBinArray(lbPair, upperBinArrayIndex, this.program.programId);

    const closePositionIx = await this.program.methods
      .closePosition()
      .accounts({
        binArrayLower,
        binArrayUpper,
        rentReceiver: owner, // Must be position owner
        position: positionPubKey,
        lbPair,
        sender: user,
      })
      .instruction();

    ixs.push(closePositionIx);

    return ixs;
  }

  async createBinArraysIfNeeded(
    poolId: PublicKey,
    upperBinArrayIndex: BN,
    lowerBinArrayIndex: BN,
    funder: PublicKey
  ): Promise<TransactionInstruction[]> {
    const ixs: TransactionInstruction[] = [];
    console.log(`poolId: ${poolId.toBase58()}`);
    const binArrayIndexes: BN[] = Array.from(
      { length: upperBinArrayIndex.sub(lowerBinArrayIndex).toNumber() + 1 },
      (_, index) => index + lowerBinArrayIndex.toNumber()
    ).map((idx) => new BN(idx));
    for (const idx of binArrayIndexes) {
      const [binArray] = deriveBinArray(poolId, idx, METEORA_CLMM_PROGRAM_ID);
      try {
        const binArrayAccount = await this.program.provider.connection.getAccountInfo(binArray);
      } catch (e) {
        console.error(`Error::createBinArraysIfNeeded: ${e}`);
        ixs.push(
          await this.program.methods
            .initializeBinArray(idx)
            .accounts({
              binArray,
              funder,
              lbPair: poolId,
              systemProgram: SystemProgram.programId,
              eventAuthority: this.getEventAuthority(),
              program: this.program.programId,
            })
            .instruction()
        );
      }
    }
    return ixs;
  }

  getEventAuthority(): PublicKey {
    return PublicKey.findProgramAddressSync(
      [Buffer.from("__event_authority")],
      this.program.programId
    )[0];
  }
}

export interface CreateLbPairParams {
  funder: PublicKey;
  tokenX: PublicKey;
  tokenY: PublicKey;
  binStep: BN;
  baseFactor: BN;
  presetParameter: PublicKey;
  activeId: BN;
}

export interface InitializePositionAndAddLiquidityByStrategyParams {
  lbPair: PublicKey;
  totalXAmount: BN;
  totalYAmount: BN;
  positionPubKey: PublicKey;
  strategy: StrategyParameters;
  user: PublicKey;
  slippage: number;
}

export interface AddLiquidityByStrategyParams {
  lbPair: PublicKey;
  totalXAmount: BN;
  totalYAmount: BN;
  positionPubKey: PublicKey;
  strategy: StrategyParameters;
  slippage: number;
  user: PublicKey;
}

export interface InitializePositionParams {
  lbPair: PublicKey;
  positionPubKey: PublicKey;
  user: PublicKey;
  minBinId: number;
  maxBinId: number;
}

export interface RemoveLiquidityParams {
  positionPubKey: PublicKey;
  user: PublicKey;
  binIds: number[];
  bps: number;
}

export interface ClaimFeeParams {
  positionPubKey: PublicKey;
  user: PublicKey;
}

export interface ClaimRewardsParams {
  positionPubKey: PublicKey;
  user: PublicKey;
}

export interface ClosePositionParams {
  positionPubKey: PublicKey;
  user: PublicKey;
}
