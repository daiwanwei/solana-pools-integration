import { Connection, TransactionInstruction } from "@solana/web3.js";
import { PublicKey } from "@solana/web3.js";
import {
  getAssociatedTokenAddressSync,
  getAccount,
  createAssociatedTokenAccountInstruction,
} from "@solana/spl-token";

export const getOrCreateATAInstruction = async (
  connection: Connection,
  tokenMint: PublicKey,
  owner: PublicKey,
  payer: PublicKey = owner,
  allowOwnerOffCurve = true,
): Promise<{ ataPubKey: PublicKey; ix: TransactionInstruction | undefined }> => {
  const toAccount = getAssociatedTokenAddressSync(tokenMint, owner, allowOwnerOffCurve);

  try {
    await getAccount(connection, toAccount);

    return { ataPubKey: toAccount, ix: undefined };
  } catch (e) {
    const ix = createAssociatedTokenAccountInstruction(payer, toAccount, owner, tokenMint);

    return { ataPubKey: toAccount, ix };
  }
};
