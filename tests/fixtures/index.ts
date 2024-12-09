import RAYDIUM_CLMM_CONFIG_4 from "./accounts/raydium_clmm_config_4.json";
import METEORA_PRESET_PARAM_1 from "./accounts/meteora_preset_param_1.json";
import { CLMM_PROGRAM_ID, METADATA_PROGRAM_ID } from "@raydium-io/raydium-sdk-v2";
import { PublicKey } from "@solana/web3.js";
import { AddedAccount } from "solana-bankrun";

import { METEORA_CLMM_PROGRAM_ID } from "../constants";
import { ORCA_WHIRLPOOL_PROGRAM_ID } from "@orca-so/whirlpools-sdk";
import WHIRLPOOLS_CONFIG from "./accounts/whirlpools_config.json";
import WHIRLPOOLS_CONFIG_FEETIER1 from "./accounts/whirlpools_config_feetier1.json";
import WHIRLPOOLS_CONFIG_FEETIER64 from "./accounts/whirlpools_config_feetier64.json";
import WHIRLPOOLS_CONFIG_FEETIER128 from "./accounts/whirlpools_config_feetier128.json";

import { TestFixture } from "./fixture";
export { TestFixture };

export const METEORA_PROGRAM_DATA = {
  program: {
    name: "meteora_dlmm",
    programId: METEORA_CLMM_PROGRAM_ID,
  },
  accounts: [convertAccountData(METEORA_PRESET_PARAM_1)],
};

export const ORCA_PROGRAM_DATA = {
  program: {
    name: "orca_whirlpool",
    programId: ORCA_WHIRLPOOL_PROGRAM_ID,
  },
  accounts: [
    convertAccountData(WHIRLPOOLS_CONFIG),
    convertAccountData(WHIRLPOOLS_CONFIG_FEETIER1),
    convertAccountData(WHIRLPOOLS_CONFIG_FEETIER64),
    convertAccountData(WHIRLPOOLS_CONFIG_FEETIER128),
  ],
};

export const RAYDIUM_PROGRAM_DATA = {
  program: {
    name: "raydium_clmm",
    programId: CLMM_PROGRAM_ID,
  },
  accounts: [convertAccountData(RAYDIUM_CLMM_CONFIG_4)],
};

export const METAPLEX_METADATA_PROGRAM_DATA = {
  program: {
    name: "metaplex_metadata",
    programId: METADATA_PROGRAM_ID,
  },
  accounts: [],
};

function convertAccountData(data: Account): AddedAccount {
  return {
    address: new PublicKey(data.pubkey),
    info: {
      lamports: data.account.lamports,
      data: Buffer.from(data.account.data[0], "base64"),
      owner: new PublicKey(data.account.owner),
      executable: data.account.executable,
      rentEpoch: data.account.rentEpoch,
    },
  };
}

export interface Account {
  pubkey: string;
  account: {
    lamports: number;
    data: string[];
    owner: string;
    executable: boolean;
    rentEpoch: number;
  };
}
