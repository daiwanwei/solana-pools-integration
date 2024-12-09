import BN from "bn.js";
import { TickUtils } from "./tick";
import {
  Connection,
  Keypair,
  PublicKey,
  SystemProgram,
  SYSVAR_RENT_PUBKEY,
  TransactionInstruction,
} from "@solana/web3.js";
import Decimal from "decimal.js";
import {
  ClmmInstrument,
  getPdaExBitmapAccount,
  getPdaMetadataKey,
  getPdaObservationAccount,
  getPdaPoolId,
  getPdaPersonalPositionAddress,
  getPdaPoolVaultId,
  getPdaProtocolPositionAddress,
  getPdaTickArrayAddress,
  MEMO_PROGRAM_ID,
  METADATA_PROGRAM_ID,
  PoolUtils,
  SqrtPriceMath,
} from "@raydium-io/raydium-sdk-v2";
import { CLMM_PROGRAM_ID } from "@raydium-io/raydium-sdk-v2";
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  getAssociatedTokenAddressSync,
  TOKEN_2022_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { getOrCreateATAInstruction } from "./helpers/token";
import { Program } from "@coral-xyz/anchor";
import { AmmV3 } from "./idls/raydium_clmm";
import { getTickState } from "./state";
export class Client {
  private program: Program<AmmV3>;
  private connection: Connection;

  constructor(program: Program<AmmV3>) {
    this.program = program;
    this.connection = program.provider.connection;
  }

  async createPool(
    ammConfigId: PublicKey,
    tokenMint0: PublicKey,
    tokenMint1: PublicKey,
    tokenDecimals0: number,
    tokenDecimals1: number,
    initialPrice: Decimal,
    user: PublicKey
  ): Promise<{
    ix: TransactionInstruction;
    poolId: PublicKey;
    observationId: PublicKey;
    mintA: PublicKey;
    mintB: PublicKey;
    mintADecimals: number;
    mintBDecimals: number;
    initPrice: Decimal;
  }> {
    const [mintA, mintADecimals, mintB, mintBDecimals, initPrice] = new BN(
      new PublicKey(tokenMint1.toBuffer()).toBuffer()
    ).lt(new BN(new PublicKey(tokenMint0.toBuffer()).toBuffer()))
      ? [tokenMint1, tokenDecimals1, tokenMint0, tokenDecimals0, new Decimal(1).div(initialPrice)]
      : [tokenMint0, tokenDecimals0, tokenMint1, tokenDecimals1, initialPrice];

    const initialPriceX64 = SqrtPriceMath.priceToSqrtPriceX64(
      initPrice,
      mintADecimals,
      mintBDecimals
    );

    const { publicKey: poolId } = getPdaPoolId(this.program.programId, ammConfigId, mintA, mintB);
    const { publicKey: observationId } = getPdaObservationAccount(this.program.programId, poolId);
    const { publicKey: mintAVault } = getPdaPoolVaultId(this.program.programId, poolId, mintA);
    const { publicKey: mintBVault } = getPdaPoolVaultId(this.program.programId, poolId, mintB);

    const ix = await this.program.methods
      .createPool(initialPriceX64, new BN(0))
      .accounts({
        poolCreator: user,
        ammConfig: ammConfigId,
        poolState: poolId,
        tokenMint0: mintA,
        tokenMint1: mintB,
        tokenVault0: mintAVault,
        tokenVault1: mintBVault,
        observationState: observationId,
        tokenProgram0: TOKEN_PROGRAM_ID,
        tokenProgram1: TOKEN_PROGRAM_ID,
        tickArrayBitmap: getPdaExBitmapAccount(this.program.programId, poolId).publicKey,
        systemProgram: SystemProgram.programId,
        rent: SYSVAR_RENT_PUBKEY,
      })
      .instruction();

    return {
      ix,
      poolId,
      observationId,
      mintA,
      mintB,
      mintADecimals,
      mintBDecimals,
      initPrice,
    };
  }

