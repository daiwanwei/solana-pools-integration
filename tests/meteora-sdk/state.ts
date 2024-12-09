import { Program } from "@coral-xyz/anchor";
import { MeteoraDlmm } from "./idls/meteora_dlmm";
import { BinArray, BinLiquidity, Bin } from "./types";
import { PublicKey } from "@solana/web3.js";
import {
  binIdToBinArrayIndex,
  getBinArrayLowerUpperBinId,
  getBinFromBinArray,
} from "./helpers/binArray";
import { deriveBinArray } from "./helpers/derive";
import { getPriceOfBinByBinId } from "./helpers/weight";
import Decimal from "decimal.js";
import { METEORA_CLMM_PROGRAM_ID } from "../constants";
import { mulShr, Rounding } from "./helpers/math";
import { SCALE_OFFSET } from "./constants";
import BN from "bn.js";

export async function getActiveBin(
  program: Program<MeteoraDlmm>,
  pool: PublicKey,
  baseTokenDecimal: number,
  quoteTokenDecimal: number,
  binStep: number,
) {
  const { activeId } = await program.account.lbPair.fetch(pool);

  const [activeBinState] = await getBins(
    program,
    pool,
    activeId,
    activeId,
    baseTokenDecimal,
    quoteTokenDecimal,
    binStep,
  );
  return activeBinState;
}

export async function getBins(
  program: Program<MeteoraDlmm>,
  lbPairPubKey: PublicKey,
  lowerBinId: number,
  upperBinId: number,
  baseTokenDecimal: number,
  quoteTokenDecimal: number,
  binStep: number,
  lowerBinArrays?: BinArray,
  upperBinArrays?: BinArray,
): Promise<BinLiquidity[]> {
  const lowerBinArrayIndex = binIdToBinArrayIndex(new BN(lowerBinId));
  const upperBinArrayIndex = binIdToBinArrayIndex(new BN(upperBinId));

  let bins: BinLiquidity[] = [];
  if (lowerBinArrayIndex.eq(upperBinArrayIndex)) {
    const [binArrayPubKey] = deriveBinArray(
      lbPairPubKey,
      lowerBinArrayIndex,
      METEORA_CLMM_PROGRAM_ID,
    );
    const binArray =
      lowerBinArrays ??
      (await program.account.binArray.fetch(binArrayPubKey).catch(() => {
        const [lowerBinId, upperBinId] = getBinArrayLowerUpperBinId(lowerBinArrayIndex);

        const binArrayBins: Bin[] = [];
        for (let i = lowerBinId.toNumber(); i <= upperBinId.toNumber(); i++) {
          binArrayBins.push({
            amountX: new BN(0),
            amountY: new BN(0),
            liquiditySupply: new BN(0),
            rewardPerTokenStored: [new BN(0), new BN(0)],
            amountXIn: new BN(0),
            amountYIn: new BN(0),
            feeAmountXPerTokenStored: new BN(0),
            feeAmountYPerTokenStored: new BN(0),
            price: new BN(0),
          });
        }

        return {
          bins: binArrayBins,
          index: lowerBinArrayIndex,
          version: 1,
        };
      }));

    const [lowerBinIdForBinArray] = getBinArrayLowerUpperBinId(binArray.index);

    binArray.bins.forEach((bin, idx) => {
      const binId = lowerBinIdForBinArray.toNumber() + idx;

      if (binId >= lowerBinId && binId <= upperBinId) {
        const pricePerLamport = getPriceOfBinByBinId(binId, binStep).toString();
        bins.push({
          binId,
          xAmount: bin.amountX,
          yAmount: bin.amountY,
          supply: bin.liquiditySupply,
          price: pricePerLamport,
          version: binArray.version,
          pricePerToken: new Decimal(pricePerLamport)
            .mul(new Decimal(10 ** (baseTokenDecimal - quoteTokenDecimal)))
            .toString(),
        });
      }
    });
  } else {
    const [lowerBinArrayPubKey] = deriveBinArray(
      lbPairPubKey,
      lowerBinArrayIndex,
      METEORA_CLMM_PROGRAM_ID,
    );
    const [upperBinArrayPubKey] = deriveBinArray(
      lbPairPubKey,
      upperBinArrayIndex,
      METEORA_CLMM_PROGRAM_ID,
    );

    const binArrays = await (async () => {
      if (!lowerBinArrays || !upperBinArrays) {
        const res = await Promise.all([
          program.account.binArray.fetch(lowerBinArrayPubKey),
          program.account.binArray.fetch(upperBinArrayPubKey),
        ]);
        return res.filter((binArray) => binArray !== null);
      }

      return [lowerBinArrays, upperBinArrays];
    })();

    binArrays.forEach((binArray) => {
      if (!binArray) return;
      const [lowerBinIdForBinArray] = getBinArrayLowerUpperBinId(binArray.index);
      binArray.bins.forEach((bin, idx) => {
        const binId = lowerBinIdForBinArray.toNumber() + idx;
        if (binId >= lowerBinId && binId <= upperBinId) {
          const pricePerLamport = getPriceOfBinByBinId(binId, binStep).toString();
          bins.push({
            binId,
            xAmount: bin.amountX,
            yAmount: bin.amountY,
            supply: bin.liquiditySupply,
            price: pricePerLamport,
            version: binArray.version,
            pricePerToken: new Decimal(pricePerLamport)
              .mul(new Decimal(10 ** (baseTokenDecimal - quoteTokenDecimal)))
              .toString(),
          });
        }
      });
    });
  }

  return bins;
}

