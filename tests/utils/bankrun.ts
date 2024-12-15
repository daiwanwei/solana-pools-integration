import {
  VersionedTransaction,
  Transaction,
  Signer,
  TransactionMessage,
  TransactionInstruction,
  PublicKey,
} from "@solana/web3.js";
import { BanksClient, BanksTransactionMeta, startAnchor, ProgramTestContext } from "solana-bankrun";
import { BankrunProvider } from "anchor-bankrun";
import {
  METAPLEX_METADATA_PROGRAM_DATA,
  METEORA_PROGRAM_DATA,
  ORCA_PROGRAM_DATA,
  RAYDIUM_PROGRAM_DATA,
} from "../fixtures";
import { prepareComputeUnitIx } from "./instructions";

export async function startWithPrograms(path: string): Promise<ProgramTestContext> {
  const programs = [
    METEORA_PROGRAM_DATA.program,
    ORCA_PROGRAM_DATA.program,
    RAYDIUM_PROGRAM_DATA.program,
    METAPLEX_METADATA_PROGRAM_DATA.program,
  ];
  const accounts = [
    ...METEORA_PROGRAM_DATA.accounts,
    ...ORCA_PROGRAM_DATA.accounts,
    ...RAYDIUM_PROGRAM_DATA.accounts,
    ...METAPLEX_METADATA_PROGRAM_DATA.accounts,
  ];
  return await startAnchor(path, programs, accounts);
}

export async function processTransaction(
  client: BanksClient,
  tx: VersionedTransaction | Transaction,
  debug = false,
): Promise<BanksTransactionMeta> {
  const meta = await client.processTransaction(tx);
  if (debug) {
    console.log(meta);
  }
  return meta;
}

export async function sendAndConfirm(
  provider: BankrunProvider,
  tx: VersionedTransaction | Transaction,
  signers?: Signer[],
): Promise<string> {
  return await provider.sendAndConfirm(tx, signers);
}

export async function prepareTx(
  client: BanksClient,
  payer: PublicKey,
  ix: TransactionInstruction[],
): Promise<VersionedTransaction> {
  const msg = new TransactionMessage({
    payerKey: payer,
    recentBlockhash: (await client.getLatestBlockhash())[0],
    instructions: [...prepareComputeUnitIx(100_000, 20_000_000), ...ix],
  }).compileToV0Message();

  const tx = new VersionedTransaction(msg);
  return tx;
}
