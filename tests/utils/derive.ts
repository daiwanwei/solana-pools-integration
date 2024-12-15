import { PublicKey } from "@solana/web3.js";
import BN from "bn.js";

export function deriveRaydiumProtocolPosition(
  poolState: PublicKey,
  tickLowerIndex: number,
  tickUpperIndex: number,
  programId: PublicKey,
) {
  const [protocolPosition, bump] = PublicKey.findProgramAddressSync(
    [
      Buffer.from("raydium_protocol_position"),
      poolState.toBuffer(),
      new Uint8Array(new BN(tickLowerIndex).toArrayLike(Buffer, "le", 4)),
      new Uint8Array(new BN(tickUpperIndex).toArrayLike(Buffer, "le", 4)),
    ],
    programId,
  );
  console.log("protocolPosition", protocolPosition.toBase58());
  console.log("bump", bump);
  console.log("programId", programId.toBase58());

  return protocolPosition;
}

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

export function deriveRaydiumPositionVault(
  raydiumProtocolPosition: PublicKey,
  vaultMint: PublicKey,
  programId: PublicKey,
) {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("position_vault"), raydiumProtocolPosition.toBuffer(), vaultMint.toBuffer()],
    programId,
  )[0];
}