  async openPosition(
    poolId: PublicKey,
    liquidity: BN,
    amount0Max: BN,
    amount1Max: BN,
    lowerPrice: Decimal,
    upperPrice: Decimal,
    user: PublicKey,
    payer?: PublicKey
  ): Promise<{ ix: TransactionInstruction; nftMint: PublicKey; personalPosition: PublicKey }> {
    const { tokenMint0, tokenMint1, mintDecimals0, mintDecimals1, tickSpacing } =
      await this.program.account.poolState.fetch(poolId);

    payer = payer ?? user;

    const {
      tick: lowerTick,
      tickArrayStartIndex: tickArrayLowerStartIndex,
      tickArray: tickArrayLower,
    } = TickUtils.getTickArrayAddressAndStartIndexByPrice(
      poolId,
      lowerPrice,
      mintDecimals0,
      mintDecimals1,
      tickSpacing
    );

    const {
      tick: upperTick,
      tickArrayStartIndex: tickArrayUpperStartIndex,
      tickArray: tickArrayUpper,
    } = TickUtils.getTickArrayAddressAndStartIndexByPrice(
      poolId,
      upperPrice,
      mintDecimals0,
      mintDecimals1,
      tickSpacing
    );

    const nftMint = Keypair.generate();
    const positionNftAccount = getAssociatedTokenAddressSync(nftMint.publicKey, user);
    const { publicKey: metadataAccount } = getPdaMetadataKey(nftMint.publicKey);
    const { publicKey: personalPosition } = getPdaPersonalPositionAddress(
      CLMM_PROGRAM_ID,
      nftMint.publicKey
    );
    const { publicKey: protocolPosition } = getPdaProtocolPositionAddress(
      CLMM_PROGRAM_ID,
      poolId,
      lowerTick,
      upperTick
    );

    const tokenAccountA = getAssociatedTokenAddressSync(tokenMint0, user);
    const tokenAccountB = getAssociatedTokenAddressSync(tokenMint1, user);

    const tokenAVault = getPdaPoolVaultId(CLMM_PROGRAM_ID, poolId, tokenMint0).publicKey;
    const tokenBVault = getPdaPoolVaultId(CLMM_PROGRAM_ID, poolId, tokenMint1).publicKey;

    const remainingAccounts = PoolUtils.isOverflowDefaultTickarrayBitmap(tickSpacing, [
      tickArrayLowerStartIndex,
      tickArrayUpperStartIndex,
    ])
      ? [
          {
            pubkey: getPdaExBitmapAccount(CLMM_PROGRAM_ID, poolId).publicKey,
            isSigner: false,
            isWritable: true,
          },
        ]
      : [];

    const ix = await this.program.methods
      .openPositionV2(
        lowerTick,
        upperTick,
        tickArrayLowerStartIndex,
        tickArrayUpperStartIndex,
        liquidity,
        amount0Max,
        amount1Max,
        false,
        false
      )
      .accounts({
        payer,
        poolState: poolId,
        positionNftOwner: user,
        positionNftMint: nftMint.publicKey,
        positionNftAccount,
        metadataAccount,
        protocolPosition,
        tickArrayLower,
        tickArrayUpper,
        personalPosition,
        tokenAccount0: tokenAccountA,
        tokenAccount1: tokenAccountB,
        tokenVault0: tokenAVault,
        tokenVault1: tokenBVault,
        vault0Mint: tokenMint0,
        vault1Mint: tokenMint1,
        rent: SYSVAR_RENT_PUBKEY,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        metadataProgram: METADATA_PROGRAM_ID,
        tokenProgram2022: TOKEN_2022_PROGRAM_ID,
      })
      .remainingAccounts(remainingAccounts)
      .instruction();

    return {
      ix,
      nftMint: nftMint.publicKey,
      personalPosition,
    };
  }

