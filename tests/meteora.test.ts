import * as anchor from "@coral-xyz/anchor";
import { TransactionBuilder, Wallet, MathUtil } from "@orca-so/common-sdk";
import { TestFixture } from "./fixture";
import { getTokenBalances } from "./utils/token";
import { Keypair, PublicKey, sendAndConfirmTransaction } from "@solana/web3.js";
import BN from "bn.js";
import DLMM, { deriveLbPair2, StrategyType } from "@meteora-ag/dlmm";
import { deriveBinArrayBitmapExtension, derivePresetParameter2 } from "@meteora-ag/dlmm";

describe("meteora", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());

  const provider = anchor.getProvider() as anchor.AnchorProvider;
  const connection = provider.connection;
  const wallet = provider.wallet as Wallet;

  const testFixture = new TestFixture(anchor.getProvider() as anchor.AnchorProvider);

  before(async () => {
    await testFixture.init();
  });

  it("open position and increase liquidity", async () => {
    const user = testFixture.getUserInfo();

    const pool = await testFixture.getMeteoraPoolInfo();

    await testFixture.addMeteoraLiquidity(pool.dlmmPool, new BN(1000), user.wallet);
  });
});
