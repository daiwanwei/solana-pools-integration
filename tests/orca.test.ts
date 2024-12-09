import {
  ORCA_WHIRLPOOL_PROGRAM_ID,
  PDAUtil,
  SwapUtils,
  WhirlpoolContext,
  WhirlpoolIx,
  WhirlpoolAccountFetcherInterface,
} from "@orca-so/whirlpools-sdk";
import { TestFixture } from "./fixtures";
import { getTokenBalances } from "./utils/token";
import BN from "bn.js";
import { startWithPrograms } from "./utils/bankrun";
import { BankrunProvider } from "anchor-bankrun";
import { BanksClient, ProgramTestContext } from "solana-bankrun";
import { Connection } from "@solana/web3.js";

describe("orca", () => {
  let context: ProgramTestContext;
  let client: BanksClient;
  let provider: BankrunProvider;
  let testFixture: TestFixture;
  let whirlpoolCtx: WhirlpoolContext;
  let fetcher: WhirlpoolAccountFetcherInterface;
  let connection: Connection;

  before(async () => {
    context = await startWithPrograms(".");
    client = context.banksClient;
    provider = new BankrunProvider(context);
    connection = provider.connection;
    testFixture = new TestFixture(context);
    await testFixture.init();
    whirlpoolCtx = WhirlpoolContext.from(
      provider.connection,
      provider.wallet,
      ORCA_WHIRLPOOL_PROGRAM_ID
    );
    fetcher = whirlpoolCtx.fetcher;
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
        userTokenAAccount
      )}`
    );
    console.log(
      `Your TokenB Balance: ${await getTokenBalances(
        connection,
        poolInfo.tokenBMint,
        userTokenBAccount
      )}`
    );

    const a_to_b = true;
    const sqrt_price_limit = SwapUtils.getDefaultSqrtPriceLimit(a_to_b);

    const tickarrays = SwapUtils.getTickArrayPublicKeys(
      poolData.tickCurrentIndex,
      poolData.tickSpacing,
      a_to_b,
      ORCA_WHIRLPOOL_PROGRAM_ID,
      poolInfo.whirlpoolPda.publicKey
    );

    const oracle = PDAUtil.getOracle(
      ORCA_WHIRLPOOL_PROGRAM_ID,
      poolInfo.whirlpoolPda.publicKey
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

    await testFixture.prepareAndProcessTransaction(swap.instructions, userWallet.publicKey);
  });
});
