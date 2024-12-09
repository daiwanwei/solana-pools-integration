import { VersionedTransaction, Transaction } from "@solana/web3.js";
import { BanksClient, BanksTransactionMeta, startAnchor, ProgramTestContext } from "solana-bankrun";
import {
  METAPLEX_METADATA_PROGRAM_DATA,
  METEORA_PROGRAM_DATA,
  ORCA_PROGRAM_DATA,
  RAYDIUM_PROGRAM_DATA,
} from "../fixtures";

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
