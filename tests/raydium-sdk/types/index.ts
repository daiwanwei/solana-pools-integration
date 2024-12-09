import { BN, IdlAccounts, IdlTypes, Program, ProgramAccount } from "@coral-xyz/anchor";
import { AmmV3 } from "../idls/raydium_clmm";
import { PublicKey, TransactionInstruction } from "@solana/web3.js";
import Decimal from "decimal.js";
import { u64, i64, struct } from "@coral-xyz/borsh";

export type Tick = IdlTypes<AmmV3>["tickState"];
