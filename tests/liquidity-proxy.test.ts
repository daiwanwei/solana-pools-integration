import { BankrunProvider } from "anchor-bankrun";
import { BanksClient, ProgramTestContext } from "solana-bankrun";
import { BN, Program } from "@coral-xyz/anchor";
import { Keypair, PublicKey } from "@solana/web3.js";
import { TestFixture } from "./fixtures";
import IDL from "../target/idl/liquidity_proxy.json";
import { LiquidityProxy } from "../target/types/liquidity_proxy";
import { startWithPrograms } from "./utils/bankrun";
import {
  CLMM_PROGRAM_ID,
  getPdaPersonalPositionAddress,
  getPdaTickArrayAddress,
  getPdaProtocolPositionAddress,
  getPdaMetadataKey,
  TickUtils as RaydiumTickUtils,
} from "@raydium-io/raydium-sdk-v2";
import { getAssociatedTokenAddressSync } from "@solana/spl-token";
import { deriveRaydiumUserPosition } from "./utils/derive";

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

    const raydiumProtocolPosition = Keypair.generate();

    const adminPositionPda = deriveRaydiumUserPosition(
      raydiumProtocolPosition.publicKey,
      admin,
      program.programId,
    );

    await program.methods
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
        raydiumProtocolPosition: raydiumProtocolPosition.publicKey,
        raydiumUserPosition: adminPositionPda,
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
      .signers([raydiumProtocolPosition, positionMint, userWallet])
      .rpc();

    const userPositionPda = deriveRaydiumUserPosition(
      raydiumProtocolPosition.publicKey,
      userWallet.publicKey,
      program.programId,
    );

    await program.methods
      .increaseRaydiumLiquidity(new BN(10), new BN(100_000_000), new BN(100_000_000), false)
      .accounts({
        signer: userWallet.publicKey,
        config,
        raydiumProtocolPosition: raydiumProtocolPosition.publicKey,
        raydiumUserPosition: userPositionPda,
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
      .signers([userWallet])
      .rpc();
  });
});
