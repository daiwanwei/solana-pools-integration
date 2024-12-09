import type { AnchorProvider, Provider } from "@coral-xyz/anchor";
import { BN, web3 } from "@coral-xyz/anchor";
import { Connection, Keypair, PublicKey, TransactionInstruction } from "@solana/web3.js";
import { TokenUtil } from "@orca-so/common-sdk";
import {
  AccountLayout,
  NATIVE_MINT,
  TOKEN_PROGRAM_ID,
  createAssociatedTokenAccountInstruction,
  createInitializeAccount3Instruction,
  createInitializeMintInstruction,
  createMintToInstruction,
  getAssociatedTokenAddressSync,
} from "@solana/spl-token";

const TEST_TOKEN_PROGRAM_ID = TOKEN_PROGRAM_ID;

export async function prepareCreateMintInstructions(
  connection: Connection,
  payer: PublicKey,
  authority: PublicKey,
  decimals: number,
): Promise<{
  mint: PublicKey;
  instructions: TransactionInstruction[];
}> {
  const mint = web3.Keypair.generate();
  const instructions = await createMintInstructions(
    connection,
    payer,
    authority,
    mint.publicKey,
    decimals,
  );
  return {
    mint: mint.publicKey,
    instructions,
  };
}

export async function createMintInstructions(
  connection: Connection,
  payer: web3.PublicKey,
  authority: web3.PublicKey,
  mint: web3.PublicKey,
  decimals: number,
) {
  let instructions = [
    web3.SystemProgram.createAccount({
      fromPubkey: payer,
      newAccountPubkey: mint,
      space: 82,
      lamports: await connection.getMinimumBalanceForRentExemption(82),
      programId: TEST_TOKEN_PROGRAM_ID,
    }),
    createInitializeMintInstruction(mint, decimals, authority, null),
  ];
  return instructions;
}

export function prepareCreateATAInstruction(
  mint: web3.PublicKey,
  owner: web3.PublicKey,
  payer: web3.PublicKey,
): { ataAddress: web3.PublicKey; instruction: TransactionInstruction } {
  const ataAddress = getAssociatedTokenAddressSync(mint, owner);
  const instr = createAssociatedTokenAccountInstruction(payer, ataAddress, owner, mint);
  return {
    ataAddress,
    instruction: instr,
  };
}

async function prepareCreateTokenAccountInstruction(
  provider: Provider,
  payer: PublicKey,
  newAccountPubkey: PublicKey,
  mint: PublicKey,
  owner: PublicKey,
  lamports?: number,
): Promise<TransactionInstruction[]> {
  if (lamports === undefined) {
    lamports = await provider.connection.getMinimumBalanceForRentExemption(165);
  }
  return [
    web3.SystemProgram.createAccount({
      fromPubkey: payer,
      newAccountPubkey,
      space: 165,
      lamports,
      programId: TEST_TOKEN_PROGRAM_ID,
    }),
    createInitializeAccount3Instruction(newAccountPubkey, mint, owner),
  ];
}

export async function prepareMintToInstruction(
  payer: PublicKey,
  mint: PublicKey,
  destination: PublicKey,
  amount: number | BN,
): Promise<TransactionInstruction> {
  const amountVal = amount instanceof BN ? BigInt(amount.toString()) : amount;
  return createMintToInstruction(mint, destination, payer, amountVal);
}

export async function prepareCreateAndMintToATAInstruction(
  connection: Connection,
  payer: PublicKey,
  mint: PublicKey,
  amount: number | BN,
  destinationWallet?: PublicKey,
): Promise<{ tokenAccount: PublicKey; instructions: TransactionInstruction[] }> {
  const destinationWalletKey = destinationWallet ? destinationWallet : payer;

  // Workaround For SOL - just create a wSOL account to satisfy the rest of the test building pipeline.
  // Tests who want to test with SOL will have to request their own airdrop.
  if (mint.equals(NATIVE_MINT)) {
    const rentExemption = await connection.getMinimumBalanceForRentExemption(
      AccountLayout.span,
      "confirmed",
    );
    const { address: tokenAccount, ...ix } = TokenUtil.createWrappedNativeAccountInstruction(
      destinationWalletKey,
      new BN(amount.toString()),
      rentExemption,
    );
    return {
      tokenAccount,
      instructions: [...ix.instructions],
    };
  }
  console.log(connection);
  const ata = getAssociatedTokenAddressSync(mint, destinationWalletKey);
  try {
    const tokenAccount = await connection.getAccountInfo(ata);
  } catch (e) {
    console.log("ATA does not exist");
    const { ataAddress, instruction } = prepareCreateATAInstruction(
      mint,
      destinationWalletKey,
      payer,
    );

    const mintTo = await prepareMintToInstruction(payer, mint, ataAddress, amount);
    return {
      tokenAccount: ataAddress,
      instructions: [instruction, mintTo],
    };
  }

  return {
    tokenAccount: ata,
    instructions: [await prepareMintToInstruction(payer, mint, ata, amount)],
  };
}

export async function getTokenBalance(provider: AnchorProvider, vault: web3.PublicKey) {
  return (await provider.connection.getTokenAccountBalance(vault, "confirmed")).value.amount;
}

export async function getTokenBalances(
  connection: web3.Connection,
  token: web3.PublicKey,
  account: web3.PublicKey,
) {
  const account_info = await connection.getAccountInfo(account);
  if (account_info === null) {
    return new BN(0);
  }
  const token_account = AccountLayout.decode(account_info.data);
  if (token_account.mint.equals(token)) {
    return token_account.amount;
  }
  return new BN(0);
}
