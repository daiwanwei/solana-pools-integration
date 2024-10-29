import { TransactionInstruction, ComputeBudgetProgram } from "@solana/web3.js";

export function prepareComputeUnitIx(price: bigint, units: number): TransactionInstruction[] {
  const setPriceIx = ComputeBudgetProgram.setComputeUnitPrice({
    microLamports: price,
  });
  const setUnitIx = ComputeBudgetProgram.setComputeUnitLimit({
    units,
  });
  return [setPriceIx, setUnitIx];
}
