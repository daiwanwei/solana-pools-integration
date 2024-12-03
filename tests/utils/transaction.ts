import {
  Connection,
  Transaction,
  Keypair,
  sendAndConfirmTransaction,
  TransactionSignature,
} from "@solana/web3.js";
import { TransactionBuilder } from "@orca-so/common-sdk";
import { AnchorProvider } from "@coral-xyz/anchor";

export async function getParsedTransaction(connection: Connection, sig: string) {
  const parsedTx = await connection.getParsedTransaction(sig, "confirmed");
  return parsedTx;
}

export async function logTransaction(connection: Connection, sig: string) {
  const parsedTx = await getParsedTransaction(connection, sig);
  console.log(`Transaction: ${sig}`);
  console.log(parsedTx);
}

export async function sendAndConfirmTx(
  connection: Connection,
  tx: TransactionBuilder,
): Promise<string> {
  let sig = await tx.buildAndExecute();
  await connection.confirmTransaction(sig);
  return sig;
}

export async function sendAndConfirmTx2(
  provider: AnchorProvider,
  rawTx: Transaction,
  signers: Keypair[] = [],
  payer?: Keypair,
): Promise<TransactionSignature> {
  if (payer) {
    const connection = provider.connection;
    rawTx.feePayer = payer.publicKey;
    rawTx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
    return await sendAndConfirmTransaction(connection, rawTx, [payer, ...signers]);
  } else {
    return await provider.sendAndConfirm(rawTx, signers);
  }
}