  async increasePosition(
    poolId: PublicKey,
    user: PublicKey,
    nftMint: PublicKey,
    liquidity: BN,
    amountMaxA: BN,
    amountMaxB: BN,
    payer?: PublicKey
  ): Promise<TransactionInstruction[]> {
    const ixs = [];

    payer = payer ?? user;

    const { tokenMint0, tokenMint1, mintDecimals0, mintDecimals1, tickSpacing } =
      await this.program.account.poolState.fetch(poolId);
    const { publicKey: personalPosition } = getPdaPersonalPositionAddress(CLMM_PROGRAM_ID, nftMint);
    const { tickLowerIndex, tickUpperIndex } =
      await this.program.account.personalPositionState.fetch(personalPosition);

    const { ataPubKey: ownerTokenAccountA, ix: tokenAccountAInstruction } =
      await getOrCreateATAInstruction(this.connection, tokenMint0, user);
    const { ataPubKey: ownerTokenAccountB, ix: tokenAccountBInstruction } =
      await getOrCreateATAInstruction(this.connection, tokenMint1, user);

    if (tokenAccountAInstruction) ixs.push(tokenAccountAInstruction);
    if (tokenAccountBInstruction) ixs.push(tokenAccountBInstruction);

    const { tickArray: tickArrayLower, tickArrayStartIndex: tickArrayLowerStartIndex } =
      TickUtils.getTickArrayAddressAndStartIndex(poolId, tickLowerIndex, tickSpacing);

    const { tickArray: tickArrayUpper, tickArrayStartIndex: tickArrayUpperStartIndex } =
      TickUtils.getTickArrayAddressAndStartIndex(poolId, tickUpperIndex, tickSpacing);

    const positionNftAccount = getAssociatedTokenAddressSync(nftMint, user);

    const { publicKey: protocolPosition } = getPdaProtocolPositionAddress(
      CLMM_PROGRAM_ID,
      poolId,
      tickLowerIndex,
      tickUpperIndex
    );

    const tokenAVault = getPdaPoolVaultId(CLMM_PROGRAM_ID, poolId, tokenMint0).publicKey;
    const tokenBVault = getPdaPoolVaultId(CLMM_PROGRAM_ID, poolId, tokenMint1).publicKey;

    const remainingAccounts = PoolUtils.isOverflowDefaultTickarrayBitmap(tickSpacing, [
      tickArrayLowerStartIndex,
      tickArrayUpperStartIndex,
    ])
      ? [
          {
            pubkey: getPdaExBitmapAccount(CLMM_PROGRAM_ID, poolId).publicKey,
            isSigner: false,
            isWritable: true,
          },
        ]
      : [];

    const ix = await this.program.methods
      .increaseLiquidityV2(liquidity, amountMaxA, amountMaxB, false)
      .accounts({
        poolState: poolId,
        nftOwner: user,
        nftAccount: positionNftAccount,
        personalPosition,
        protocolPosition,
        tickArrayLower,
        tickArrayUpper,
        tokenAccount0: ownerTokenAccountA,
        tokenAccount1: ownerTokenAccountB,
        tokenVault0: tokenAVault,
        tokenVault1: tokenBVault,
        vault0Mint: tokenMint0,
        vault1Mint: tokenMint1,
        tokenProgram: TOKEN_PROGRAM_ID,
        tokenProgram2022: TOKEN_2022_PROGRAM_ID,
      })
      .remainingAccounts(remainingAccounts)
      .instruction();

    ixs.push(ix);

    return ixs;
  }

