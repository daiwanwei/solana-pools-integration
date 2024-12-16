import { BankrunProvider } from "anchor-bankrun";
import { BanksClient, ProgramTestContext } from "solana-bankrun";
import { BN, Program } from "@coral-xyz/anchor";
import { Keypair, PublicKey, TransactionMessage, VersionedTransaction } from "@solana/web3.js";
import { TestFixture } from "./fixtures";
import IDL from "../target/idl/liquidity_proxy.json";
import { LiquidityProxy } from "../target/types/liquidity_proxy";
import { prepareTx, sendAndConfirm, startWithPrograms } from "./utils/bankrun";
import {
  CLMM_PROGRAM_ID,
  getPdaPersonalPositionAddress,
  getPdaTickArrayAddress,
  getPdaProtocolPositionAddress,
  getPdaMetadataKey,
  TickUtils as RaydiumTickUtils,
  MEMO_PROGRAM_ID,
} from "@raydium-io/raydium-sdk-v2";
import { getAssociatedTokenAddressSync } from "@solana/spl-token";
import {
  deriveRaydiumPositionVault,
  deriveRaydiumProtocolPosition,
  deriveRaydiumUserPosition,
} from "./utils/derive";

describe("liquidity-proxy", () => {
  let context: ProgramTestContext;
  let client: BanksClient;
  let provider: BankrunProvider;
  let program: Program<LiquidityProxy>;
  let testFixture: TestFixture;

  before(async () => {
    context = await startWithPrograms(".");
    client = context.banksClient;
    provider = new BankrunProvider(context);

    testFixture = new TestFixture(context);
    await testFixture.init();

    program = new Program<LiquidityProxy>(IDL as LiquidityProxy, provider);
  });

  it("raydium", async () => {
    const admin = provider.wallet.publicKey;
    const index = 0;
    const config = PublicKey.findProgramAddressSync(
      [Buffer.from("config"), new Uint8Array(new BN(0).toArrayLike(Buffer, "le", 2))],
      program.programId,
    )[0];
    await program.methods
      .initializeConfig(admin, 0)
      .accounts({
        payer: admin,
        config,
      })
      .rpc();

    const poolInfo = await testFixture.getRaydiumPoolInfo();

    const {
      wallet: userWallet,
      tokenAAccount: userTokenAAccount,
      tokenBAccount: userTokenBAccount,
    } = await testFixture.getUserInfo();

    const positionMint = Keypair.generate();

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

    const raydiumProtocolPosition = deriveRaydiumProtocolPosition(
      poolInfo.clmmPool,
      tickLower,
      tickUpper,
      program.programId,
    );

    const adminPositionPda = deriveRaydiumUserPosition(
      raydiumProtocolPosition,
      admin,
      program.programId,
    );

    const positionVault0Pda = deriveRaydiumPositionVault(
      raydiumProtocolPosition,
      poolInfo.tokenAMint,
      program.programId,
    );

    const positionVault1Pda = deriveRaydiumPositionVault(
      raydiumProtocolPosition,
      poolInfo.tokenBMint,
      program.programId,
    );

    const nftAccount = getAssociatedTokenAddressSync(
      positionMint.publicKey,
      raydiumProtocolPosition,
      true,
    );

    const openRaydiumPositionIx = await program.methods
      .openRaydiumPosition(
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
        signer: admin,
        config,
        raydiumProtocolPosition: raydiumProtocolPosition,
        raydiumUserPosition: adminPositionPda,
        positionVault0: positionVault0Pda,
        positionVault1: positionVault1Pda,
        clmmProgram: CLMM_PROGRAM_ID,
        positionNftMint: positionMint.publicKey,
        positionNftAccount: nftAccount,
        metadataAccount: metadataAccount.publicKey,
        poolState: poolInfo.clmmPool,
        protocolPosition: protocolPositionPda.publicKey,
        personalPosition: position.publicKey,
        tickArrayLower: tickArrayLower.publicKey,
        tickArrayUpper: tickArrayUpper.publicKey,
        tokenAccount0: getAssociatedTokenAddressSync(poolInfo.tokenAMint, admin),
        tokenAccount1: getAssociatedTokenAddressSync(poolInfo.tokenBMint, admin),
        tokenVault0: poolInfo.tokenAVault,
        tokenVault1: poolInfo.tokenBVault,
        vault0Mint: poolInfo.tokenAMint,
        vault1Mint: poolInfo.tokenBMint,
      })
      .signers([positionMint])
      .instruction();

    await sendAndConfirm(provider, await prepareTx(client, admin, [openRaydiumPositionIx]), [
      positionMint,
    ]);

    const userPositionPda = deriveRaydiumUserPosition(
      raydiumProtocolPosition,
      userWallet.publicKey,
      program.programId,
    );

    const increaseRaydiumLiquidityIx = await program.methods
      .increaseRaydiumLiquidity(
        userWallet.publicKey,
        new BN(100_000_000),
        new BN(100_000_000),
        new BN(100_000_000),
        false,
      )
      .accounts({
        signer: userWallet.publicKey,
        config,
        raydiumProtocolPosition: raydiumProtocolPosition,
        raydiumUserPosition: userPositionPda,
        positionVault0: positionVault0Pda,
        positionVault1: positionVault1Pda,
        clmmProgram: CLMM_PROGRAM_ID,
        nftAccount: nftAccount,
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
      .signers([userWallet])
      .instruction();

    await sendAndConfirm(
      provider,
      await prepareTx(client, userWallet.publicKey, [increaseRaydiumLiquidityIx]),
      [],
    );

    const harvestRaydiumPositionIx = await program.methods
      .harvestRaydiumPosition()
      .accounts({
        signer: userWallet.publicKey,
        config,
        raydiumProtocolPosition: raydiumProtocolPosition,
        raydiumUserPosition: userPositionPda,
        positionVault0: positionVault0Pda,
        positionVault1: positionVault1Pda,
        clmmProgram: CLMM_PROGRAM_ID,
        nftAccount: nftAccount,
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

    await sendAndConfirm(
      provider,
      await prepareTx(client, userWallet.publicKey, [harvestRaydiumPositionIx]),
      [],
    );

    const decreaseRaydiumLiquidityIx = await program.methods
      .decreaseRaydiumLiquidity(new BN(100_000_000), new BN(0), new BN(0))
      .accounts({
        signer: userWallet.publicKey,
        config,
        raydiumProtocolPosition: raydiumProtocolPosition,
        raydiumUserPosition: userPositionPda,
        positionVault0: positionVault0Pda,
        positionVault1: positionVault1Pda,
        clmmProgram: CLMM_PROGRAM_ID,
        nftAccount: nftAccount,
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

    await sendAndConfirm(
      provider,
      await prepareTx(client, userWallet.publicKey, [decreaseRaydiumLiquidityIx]),
      [],
    );
    const decreaseRaydiumLiquidityFromAdminIx = await program.methods
      .decreaseRaydiumLiquidity(new BN(10), new BN(0), new BN(0))
      .accounts({
        signer: admin,
        config,
        raydiumProtocolPosition: raydiumProtocolPosition,
        raydiumUserPosition: adminPositionPda,
        positionVault0: positionVault0Pda,
        positionVault1: positionVault1Pda,
        clmmProgram: CLMM_PROGRAM_ID,
        nftAccount: nftAccount,
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

    const closeRaydiumPositionIx = await program.methods
      .closeRaydiumPosition()
      .accounts({
        signer: admin,
        config,
        raydiumProtocolPosition: raydiumProtocolPosition,
        clmmProgram: CLMM_PROGRAM_ID,
        positionNftMint: positionMint.publicKey,
        positionNftAccount: nftAccount,
        personalPosition: position.publicKey,
      })
      .instruction();

    await sendAndConfirm(
      provider,
      await prepareTx(client, admin, [decreaseRaydiumLiquidityFromAdminIx, closeRaydiumPositionIx]),
      [],
    );
  });
});
