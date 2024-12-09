import { PublicKey } from "@solana/web3.js";
import { LBCLMM_PROGRAM_IDS } from "@meteora-ag/dlmm";

export const ORCA_FEE_TIER_ACCOUNT_1 = new PublicKey(
  "62dSkn5ktwY1PoKPNMArZA4bZsvyemuknWUnnQ2ATTuN",
);
export const ORCA_FEE_TIER_ACCOUNT_64 = new PublicKey(
  "HT55NVGVTjWmWLjV7BrSMPVZ7ppU8T2xE5nCAZ6YaGad",
);
export const ORCA_FEE_TIER_ACCOUNT_128 = new PublicKey(
  "BGnhGXT9CCt5WYS23zg9sqsAT2MGXkq7VSwch9pML82W",
);

export const RAYDIUM_CLMM_CONFIG_4 = {
  id: "9iFER3bpjf1PTTCQCfTRu17EJgvsxo9pVyA9QWwEuX4x",
  index: 4,
  protocolFeeRate: 120000,
  tradeFeeRate: 100,
  tickSpacing: 1,
  fundFeeRate: 40000,
  defaultRange: 0.005,
  defaultRangePoint: [0.001, 0.003, 0.005, 0.008, 0.01],
};

export const METEORA_CLMM_PROGRAM_ID = new PublicKey("LBUZKhRxPF3XUpBCjp4YzTKgLccjZhTSDM9YuVaPwxo");
export const METEORA_ADMIN_KEY = new PublicKey("5unTfT2kssBuNvHPY6LbJfJpLqEcdMxGYLWHwShaeTLi");
