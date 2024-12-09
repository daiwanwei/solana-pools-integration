import { TestFixture } from "./fixtures";
import BN from "bn.js";
import { startWithPrograms } from "./utils/bankrun";
import { BankrunProvider } from "anchor-bankrun";
import { BanksClient, ProgramTestContext } from "solana-bankrun";
import { Connection } from "@solana/web3.js";
import Decimal from "decimal.js";

describe("raydium", () => {
  let context: ProgramTestContext;
  let client: BanksClient;
  let provider: BankrunProvider;
  let testFixture: TestFixture;
  let connection: Connection;

  before(async () => {
    context = await startWithPrograms(".");
    client = context.banksClient;
    provider = new BankrunProvider(context);
    connection = provider.connection;
    testFixture = new TestFixture(context);
    await testFixture.init();
  });

  it("open position and increase/decrease liquidty", async () => {
    const user = testFixture.getUserInfo();
    const poolInfo = await testFixture.getRaydiumPoolInfo();

    const nftMint = await testFixture.createRaydiumPoolPosition(
      new Decimal(5),
      new Decimal(10),
      user.wallet,
    );

    await testFixture.increaseRaydiumPoolLiquidity(nftMint, new BN(1000), user.wallet);

    const { feeX, feeY } = await testFixture.getRaydiumPositionFee(poolInfo.clmmPool, nftMint);

    console.log(`feeX: ${feeX.toString()}, feeY: ${feeY.toString()}`);

    await testFixture.decreaseRaydiumPoolLiquidity(nftMint, new BN(1000), user.wallet);
  });
});
