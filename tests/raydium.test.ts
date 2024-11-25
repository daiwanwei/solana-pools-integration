import * as anchor from "@coral-xyz/anchor";
import Decimal from "decimal.js";
import BN from "bn.js";
import { TestFixture } from "./fixture";

describe("raydium", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());

  const provider = anchor.getProvider() as anchor.AnchorProvider;

  const testFixture = new TestFixture(anchor.getProvider() as anchor.AnchorProvider);

  before(async () => {
    await testFixture.init();
  });

  it("open position and increase/decrease liquidty", async () => {
    const user = testFixture.getUserInfo();
    const poolInfo = await testFixture.getRaydiumPoolInfo();

    const position = await testFixture.createRaydiumPoolPosition(
      new Decimal(5),
      new Decimal(10),
      user.wallet,
    );

    await sleep(1000);

    await testFixture.increaseRaydiumPoolLiquidity(position, new BN(1000), user.wallet);

    const { feeX, feeY } = await testFixture.getRaydiumPositionFee(poolInfo.clmmPool, position);

    console.log(`feeX: ${feeX.toString()}, feeY: ${feeY.toString()}`);

    await testFixture.decreaseRaydiumPoolLiquidity(position, new BN(1000), user.wallet);
  });
});

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
