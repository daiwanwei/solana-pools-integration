import { PublicKey } from "@solana/web3.js";

export function deriveRaydiumUserPosition(
  raydiumProtocolPosition: PublicKey,
  user: PublicKey,
  programId: PublicKey,
) {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("raydium_user_position"), raydiumProtocolPosition.toBuffer(), user.toBuffer()],
    programId,
  )[0];
}
