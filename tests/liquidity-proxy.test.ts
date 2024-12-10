import { BankrunProvider } from "anchor-bankrun";
import { BanksClient, ProgramTestContext, startAnchor } from "solana-bankrun";

import { BN, Program } from "@coral-xyz/anchor";
import { Keypair, PublicKey } from "@solana/web3.js";

import IDL from "../target/idl/liquidity_proxy.json";
import { LiquidityProxy } from "../target/types/liquidity_proxy";

describe("liquidity-proxy", () => {
  let context: ProgramTestContext;
  let client: BanksClient;
  let provider: BankrunProvider;
  let program: Program<LiquidityProxy>;

  before(async () => {
    context = await startAnchor(".", [], []);
    client = context.banksClient;
    provider = new BankrunProvider(context);

    program = new Program<LiquidityProxy>(IDL as LiquidityProxy, provider);
  });

  it("initialize raydium config", async () => {
    await program.methods.initializeRaydiumConfig().accounts({}).rpc();
  });
});
