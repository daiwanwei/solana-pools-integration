import { BN, Program } from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";
import { TickUtils } from "./tick";
import { AmmV3 } from "./idls/raydium_clmm";

export async function getTickState(
  program: Program<AmmV3>,
  poolId: PublicKey,
  tick: number,
  tickSpacing: number,
): Promise<{
  tick: number;
  liquidityNet: BN;
  liquidityGross: BN;
  feeGrowthOutsideX64A: BN;
  feeGrowthOutsideX64B: BN;
  rewardGrowthsOutsideX64: BN[];
}> {
  const { tickArray: tickArrayAddress, tickArrayStartIndex } =
    TickUtils.getTickArrayAddressAndStartIndex(poolId, tick, tickSpacing);
  const tickArray = await program.account.tickArrayState.fetch(tickArrayAddress);
  return tickArray.ticks[TickUtils.getTickOffsetInArray(tick, tickSpacing)];
}
