import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { PoolsIntegration } from "../target/types/pools_integration";
import { Keypair, PublicKey } from "@solana/web3.js";
import { ORCA_WHIRLPOOL_PROGRAM_ID, PDAUtil } from "@orca-so/whirlpools-sdk";
import { TransactionBuilder } from "@orca-so/common-sdk";
import {
  getAssociatedTokenAddressSync,
  TOKEN_2022_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { TestFixture } from "./fixture";
import BN from "bn.js";
import {
  CLMM_PROGRAM_ID,
  getPdaProtocolPositionAddress,
  getPdaPersonalPositionAddress,
  TickUtils as RaydiumTickUtils,
  getPdaTickArrayAddress,
  getPdaMetadataKey,
} from "@raydium-io/raydium-sdk-v2";
import { prepareComputeUnitIx } from "./utils/instructions";
import DLMM, {
  toStrategyParameters,
  StrategyType,
  binIdToBinArrayIndex,
  deriveBinArray,
} from "@meteora-ag/dlmm";
import { METEORA_CLMM_PROGRAM_ID } from "./constants";

describe("pools-integration", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace.PoolsIntegration as Program<PoolsIntegration>;

  const provider = anchor.getProvider() as anchor.AnchorProvider;
  const connection = provider.connection;

  const testFixture = new TestFixture(anchor.getProvider() as anchor.AnchorProvider);

  before(async () => {
    await testFixture.init();
  });

  xit("orca-proxy: open position and increase liquidity", async () => {
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

    const transaction = new TransactionBuilder(
      connection,
      provider.wallet,
      testFixture.getTxBuilderOpts(),
    )
      .addInstruction({
        instructions: [openPositionIx, increaseLiquidityIx],
        cleanupInstructions: [],
        signers: [positionMint, userWallet],
      })
      .addSigner(positionMint)
      .addSigner(userWallet);

    const sig = await transaction.buildAndExecute();

    await connection.confirmTransaction(sig);
  });

  xit("raydium-proxy: open position and increase liquidity", async () => {
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

    const transaction = new TransactionBuilder(
      connection,
      provider.wallet,
      testFixture.getTxBuilderOpts(),
    )
      .addInstruction({
        instructions: [
          ...prepareComputeUnitIx(100_000, 20_000_000),
          openPositionIx,
          increaseLiquidityIx,
        ],
        cleanupInstructions: [],
        signers: [positionMint, userWallet],
      })
      .addSigner(positionMint)
      .addSigner(userWallet);

    const sig = await transaction.buildAndExecute();

    await connection.confirmTransaction(sig);
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

    const activeBin = await testFixture.getMeteoraActiveBin();
    const TOTAL_RANGE_INTERVAL = 10; // 10 bins on each side of the active bin
    const minBinId = activeBin.binId - TOTAL_RANGE_INTERVAL;
    const maxBinId = activeBin.binId + TOTAL_RANGE_INTERVAL;

    const position = Keypair.generate();

    const [eventAuthority] = PublicKey.findProgramAddressSync(
      [Buffer.from("__event_authority")],
      METEORA_CLMM_PROGRAM_ID,
    );

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

    const activeBinPricePerToken = await testFixture.getMeteoraActiveBinPrice(
      Number(activeBin.price),
    );

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

    const lowerBinArrayIndex = binIdToBinArrayIndex(new BN(minBinId));
    const [binArrayLower] = deriveBinArray(dlmmPool, lowerBinArrayIndex, METEORA_CLMM_PROGRAM_ID);

    const upperBinArrayIndex = BN.max(
      lowerBinArrayIndex.add(new BN(1)),
      binIdToBinArrayIndex(new BN(maxBinId)),
    );
    const [binArrayUpper] = deriveBinArray(dlmmPool, upperBinArrayIndex, METEORA_CLMM_PROGRAM_ID);

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

    const transaction = new TransactionBuilder(
      connection,
      provider.wallet,
      testFixture.getTxBuilderOpts(),
    )
      .addInstruction({
        instructions: [
          ...prepareComputeUnitIx(100_000, 20_000_000),
          openPositionIx,
          increaseLiquidityIx,
        ],
        cleanupInstructions: [],
        signers: [position, userWallet],
      })
      .addSigner(position)
      .addSigner(userWallet);

    const sig = await transaction.buildAndExecute();

    await connection.confirmTransaction(sig);
  });
});
