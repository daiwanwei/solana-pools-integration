import { TestFixture } from "./fixtures";
import BN from "bn.js";
import { startWithPrograms } from "./utils/bankrun";
import { BankrunProvider } from "anchor-bankrun";
import { BanksClient, ProgramTestContext } from "solana-bankrun";

describe("meteora", () => {
  let context: ProgramTestContext;
  let client: BanksClient;
  let provider: BankrunProvider;
  let testFixture: TestFixture;

  before(async () => {
    context = await startWithPrograms(".");
    client = context.banksClient;
    provider = new BankrunProvider(context);

    testFixture = new TestFixture(context);
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
    const { feeX, feeY } = await testFixture.getMeteoraPositionFee(position);
    console.log(`feeX: ${feeX.toString()}, feeY: ${feeY.toString()}`);

    await testFixture.removeMeteoraLiquidity(position, new BN(100 * 100), user.wallet);
  });
});
