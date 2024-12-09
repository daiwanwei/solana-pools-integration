import { MEMO_PROGRAM_ID } from "@solana/spl-memo";
import { ORCA_WHIRLPOOL_PROGRAM_ID, PDAUtil } from "@orca-so/whirlpools-sdk";
import {
  CLMM_PROGRAM_ID,
  getPdaProtocolPositionAddress,
  getPdaPersonalPositionAddress,
  TickUtils as RaydiumTickUtils,
  getPdaTickArrayAddress,
  getPdaMetadataKey,
} from "@raydium-io/raydium-sdk-v2";
import { prepareComputeUnitIx } from "./utils/instructions";
import {
  toStrategyParameters,
  StrategyType,
  binIdToBinArrayIndex,
  deriveBinArray,
} from "@meteora-ag/dlmm";

import { BankrunProvider } from "anchor-bankrun";
import { BanksClient, ProgramTestContext } from "solana-bankrun";

import { BN, Program } from "@coral-xyz/anchor";
import { Keypair, PublicKey } from "@solana/web3.js";
import { startWithPrograms } from "./utils/bankrun";

import IDL from "../target/idl/pools_integration.json";
import { PoolsIntegration } from "../target/types/pools_integration";
import { TestFixture } from "./fixtures";
import { METEORA_ADMIN_KEY, METEORA_CLMM_PROGRAM_ID } from "./constants";
import { getAssociatedTokenAddressSync, TOKEN_PROGRAM_ID } from "@solana/spl-token";

