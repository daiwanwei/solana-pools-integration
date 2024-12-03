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

  it("increase and decrease liquidity", async () => {
    const user = testFixture.getUserInfo();

    const pool = await testFixture.getMeteoraPoolInfo();

    const position = await testFixture.addMeteoraLiquidity(
      pool.dlmmPool,
      new BN(100000),
      user.wallet,
    );
    const { feeX, feeY } = await testFixture.getMeteoraPositionFee(
      pool.dlmmPool,
      position,
      user.wallet.publicKey,
    );
    console.log(`feeX: ${feeX.toString()}, feeY: ${feeY.toString()}`);

    await testFixture.removeMeteoraLiquidity(
      pool.dlmmPool,
      position,
      new BN(100 * 100),
      user.wallet,
    );
  });
});
