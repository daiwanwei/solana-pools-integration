import * as anchor from "@coral-xyz/anchor";
import {
  ORCA_WHIRLPOOL_PROGRAM_ID,
  PDAUtil,
  SwapUtils,
  WhirlpoolContext,
  WhirlpoolIx,
} from "@orca-so/whirlpools-sdk";
import { TransactionBuilder, Wallet, MathUtil } from "@orca-so/common-sdk";
import { TestFixture } from "./fixture";
import { getTokenBalances } from "./utils/token";
import BN from "bn.js";

describe("orca", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());

  const provider = anchor.getProvider() as anchor.AnchorProvider;
  const connection = provider.connection;
  const wallet = provider.wallet as Wallet;

  const whirlpoolCtx = WhirlpoolContext.withProvider(provider, ORCA_WHIRLPOOL_PROGRAM_ID);
  const fetcher = whirlpoolCtx.fetcher;

  const testFixture = new TestFixture(anchor.getProvider() as anchor.AnchorProvider, whirlpoolCtx);

  before(async () => {
    await testFixture.init();
  });

  it("open position and increase liquidity", async () => {
    const positionMint = await testFixture.openOrcaPosition(22528, 33792);
    await testFixture.increaseOrcaPoolLiquidity(positionMint, 22528, 33792, new BN(1000));
  });

  it("swap", async () => {
    const poolInfo = await testFixture.getOrcaPoolInfo();

    const poolData = await fetcher.getPool(poolInfo.whirlpoolPda.publicKey);

    const {
      wallet: userWallet,
      tokenAAccount: userTokenAAccount,
      tokenBAccount: userTokenBAccount,
    } = await testFixture.getUserInfo();

    console.log(
      `Your TokenA Balance: ${await getTokenBalances(
        connection,
        poolInfo.tokenAMint,
        userTokenAAccount,
      )}`,
    );
    console.log(
      `Your TokenB Balance: ${await getTokenBalances(
        connection,
        poolInfo.tokenBMint,
        userTokenBAccount,
      )}`,
    );

    const a_to_b = true;
    const sqrt_price_limit = SwapUtils.getDefaultSqrtPriceLimit(a_to_b);

    const tickarrays = SwapUtils.getTickArrayPublicKeys(
      poolData.tickCurrentIndex,
      poolData.tickSpacing,
      a_to_b,
      ORCA_WHIRLPOOL_PROGRAM_ID,
      poolInfo.whirlpoolPda.publicKey,
    );

    const oracle = PDAUtil.getOracle(
      ORCA_WHIRLPOOL_PROGRAM_ID,
      poolInfo.whirlpoolPda.publicKey,
    ).publicKey;

    const swap = WhirlpoolIx.swapIx(whirlpoolCtx.program, {
      amount: new BN(1),
      otherAmountThreshold: new BN(0),
      sqrtPriceLimit: sqrt_price_limit,
      amountSpecifiedIsInput: true,
      aToB: true,
      whirlpool: poolInfo.whirlpoolPda.publicKey,
      tokenAuthority: userWallet.publicKey,
      tokenOwnerAccountA: userTokenAAccount,
      tokenVaultA: poolInfo.tokenAVault,
      tokenOwnerAccountB: userTokenBAccount,
      tokenVaultB: poolInfo.tokenBVault,
      tickArray0: tickarrays[0],
      tickArray1: tickarrays[1],
      tickArray2: tickarrays[2],
      oracle,
    });

    const transaction = new TransactionBuilder(
      connection,
      wallet,
      testFixture.getTxBuilderOpts(),
    ).addInstruction({ instructions: swap.instructions, cleanupInstructions: [], signers: [] });

    transaction.addSigner(userWallet);

    const signature = await transaction.buildAndExecute();
    const res = await connection.confirmTransaction(signature);

    console.log(
      `Your TokenA Balance: ${await getTokenBalances(
        connection,
        poolInfo.tokenAMint,
        userTokenAAccount,
      )}`,
    );
    console.log(
      `Your TokenB Balance: ${await getTokenBalances(
        connection,
        poolInfo.tokenBMint,
        userTokenBAccount,
      )}`,
    );
  });
});