describe("pools-integration", () => {
  let context: ProgramTestContext;
  let client: BanksClient;
  let provider: BankrunProvider;
  let program: Program<PoolsIntegration>;
  let testFixture: TestFixture;

  before(async () => {
    context = await startWithPrograms(".");
    client = context.banksClient;
    provider = new BankrunProvider(context);

    testFixture = new TestFixture(context);
    await testFixture.init();

    program = new Program<PoolsIntegration>(IDL as PoolsIntegration, provider);
  });

  it("orca-proxy: open position and increase liquidity", async () => {
    const poolInfo = await testFixture.getOrcaPoolInfo();

    const {
      wallet: userWallet,
      tokenAAccount: userTokenAAccount,
      tokenBAccount: userTokenBAccount,
    } = await testFixture.getUserInfo();

    const owner = userWallet.publicKey;

    const positionMint = Keypair.generate();
    const positionTokenAccount = getAssociatedTokenAddressSync(positionMint.publicKey, owner);

    const position = PDAUtil.getPosition(ORCA_WHIRLPOOL_PROGRAM_ID, positionMint.publicKey);

    const openPositionIx = await program.methods
      .orcaProxyOpenPosition(22528, 33792, position.bump)
      .accounts({
        whirlpool: poolInfo.whirlpoolPda.publicKey,
        owner: owner,
        positionMint: positionMint.publicKey,
        position: position.publicKey,
        positionTokenAccount,
      })
      .signers([positionMint, userWallet])
      .instruction();

    const increaseLiquidityIx = await program.methods
      .orcaProxyIncreaseLiquidity(new BN(10), new BN(100_000_000), new BN(100_000_000))
      .accounts({
        whirlpool: poolInfo.whirlpoolPda.publicKey,
        positionAuthority: owner,
        positionMint: positionMint.publicKey,
        position: position.publicKey,
        positionTokenAccount,
        tokenOwnerAccountA: userTokenAAccount,
        tokenOwnerAccountB: userTokenBAccount,
        tokenVaultA: poolInfo.tokenAVault,
        tokenVaultB: poolInfo.tokenBVault,
        tickArrayLower: PDAUtil.getTickArray(
          ORCA_WHIRLPOOL_PROGRAM_ID,
          poolInfo.whirlpoolPda.publicKey,
          22528,
        ).publicKey,
        tickArrayUpper: PDAUtil.getTickArray(
          ORCA_WHIRLPOOL_PROGRAM_ID,
          poolInfo.whirlpoolPda.publicKey,
          33792,
        ).publicKey,
      })
      .instruction();

    await testFixture.prepareAndProcessTransaction(
      [openPositionIx, increaseLiquidityIx],
      userWallet.publicKey,
    );
  });

  it("raydium-proxy: open position and increase/decrease liquidity", async () => {
    const poolInfo = await testFixture.getRaydiumPoolInfo();

    const {
      wallet: userWallet,
      tokenAAccount: userTokenAAccount,
      tokenBAccount: userTokenBAccount,
    } = await testFixture.getUserInfo();

    const owner = userWallet.publicKey;

    const positionMint = Keypair.generate();
    const positionTokenAccount = getAssociatedTokenAddressSync(positionMint.publicKey, owner);

    const position = getPdaPersonalPositionAddress(CLMM_PROGRAM_ID, positionMint.publicKey);

    const tickLower = 10 * poolInfo.tickSpacing;
    const tickUpper = 20 * poolInfo.tickSpacing;

    const tickArrayLowerStartIndex = RaydiumTickUtils.getTickArrayStartIndexByTick(
      tickLower,
      poolInfo.tickSpacing,
    );
    const tickArrayUpperStartIndex = RaydiumTickUtils.getTickArrayStartIndexByTick(
      tickUpper,
      poolInfo.tickSpacing,
    );
    const tickArrayLower = getPdaTickArrayAddress(
      CLMM_PROGRAM_ID,
      poolInfo.clmmPool,
      tickArrayLowerStartIndex,
    );
    const tickArrayUpper = getPdaTickArrayAddress(
      CLMM_PROGRAM_ID,
      poolInfo.clmmPool,
      tickArrayUpperStartIndex,
    );

    const protocolPositionPda = getPdaProtocolPositionAddress(
      CLMM_PROGRAM_ID,
      poolInfo.clmmPool,
      tickLower,
      tickUpper,
    );

    const metadataAccount = getPdaMetadataKey(positionMint.publicKey);
    const openPositionIx = await program.methods
      .raydiumProxyOpenPosition(
        tickLower,
        tickUpper,
        tickArrayLowerStartIndex,
        tickArrayUpperStartIndex,
        new BN(10),
        new BN(100_000_000),
        new BN(100_000_000),
        false,
        null,
      )
      .accounts({
        clmmProgram: CLMM_PROGRAM_ID,
        payer: owner,
        positionNftOwner: owner,
        positionNftMint: positionMint.publicKey,
        positionNftAccount: positionTokenAccount,
        metadataAccount: metadataAccount.publicKey,
        poolState: poolInfo.clmmPool,
        protocolPosition: protocolPositionPda.publicKey,
        personalPosition: position.publicKey,
        tickArrayLower: tickArrayLower.publicKey,
        tickArrayUpper: tickArrayUpper.publicKey,
        tokenAccount0: userTokenAAccount,
        tokenAccount1: userTokenBAccount,
        tokenVault0: poolInfo.tokenAVault,
        tokenVault1: poolInfo.tokenBVault,
        vault0Mint: poolInfo.tokenAMint,
        vault1Mint: poolInfo.tokenBMint,
      })
      .signers([positionMint, userWallet])
      .instruction();

    const increaseLiquidityIx = await program.methods
      .raydiumProxyIncreaseLiquidity(new BN(10), new BN(100_000_000), new BN(100_000_000), false)
      .accounts({
        clmmProgram: CLMM_PROGRAM_ID,
        nftOwner: owner,
        nftAccount: positionTokenAccount,
        poolState: poolInfo.clmmPool,
        protocolPosition: protocolPositionPda.publicKey,
        personalPosition: position.publicKey,
        tickArrayLower: tickArrayLower.publicKey,
        tickArrayUpper: tickArrayUpper.publicKey,
        tokenAccount0: userTokenAAccount,
        tokenAccount1: userTokenBAccount,
        tokenVault0: poolInfo.tokenAVault,
        tokenVault1: poolInfo.tokenBVault,
        vault0Mint: poolInfo.tokenAMint,
        vault1Mint: poolInfo.tokenBMint,
      })
      .instruction();

    const logPositionFeeIx = await program.methods
      .raydiumLogPositionFee()
      .accounts({
        poolState: poolInfo.clmmPool,
        personalPosition: position.publicKey,
        tickArrayLower: tickArrayLower.publicKey,
        tickArrayUpper: tickArrayUpper.publicKey,
      })
      .instruction();

    const harvestIx = await program.methods
      .raydiumHarvest()
      .accounts({
        clmmProgram: CLMM_PROGRAM_ID,
        nftOwner: owner,
        nftAccount: positionTokenAccount,
        poolState: poolInfo.clmmPool,
        protocolPosition: protocolPositionPda.publicKey,
        personalPosition: position.publicKey,
        tickArrayLower: tickArrayLower.publicKey,
        tickArrayUpper: tickArrayUpper.publicKey,
        recipientTokenAccount0: userTokenAAccount,
        recipientTokenAccount1: userTokenBAccount,
        tokenVault0: poolInfo.tokenAVault,
        tokenVault1: poolInfo.tokenBVault,
        vault0Mint: poolInfo.tokenAMint,
        vault1Mint: poolInfo.tokenBMint,
        memoProgram: MEMO_PROGRAM_ID,
      })
      .instruction();

    const decreaseLiquidityIx = await program.methods
      .raydiumProxyDecreaseLiquidity(new BN(20), new BN(0), new BN(0))
      .accounts({
        clmmProgram: CLMM_PROGRAM_ID,
        nftOwner: owner,
        nftAccount: positionTokenAccount,
        poolState: poolInfo.clmmPool,
        protocolPosition: protocolPositionPda.publicKey,
        personalPosition: position.publicKey,
        tickArrayLower: tickArrayLower.publicKey,
        tickArrayUpper: tickArrayUpper.publicKey,
        recipientTokenAccount0: userTokenAAccount,
        recipientTokenAccount1: userTokenBAccount,
        tokenVault0: poolInfo.tokenAVault,
        tokenVault1: poolInfo.tokenBVault,
        vault0Mint: poolInfo.tokenAMint,
        vault1Mint: poolInfo.tokenBMint,
        memoProgram: MEMO_PROGRAM_ID,
      })
      .instruction();

    const closePositionIx = await program.methods
      .raydiumProxyClosePosition()
      .accounts({
        clmmProgram: CLMM_PROGRAM_ID,
        nftOwner: owner,
        positionNftMint: positionMint.publicKey,
        positionNftAccount: positionTokenAccount,
        personalPosition: position.publicKey,
      })
      .instruction();

    await testFixture.prepareAndProcessTransaction(
      [openPositionIx, increaseLiquidityIx, logPositionFeeIx],
      userWallet.publicKey,
    );

    await testFixture.prepareAndProcessTransaction(
      [harvestIx, decreaseLiquidityIx, closePositionIx],
      userWallet.publicKey,
    );
  });

  it("meteora-proxy: open position and increase liquidity", async () => {
    const poolInfo = await testFixture.getMeteoraPoolInfo();
    const dlmmPool = poolInfo.dlmmPool;

    const {
      wallet: userWallet,
      tokenAAccount: userTokenAAccount,
      tokenBAccount: userTokenBAccount,
    } = await testFixture.getUserInfo();

    const owner = userWallet.publicKey;

    const rewardIndex = new BN(0);
    const [rewardVault] = PublicKey.findProgramAddressSync(
      [dlmmPool.toBytes(), new Uint8Array(rewardIndex.toArrayLike(Buffer, "le", 8))],
      METEORA_CLMM_PROGRAM_ID,
    );
    const rewardMint = poolInfo.tokenAMint;

    const [eventAuthority] = PublicKey.findProgramAddressSync(
      [Buffer.from("__event_authority")],
      METEORA_CLMM_PROGRAM_ID,
    );

    const activeBin = await testFixture.getMeteoraActiveBin();

    const activeBinPricePerToken = await testFixture.getMeteoraActiveBinPrice(
      Number(activeBin.price),
    );

    const TOTAL_RANGE_INTERVAL = 10; // 10 bins on each side of the active bin
    const minBinId = activeBin.binId - TOTAL_RANGE_INTERVAL;
    const maxBinId = activeBin.binId + TOTAL_RANGE_INTERVAL;

    const lowerBinArrayIndex = binIdToBinArrayIndex(new BN(minBinId));
    const [binArrayLower] = deriveBinArray(dlmmPool, lowerBinArrayIndex, METEORA_CLMM_PROGRAM_ID);

    const upperBinArrayIndex = BN.max(
      lowerBinArrayIndex.add(new BN(1)),
      binIdToBinArrayIndex(new BN(maxBinId)),
    );
    const [binArrayUpper] = deriveBinArray(dlmmPool, upperBinArrayIndex, METEORA_CLMM_PROGRAM_ID);

    const initializeRewardIx = await program.methods
      .meteoraProxyInitializeReward(rewardIndex, new BN(100000), owner)
      .accounts({
        dlmmProgram: METEORA_CLMM_PROGRAM_ID,
        lbPair: dlmmPool,
        rewardVault,
        rewardMint,
        admin: METEORA_ADMIN_KEY,
        tokenProgram: TOKEN_PROGRAM_ID,
        eventAuthority,
      })
      .instruction();

    await testFixture.prepareAndProcessTransaction([initializeRewardIx], userWallet.publicKey);

    const position = Keypair.generate();

    const openPositionIx = await program.methods
      .meteoraProxyInitializePosition(minBinId, maxBinId - minBinId + 1)
      .accounts({
        dlmmProgram: METEORA_CLMM_PROGRAM_ID,
        payer: owner,
        position: position.publicKey,
        lbPair: dlmmPool,
        owner,
        eventAuthority,
      })
      .signers([position, userWallet])
      .instruction();

    const totalXAmount = new BN(10);
    const totalYAmount = totalXAmount.mul(new BN(Number(activeBinPricePerToken)));

    const strategyParameters = toStrategyParameters({
      maxBinId,
      minBinId,
      strategyType: StrategyType.SpotBalanced,
    });

    const liquidityParams = {
      amountX: totalXAmount,
      amountY: totalYAmount,
      activeId: activeBin.binId,
      maxActiveBinSlippage: 0,
      strategyParameters,
    };

    const increaseLiquidityIx = await program.methods
      .meteoraProxyAddLiquidity(liquidityParams)
      .accounts({
        dlmmProgram: METEORA_CLMM_PROGRAM_ID,
        position: position.publicKey,
        lbPair: dlmmPool,
        userTokenX: userTokenAAccount,
        userTokenY: userTokenBAccount,
        reserveX: poolInfo.tokenAVault,
        reserveY: poolInfo.tokenBVault,
        tokenXMint: poolInfo.tokenAMint,
        tokenYMint: poolInfo.tokenBMint,
        binArrayLower,
        binArrayUpper,
        binArrayBitmapExtension: null,
        sender: owner,
        tokenXProgram: TOKEN_PROGRAM_ID,
        tokenYProgram: TOKEN_PROGRAM_ID,
        eventAuthority,
      })
      .instruction();

    const logPositionFeeIx = await program.methods
      .meteoraLogPositionFee()
      .accounts({
        position: position.publicKey,
        lbPair: dlmmPool,
        binArrayLower,
        binArrayUpper,
      })
      .instruction();

    const claimFeeIx = await program.methods
      .meteoraProxyClaimFee()
      .accounts({
        dlmmProgram: METEORA_CLMM_PROGRAM_ID,
        position: position.publicKey,
        lbPair: dlmmPool,
        userTokenX: userTokenAAccount,
        userTokenY: userTokenBAccount,
        reserveX: poolInfo.tokenAVault,
        reserveY: poolInfo.tokenBVault,
        tokenXMint: poolInfo.tokenAMint,
        tokenYMint: poolInfo.tokenBMint,
        binArrayLower,
        binArrayUpper,
        sender: owner,
        tokenProgram: TOKEN_PROGRAM_ID,
        eventAuthority,
      })
      .instruction();

    const harvestIx = await program.methods
      .meteoraHarvest()
      .accounts({
        dlmmProgram: METEORA_CLMM_PROGRAM_ID,
        position: position.publicKey,
        lbPair: dlmmPool,
        userTokenX: userTokenAAccount,
        userTokenY: userTokenBAccount,
        reserveX: poolInfo.tokenAVault,
        reserveY: poolInfo.tokenBVault,
        tokenXMint: poolInfo.tokenAMint,
        tokenYMint: poolInfo.tokenBMint,
        binArrayLower,
        binArrayUpper,
        sender: owner,
        tokenProgram: TOKEN_PROGRAM_ID,
        eventAuthority,
      })
      .instruction();

    const removeLiquidityIx = await program.methods
      .meteoraProxyRemoveLiquidity(minBinId, maxBinId, 10000)
      .accounts({
        dlmmProgram: METEORA_CLMM_PROGRAM_ID,
        position: position.publicKey,
        lbPair: dlmmPool,
        userTokenX: userTokenAAccount,
        userTokenY: userTokenBAccount,
        reserveX: poolInfo.tokenAVault,
        reserveY: poolInfo.tokenBVault,
        tokenXMint: poolInfo.tokenAMint,
        tokenYMint: poolInfo.tokenBMint,
        binArrayLower,
        binArrayUpper,
        binArrayBitmapExtension: null,
        sender: owner,
        tokenXProgram: TOKEN_PROGRAM_ID,
        tokenYProgram: TOKEN_PROGRAM_ID,
        eventAuthority,
      })
      .instruction();

    const closePositionIx = await program.methods
      .meteoraProxyClosePosition()
      .accounts({
        dlmmProgram: METEORA_CLMM_PROGRAM_ID,
        position: position.publicKey,
        lbPair: dlmmPool,
        binArrayLower,
        binArrayUpper,
        sender: owner,
        rentReceiver: owner,
        eventAuthority,
      })
      .instruction();

    await testFixture.prepareAndProcessTransaction(
      [
        openPositionIx,
        increaseLiquidityIx,
        logPositionFeeIx,
        claimFeeIx,
        harvestIx,
        removeLiquidityIx,
        closePositionIx,
      ],
      userWallet.publicKey,
    );
  });
});