  async decreasePosition(
    poolId: PublicKey,
    user: PublicKey,
    nftMint: PublicKey,
    liquidity: BN,
    amountMinA: BN,
    amountMinB: BN
  ) {
    const ixs = [];
    const { tokenMint0, tokenMint1, mintDecimals0, mintDecimals1, tickSpacing, rewardInfos } =
      await this.program.account.poolState.fetch(poolId);
    const { publicKey: personalPosition } = getPdaPersonalPositionAddress(CLMM_PROGRAM_ID, nftMint);

    const { tickLowerIndex, tickUpperIndex } =
      await this.program.account.personalPositionState.fetch(personalPosition);
    const { ataPubKey: ownerTokenAccountA, ix: tokenAccountAInstruction } =
      await getOrCreateATAInstruction(this.connection, tokenMint0, user);
    const { ataPubKey: ownerTokenAccountB, ix: tokenAccountBInstruction } =
      await getOrCreateATAInstruction(this.connection, tokenMint1, user);

    if (tokenAccountAInstruction) ixs.push(tokenAccountAInstruction);
    if (tokenAccountBInstruction) ixs.push(tokenAccountBInstruction);

    const rewardAccounts: PublicKey[] = [];

    // TODO: add reward accounts
    // for (const itemReward of rewardInfos) {
    //   let ownerRewardAccount: PublicKey | undefined;

    //   if (itemReward.tokenMint === tokenMint0) ownerRewardAccount = ownerTokenAccountA;
    //   else if (itemReward.tokenMint === tokenMint1) ownerRewardAccount = ownerTokenAccountB;
    //   else {
    //     const { ataPubKey: ataRewardAccount, ix: tokenAccountRewardInstruction } =
    //       await getOrCreateATAInstruction(this.connection, itemReward.tokenMint, user);

    //     if (tokenAccountRewardInstruction) ixs.push(tokenAccountRewardInstruction);
    //   }
    // }

    const positionNftAccount = getAssociatedTokenAddressSync(nftMint, user);
    const { publicKey: protocolPosition } = getPdaProtocolPositionAddress(
      CLMM_PROGRAM_ID,
      poolId,
      tickLowerIndex,
      tickUpperIndex
    );

    const tokenAccountA = getAssociatedTokenAddressSync(tokenMint0, user);
    const tokenAccountB = getAssociatedTokenAddressSync(tokenMint1, user);

    const tokenAVault = getPdaPoolVaultId(CLMM_PROGRAM_ID, poolId, tokenMint0).publicKey;
    const tokenBVault = getPdaPoolVaultId(CLMM_PROGRAM_ID, poolId, tokenMint1).publicKey;

    const { tickArray: tickArrayLower, tickArrayStartIndex: tickArrayLowerStartIndex } =
      TickUtils.getTickArrayAddressAndStartIndex(poolId, tickLowerIndex, tickSpacing);

    const { tickArray: tickArrayUpper, tickArrayStartIndex: tickArrayUpperStartIndex } =
      TickUtils.getTickArrayAddressAndStartIndex(poolId, tickUpperIndex, tickSpacing);

    const remainingAccounts = PoolUtils.isOverflowDefaultTickarrayBitmap(tickSpacing, [
      tickArrayLowerStartIndex,
      tickArrayUpperStartIndex,
    ])
      ? [
          {
            pubkey: getPdaExBitmapAccount(CLMM_PROGRAM_ID, poolId).publicKey,
            isSigner: false,
            isWritable: true,
          },
        ]
      : [];

    const ix = await this.program.methods
      .decreaseLiquidityV2(liquidity, amountMinA, amountMinB)
      .accounts({
        poolState: poolId,
        nftOwner: user,
        nftAccount: positionNftAccount,
        personalPosition,
        protocolPosition,
        tickArrayLower,
        tickArrayUpper,
        recipientTokenAccount0: tokenAccountA,
        recipientTokenAccount1: tokenAccountB,
        tokenVault0: tokenAVault,
        tokenVault1: tokenBVault,
        vault0Mint: tokenMint0,
        vault1Mint: tokenMint1,
        tokenProgram: TOKEN_PROGRAM_ID,
        tokenProgram2022: TOKEN_2022_PROGRAM_ID,
        memoProgram: MEMO_PROGRAM_ID,
      })
      .remainingAccounts(remainingAccounts)
      .instruction();

    ixs.push(ix);

    return ixs;
  }

  async getTickState(poolId: PublicKey, tick: number, tickSpacing: number) {
    return await getTickState(this.program, poolId, tick, tickSpacing);
  }
}
