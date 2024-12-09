import BN from "bn.js";
import { Tick } from "../types";
import { MathUtil } from "@raydium-io/raydium-sdk-v2";

export class PositionUtils {
  static getfeeGrowthInside(
    feeGrowthGlobalX64A: BN,
    feeGrowthGlobalX64B: BN,
    tickCurrent: number,
    tickLowerState: Tick,
    tickUpperState: Tick,
  ): { feeGrowthInsideX64A: BN; feeGrowthInsideBX64: BN } {
    let feeGrowthBelowX64A = new BN(0);
    let feeGrowthBelowX64B = new BN(0);
    if (tickCurrent >= tickLowerState.tick) {
      feeGrowthBelowX64A = tickLowerState.feeGrowthOutside0X64;
      feeGrowthBelowX64B = tickLowerState.feeGrowthOutside1X64;
    } else {
      feeGrowthBelowX64A = feeGrowthGlobalX64A.sub(tickLowerState.feeGrowthOutside0X64);
      feeGrowthBelowX64B = feeGrowthGlobalX64B.sub(tickLowerState.feeGrowthOutside1X64);
    }

    let feeGrowthAboveX64A = new BN(0);
    let feeGrowthAboveX64B = new BN(0);
    if (tickCurrent < tickUpperState.tick) {
      feeGrowthAboveX64A = tickUpperState.feeGrowthOutside0X64;
      feeGrowthAboveX64B = tickUpperState.feeGrowthOutside1X64;
    } else {
      feeGrowthAboveX64A = feeGrowthGlobalX64A.sub(tickUpperState.feeGrowthOutside0X64);
      feeGrowthAboveX64B = feeGrowthGlobalX64B.sub(tickUpperState.feeGrowthOutside1X64);
    }

    const feeGrowthInsideX64A = MathUtil.wrappingSubU128(
      MathUtil.wrappingSubU128(feeGrowthGlobalX64A, feeGrowthBelowX64A),
      feeGrowthAboveX64A,
    );
    const feeGrowthInsideBX64 = MathUtil.wrappingSubU128(
      MathUtil.wrappingSubU128(feeGrowthGlobalX64B, feeGrowthBelowX64B),
      feeGrowthAboveX64B,
    );
    return { feeGrowthInsideX64A, feeGrowthInsideBX64 };
  }

  static GetPositionFeesV2(
    liquidity: BN,
    feeGrowthInsideLastX64A: BN,
    feeGrowthInsideLastX64B: BN,
    tokenFeesOwedA: BN,
    tokenFeesOwedB: BN,
    feeGrowthGlobalX64A: BN,
    feeGrowthGlobalX64B: BN,
    tickCurrent: number,
    tickLowerState: Tick,
    tickUpperState: Tick,
  ): { tokenFeeAmountA: BN; tokenFeeAmountB: BN } {
    const { feeGrowthInsideX64A, feeGrowthInsideBX64 } = this.getfeeGrowthInside(
      feeGrowthGlobalX64A,
      feeGrowthGlobalX64B,
      tickCurrent,
      tickLowerState,
      tickUpperState,
    );
    console.log("feeGrowthInsideX64A", feeGrowthInsideX64A.toString());
    console.log("feeGrowthInsideBX64", feeGrowthInsideBX64.toString());
    console.log("feeGrowthInsideLastX64A", feeGrowthInsideLastX64A.toString());
    console.log("feeGrowthInsideLastX64B", feeGrowthInsideLastX64B.toString());

    const feeGrowthdeltaA = MathUtil.mulDivFloor(
      MathUtil.wrappingSubU128(feeGrowthInsideX64A, feeGrowthInsideLastX64A),
      liquidity,
      Q64,
    );
    const tokenFeeAmountA = tokenFeesOwedA.add(feeGrowthdeltaA);

    const feeGrowthdelta1 = MathUtil.mulDivFloor(
      MathUtil.wrappingSubU128(feeGrowthInsideBX64, feeGrowthInsideLastX64B),
      liquidity,
      Q64,
    );
    const tokenFeeAmountB = tokenFeesOwedB.add(feeGrowthdelta1);

    return { tokenFeeAmountA, tokenFeeAmountB };
  }
}

export const Q64 = new BN(1).shln(64);