export async function getClaimableSwapFee(
  program: Program<MeteoraDlmm>,
  position: PublicKey,
): Promise<{
  feeX: BN;
  feeY: BN;
}> {
  let feeX = new BN(0);
  let feeY = new BN(0);
  const { lbPair, lowerBinId, upperBinId, feeInfos, liquidityShares } =
    await program.account.positionV2.fetch(position);
  const lowerBinArrayIdx = binIdToBinArrayIndex(new BN(lowerBinId));

  const [lowerBinArrayPubKey] = deriveBinArray(lbPair, lowerBinArrayIdx, program.programId);

  const upperBinArrayIdx = lowerBinArrayIdx.add(new BN(1));
  const [upperBinArrayPubKey] = deriveBinArray(lbPair, upperBinArrayIdx, program.programId);

  const [lowerBinArray, upperBinArray] = await Promise.all([
    program.account.binArray.fetch(lowerBinArrayPubKey),
    program.account.binArray.fetch(upperBinArrayPubKey),
  ]);

  for (let i = lowerBinId; i <= upperBinId; i++) {
    const binArrayIdx = binIdToBinArrayIndex(new BN(i));
    const binArray = binArrayIdx.eq(lowerBinArrayIdx) ? lowerBinArray : upperBinArray;
    const binState = getBinFromBinArray(i, binArray);
    const binIdxInPosition = i - lowerBinId;

    const feeInfo = feeInfos[binIdxInPosition];
    const liquidityShare = liquidityShares[binIdxInPosition].shrn(64);

    const newFeeX = mulShr(
      liquidityShare,
      binState.feeAmountXPerTokenStored.sub(feeInfo.feeXPerTokenComplete),
      SCALE_OFFSET,
      Rounding.Down,
    );

    const newFeeY = mulShr(
      liquidityShare,
      binState.feeAmountYPerTokenStored.sub(feeInfo.feeYPerTokenComplete),
      SCALE_OFFSET,
      Rounding.Down,
    );

    feeX = feeX.add(newFeeX).add(feeInfo.feeXPending);
    feeY = feeY.add(newFeeY).add(feeInfo.feeYPending);
  }

  return { feeX, feeY };
}
