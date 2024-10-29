import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { PoolsIntegration } from "../target/types/pools_integration";
import { Keypair } from "@solana/web3.js";
import { ORCA_WHIRLPOOL_PROGRAM_ID, PDAUtil } from "@orca-so/whirlpools-sdk";
import { TransactionBuilder } from "@orca-so/common-sdk";
import { getAssociatedTokenAddressSync } from "@solana/spl-token";
import { TestFixture } from "./fixture";
import BN from "bn.js";

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
});
