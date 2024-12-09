import {
  getPdaTickArrayAddress,
  TickMath,
  SqrtPriceMath,
  TickUtils as RaydiumTickUtils,
  CLMM_PROGRAM_ID,
  TICK_ARRAY_SIZE,
} from "@raydium-io/raydium-sdk-v2";
import { PublicKey } from "@solana/web3.js";
import { Decimal } from "decimal.js";

export class TickUtils {
  static getPriceAndTick({
    mintADecimals,
    mintBDecimals,
    tickSpacing,
    price,
    baseIn,
  }: {
    price: Decimal;
    baseIn: boolean;
    mintADecimals: number;
    mintBDecimals: number;
    tickSpacing: number;
  }): { tick: number; price: Decimal } {
    const _price = baseIn ? price : new Decimal(1).div(price);

    const tick = TickMath.getTickWithPriceAndTickspacing(
      _price,
      tickSpacing,
      mintADecimals,
      mintBDecimals,
    );
    const tickSqrtPriceX64 = SqrtPriceMath.getSqrtPriceX64FromTick(tick);
    const tickPrice = SqrtPriceMath.sqrtPriceX64ToPrice(
      tickSqrtPriceX64,
      mintADecimals,
      mintBDecimals,
    );

    return baseIn ? { tick, price: tickPrice } : { tick, price: new Decimal(1).div(tickPrice) };
  }

  static getTickArrayStartIndexByTick(tick: number, tickSpacing: number): number {
    return RaydiumTickUtils.getTickArrayStartIndexByTick(tick, tickSpacing);
  }

  static getTickArrayAddressAndStartIndexByPrice(
    poolId: PublicKey,
    price: Decimal,
    mintADecimals: number,
    mintBDecimals: number,
    tickSpacing: number,
  ): { tick: number; tickArrayStartIndex: number; tickArray: PublicKey } {
    const { tick } = TickUtils.getPriceAndTick({
      price,
      baseIn: true,
      mintADecimals,
      mintBDecimals,
      tickSpacing,
    });

    const tickArrayStartIndex = TickUtils.getTickArrayStartIndexByTick(tick, tickSpacing);

    const { publicKey: tickArray } = getPdaTickArrayAddress(
      CLMM_PROGRAM_ID,
      poolId,
      tickArrayStartIndex,
    );

    return { tick, tickArrayStartIndex, tickArray };
  }

  static getTickArrayAddressAndStartIndex(
    poolId: PublicKey,
    tick: number,
    tickSpacing: number,
  ): { tick: number; tickArrayStartIndex: number; tickArray: PublicKey } {
    const tickArrayStartIndex = TickUtils.getTickArrayStartIndexByTick(tick, tickSpacing);

    const { publicKey: tickArray } = getPdaTickArrayAddress(
      CLMM_PROGRAM_ID,
      poolId,
      tickArrayStartIndex,
    );

    return { tick, tickArrayStartIndex, tickArray };
  }

  static getTickOffsetInArray(tickIndex: number, tickSpacing: number): number {
    if (tickIndex % tickSpacing != 0) {
      throw new Error("tickIndex % tickSpacing not equal 0");
    }
    const startTickIndex = TickUtils.getTickArrayStartIndexByTick(tickIndex, tickSpacing);
    const offsetInArray = Math.floor((tickIndex - startTickIndex) / tickSpacing);
    if (offsetInArray < 0 || offsetInArray >= TICK_ARRAY_SIZE) {
      throw new Error("tick offset in array overflow");
    }
    return offsetInArray;
  }
}
