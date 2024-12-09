import { PublicKey, Keypair, TransactionInstruction } from "@solana/web3.js";
import {
  InitTickArrayParams,
  WhirlpoolContext,
  WhirlpoolIx,
  PDAUtil,
  TickUtil,
  toTx,
  TICK_ARRAY_SIZE,
} from "@orca-so/whirlpools-sdk";

import { PDA, Instruction } from "@orca-so/common-sdk";

export function prepareInitTickArrayInstruction(
  ctx: WhirlpoolContext,
  whirlpool: PublicKey,
  startTickIndex: number,
  funder?: Keypair,
): { params: InitTickArrayParams; ix: Instruction } {
  const params = generateDefaultInitTickArrayParams(
    ctx,
    whirlpool,
    startTickIndex,
    funder?.publicKey,
  );
  const ix = WhirlpoolIx.initTickArrayIx(ctx.program, params);
  return { params, ix };
}

export function prepareInitTickArrayInstructions(
  ctx: WhirlpoolContext,
  whirlpool: PublicKey,
  startTickIndex: number,
  arrayCount: number,
  tickSpacing: number,
  aToB: boolean,
): { pda: PDA; ix: Instruction }[] {
  const ticksInArray = tickSpacing * TICK_ARRAY_SIZE;
  const direction = aToB ? -1 : 1;
  const result: { pda: PDA; ix: Instruction }[] = [];

  for (let i = 0; i < arrayCount; i++) {
    const { params, ix } = prepareInitTickArrayInstruction(
      ctx,
      whirlpool,
      startTickIndex + direction * ticksInArray * i,
    );
    result.push({ pda: params.tickArrayPda, ix });
  }

  return result;
}

export async function initTickArray(
  ctx: WhirlpoolContext,
  whirlpool: PublicKey,
  startTickIndex: number,
  funder?: Keypair,
): Promise<{ txId: string; params: InitTickArrayParams }> {
  const params = generateDefaultInitTickArrayParams(
    ctx,
    whirlpool,
    startTickIndex,
    funder?.publicKey,
  );
  const tx = toTx(ctx, WhirlpoolIx.initTickArrayIx(ctx.program, params));
  if (funder) {
    tx.addSigner(funder);
  }
  return { txId: await tx.buildAndExecute(), params };
}

export const generateDefaultInitTickArrayParams = (
  context: WhirlpoolContext,
  whirlpool: PublicKey,
  startTick: number,
  funder?: PublicKey,
): InitTickArrayParams => {
  const tickArrayPda = PDAUtil.getTickArray(context.program.programId, whirlpool, startTick);

  return {
    whirlpool,
    tickArrayPda: tickArrayPda,
    startTick,
    funder: funder || context.wallet.publicKey,
  };
};

export async function initTickArrayRange(
  ctx: WhirlpoolContext,
  whirlpool: PublicKey,
  startTickIndex: number,
  arrayCount: number,
  tickSpacing: number,
  aToB: boolean,
): Promise<PDA[]> {
  const ticksInArray = tickSpacing * TICK_ARRAY_SIZE;
  const direction = aToB ? -1 : 1;
  const result: PDA[] = [];

  for (let i = 0; i < arrayCount; i++) {
    const { params } = await initTickArray(
      ctx,
      whirlpool,
      startTickIndex + direction * ticksInArray * i,
    );
    result.push(params.tickArrayPda);
  }

  return result;
}
