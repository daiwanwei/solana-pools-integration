import * as anchor from "@coral-xyz/anchor";
import { TestFixture } from "./fixture";
import BN from "bn.js";

describe("meteora", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());

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
