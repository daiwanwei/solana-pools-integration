import { Program } from "@coral-xyz/anchor";

import { PublicKey } from "@solana/web3.js";
import { deriveLbPair2, deriveLbPair } from "./derive";
import { BN } from "@coral-xyz/anchor";
import { MeteoraDlmm } from "../idls/meteora_dlmm";

export async function getPairPubkeyIfExists(
  program: Program<MeteoraDlmm>,
  tokenX: PublicKey,
  tokenY: PublicKey,
  binStep: BN,
  baseFactor: BN,
): Promise<PublicKey | null> {
  try {
    const [lbPair2Key] = deriveLbPair2(tokenX, tokenY, binStep, baseFactor, program.programId);
    const account2 = await program.account.lbPair.fetchNullable(lbPair2Key);
    if (account2) return lbPair2Key;

    const [lbPairKey] = deriveLbPair(tokenX, tokenY, binStep, program.programId);

    const account = await program.account.lbPair.fetchNullable(lbPairKey);
    if (account && account.parameters.baseFactor === baseFactor.toNumber()) {
      return lbPairKey;
    }
    return null;
  } catch (error) {
    return null;
  }
}
