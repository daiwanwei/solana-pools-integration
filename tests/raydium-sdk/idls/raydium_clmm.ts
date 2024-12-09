/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/amm_v3.json`.
 */
export type AmmV3 = {
  address: "CAMMCzo5YL8w4VFF8KVHrK22GGUsp5VTaW7grrKgrWqK";
  metadata: {
    name: "ammV3";
    version: "0.1.0";
    spec: "0.1.0";
  };
  instructions: [
    {
      name: "createAmmConfig";
      discriminator: [137, 52, 237, 212, 215, 117, 108, 104];
      accounts: [
        {
          name: "owner";
          writable: true;
          signer: true;
        },
        {
          name: "ammConfig";
          writable: true;
        },
        {
          name: "systemProgram";
        },
      ];
      args: [
        {
          name: "index";
          type: "u16";
        },
        {
          name: "tickSpacing";
          type: "u16";
        },
        {
          name: "tradeFeeRate";
          type: "u32";
        },
        {
          name: "protocolFeeRate";
          type: "u32";
        },
        {
          name: "fundFeeRate";
          type: "u32";
        },
      ];
    },
    {
      name: "updateAmmConfig";
      discriminator: [49, 60, 174, 136, 154, 28, 116, 200];
      accounts: [
        {
          name: "owner";
          signer: true;
        },
        {
          name: "ammConfig";
          writable: true;
        },
      ];
      args: [
        {
          name: "param";
          type: "u8";
        },
        {
          name: "value";
          type: "u32";
        },
      ];
    },
    {
      name: "createPool";
      discriminator: [233, 146, 209, 142, 207, 104, 64, 188];
      accounts: [
        {
          name: "poolCreator";
          writable: true;
          signer: true;
        },
        {
          name: "ammConfig";
        },
        {
          name: "poolState";
          writable: true;
        },
        {
          name: "tokenMint0";
        },
        {
          name: "tokenMint1";
        },
        {
          name: "tokenVault0";
          writable: true;
        },
        {
          name: "tokenVault1";
          writable: true;
        },
        {
          name: "observationState";
          writable: true;
        },
        {
          name: "tickArrayBitmap";
          writable: true;
        },
        {
          name: "tokenProgram0";
        },
        {
          name: "tokenProgram1";
        },
        {
          name: "systemProgram";
        },
        {
          name: "rent";
        },
      ];
      args: [
        {
          name: "sqrtPriceX64";
          type: "u128";
        },
        {
          name: "openTime";
          type: "u64";
        },
      ];
    },
    {
      name: "updatePoolStatus";
      discriminator: [130, 87, 108, 6, 46, 224, 117, 123];
      accounts: [
        {
          name: "authority";
          signer: true;
        },
        {
          name: "poolState";
          writable: true;
        },
      ];
      args: [
        {
          name: "status";
          type: "u8";
        },
      ];
    },
    {
      name: "createOperationAccount";
      discriminator: [63, 87, 148, 33, 109, 35, 8, 104];
      accounts: [
        {
          name: "owner";
          writable: true;
          signer: true;
        },
        {
          name: "operationState";
          writable: true;
        },
        {
          name: "systemProgram";
        },
      ];
      args: [];
    },
    {
      name: "updateOperationAccount";
      discriminator: [127, 70, 119, 40, 188, 227, 61, 7];
      accounts: [
        {
          name: "owner";
          signer: true;
        },
        {
          name: "operationState";
          writable: true;
        },
        {
          name: "systemProgram";
        },
      ];
      args: [
        {
          name: "param";
          type: "u8";
        },
        {
          name: "keys";
          type: {
            vec: "pubkey";
          };
        },
      ];
    },
    {
      name: "transferRewardOwner";
      discriminator: [7, 22, 12, 83, 242, 43, 48, 121];
      accounts: [
        {
          name: "authority";
          signer: true;
        },
        {
          name: "poolState";
          writable: true;
        },
      ];
      args: [
        {
          name: "newOwner";
          type: "pubkey";
        },
      ];
    },
    {
      name: "initializeReward";
      discriminator: [95, 135, 192, 196, 242, 129, 230, 68];
      accounts: [
        {
          name: "rewardFunder";
          writable: true;
          signer: true;
        },
        {
          name: "funderTokenAccount";
          writable: true;
        },
        {
          name: "ammConfig";
        },
        {
          name: "poolState";
          writable: true;
        },
        {
          name: "operationState";
        },
        {
          name: "rewardTokenMint";
        },
        {
          name: "rewardTokenVault";
          writable: true;
        },
        {
          name: "rewardTokenProgram";
        },
        {
          name: "systemProgram";
        },
        {
          name: "rent";
        },
      ];
      args: [
        {
          name: "param";
          type: {
            defined: {
              name: "initializeRewardParam";
            };
          };
        },
      ];
    },
    {
      name: "collectRemainingRewards";
      discriminator: [18, 237, 166, 197, 34, 16, 213, 144];
      accounts: [
        {
          name: "rewardFunder";
          signer: true;
        },
        {
          name: "funderTokenAccount";
          writable: true;
        },
        {
          name: "poolState";
          writable: true;
        },
        {
          name: "rewardTokenVault";
        },
        {
          name: "rewardVaultMint";
        },
        {
          name: "tokenProgram";
        },
        {
          name: "tokenProgram2022";
        },
        {
          name: "memoProgram";
        },
      ];
      args: [
        {
          name: "rewardIndex";
          type: "u8";
        },
      ];
    },
    {
      name: "updateRewardInfos";
      discriminator: [163, 172, 224, 52, 11, 154, 106, 223];
      accounts: [
        {
          name: "poolState";
          writable: true;
        },
      ];
      args: [];
    },
    {
      name: "setRewardParams";
      discriminator: [112, 52, 167, 75, 32, 201, 211, 137];
      accounts: [
        {
          name: "authority";
          signer: true;
        },
        {
          name: "ammConfig";
        },
        {
          name: "poolState";
          writable: true;
        },
        {
          name: "operationState";
        },
        {
          name: "tokenProgram";
        },
        {
          name: "tokenProgram2022";
        },
      ];
      args: [
        {
          name: "rewardIndex";
          type: "u8";
        },
        {
          name: "emissionsPerSecondX64";
          type: "u128";
        },
        {
          name: "openTime";
          type: "u64";
        },
        {
          name: "endTime";
          type: "u64";
        },
      ];
    },
    {
      name: "collectProtocolFee";
      discriminator: [136, 136, 252, 221, 194, 66, 126, 89];
      accounts: [
        {
          name: "owner";
          signer: true;
        },
        {
          name: "poolState";
          writable: true;
        },
        {
          name: "ammConfig";
        },
        {
          name: "tokenVault0";
          writable: true;
        },
        {
          name: "tokenVault1";
          writable: true;
        },
        {
          name: "vault0Mint";
        },
        {
          name: "vault1Mint";
        },
        {
          name: "recipientTokenAccount0";
          writable: true;
        },
        {
          name: "recipientTokenAccount1";
          writable: true;
        },
        {
          name: "tokenProgram";
        },
        {
          name: "tokenProgram2022";
        },
      ];
      args: [
        {
          name: "amount0Requested";
          type: "u64";
        },
        {
          name: "amount1Requested";
          type: "u64";
        },
      ];
    },
    {
      name: "collectFundFee";
      discriminator: [167, 138, 78, 149, 223, 194, 6, 126];
      accounts: [
        {
          name: "owner";
          signer: true;
        },
        {
          name: "poolState";
          writable: true;
        },
        {
          name: "ammConfig";
        },
        {
          name: "tokenVault0";
          writable: true;
        },
        {
          name: "tokenVault1";
          writable: true;
        },
        {
          name: "vault0Mint";
        },
        {
          name: "vault1Mint";
        },
        {
          name: "recipientTokenAccount0";
          writable: true;
        },
        {
          name: "recipientTokenAccount1";
          writable: true;
        },
        {
          name: "tokenProgram";
        },
        {
          name: "tokenProgram2022";
        },
      ];
      args: [
        {
          name: "amount0Requested";
          type: "u64";
        },
        {
          name: "amount1Requested";
          type: "u64";
        },
      ];
    },
    {
      name: "openPosition";
      discriminator: [135, 128, 47, 77, 15, 152, 240, 49];
      accounts: [
        {
          name: "payer";
          writable: true;
          signer: true;
        },
        {
          name: "positionNftOwner";
        },
        {
          name: "positionNftMint";
          writable: true;
          signer: true;
        },
        {
          name: "positionNftAccount";
          writable: true;
        },
        {
          name: "metadataAccount";
          writable: true;
        },
        {
          name: "poolState";
          writable: true;
        },
        {
          name: "protocolPosition";
          writable: true;
        },
        {
          name: "tickArrayLower";
          writable: true;
        },
        {
          name: "tickArrayUpper";
          writable: true;
        },
        {
          name: "personalPosition";
          writable: true;
        },
        {
          name: "tokenAccount0";
          writable: true;
        },
        {
          name: "tokenAccount1";
          writable: true;
        },
        {
          name: "tokenVault0";
          writable: true;
        },
        {
          name: "tokenVault1";
          writable: true;
        },
        {
          name: "rent";
        },
        {
          name: "systemProgram";
        },
        {
          name: "tokenProgram";
        },
        {
          name: "associatedTokenProgram";
        },
        {
          name: "metadataProgram";
        },
      ];
      args: [
        {
          name: "tickLowerIndex";
          type: "i32";
        },
        {
          name: "tickUpperIndex";
          type: "i32";
        },
        {
          name: "tickArrayLowerStartIndex";
          type: "i32";
        },
        {
          name: "tickArrayUpperStartIndex";
          type: "i32";
        },
        {
          name: "liquidity";
          type: "u128";
        },
        {
          name: "amount0Max";
          type: "u64";
        },
        {
          name: "amount1Max";
          type: "u64";
        },
      ];
    },
    {
      name: "openPositionV2";
      discriminator: [77, 184, 74, 214, 112, 86, 241, 199];
      accounts: [
        {
          name: "payer";
          writable: true;
          signer: true;
        },
        {
          name: "positionNftOwner";
        },
        {
          name: "positionNftMint";
          writable: true;
          signer: true;
        },
        {
          name: "positionNftAccount";
          writable: true;
        },
        {
          name: "metadataAccount";
          writable: true;
        },
        {
          name: "poolState";
          writable: true;
        },
        {
          name: "protocolPosition";
          writable: true;
        },
        {
          name: "tickArrayLower";
          writable: true;
        },
        {
          name: "tickArrayUpper";
          writable: true;
        },
        {
          name: "personalPosition";
          writable: true;
        },
        {
          name: "tokenAccount0";
          writable: true;
        },
        {
          name: "tokenAccount1";
          writable: true;
        },
        {
          name: "tokenVault0";
          writable: true;
        },
        {
          name: "tokenVault1";
          writable: true;
        },
        {
          name: "rent";
        },
        {
          name: "systemProgram";
        },
        {
          name: "tokenProgram";
        },
        {
          name: "associatedTokenProgram";
        },
        {
          name: "metadataProgram";
        },
        {
          name: "tokenProgram2022";
        },
        {
          name: "vault0Mint";
        },
        {
          name: "vault1Mint";
        },
      ];
      args: [
        {
          name: "tickLowerIndex";
          type: "i32";
        },
        {
          name: "tickUpperIndex";
          type: "i32";
        },
        {
          name: "tickArrayLowerStartIndex";
          type: "i32";
        },
        {
          name: "tickArrayUpperStartIndex";
          type: "i32";
        },
        {
          name: "liquidity";
          type: "u128";
        },
        {
          name: "amount0Max";
          type: "u64";
        },
        {
          name: "amount1Max";
          type: "u64";
        },
        {
          name: "withMatedata";
          type: "bool";
        },
        {
          name: "baseFlag";
          type: {
            option: "bool";
          };
        },
      ];
    },
    {
      name: "closePosition";
      discriminator: [123, 134, 81, 0, 49, 68, 98, 98];
      accounts: [
        {
          name: "nftOwner";
          writable: true;
          signer: true;
        },
        {
          name: "positionNftMint";
          writable: true;
        },
        {
          name: "positionNftAccount";
          writable: true;
        },
        {
          name: "personalPosition";
          writable: true;
        },
        {
          name: "systemProgram";
        },
        {
          name: "tokenProgram";
        },
      ];
      args: [];
    },
    {
      name: "increaseLiquidity";
      discriminator: [46, 156, 243, 118, 13, 205, 251, 178];
      accounts: [
        {
          name: "nftOwner";
          signer: true;
        },
        {
          name: "nftAccount";
        },
        {
          name: "poolState";
          writable: true;
        },
        {
          name: "protocolPosition";
          writable: true;
        },
        {
          name: "personalPosition";
          writable: true;
        },
        {
          name: "tickArrayLower";
          writable: true;
        },
        {
          name: "tickArrayUpper";
          writable: true;
        },
        {
          name: "tokenAccount0";
          writable: true;
        },
        {
          name: "tokenAccount1";
          writable: true;
        },
        {
          name: "tokenVault0";
          writable: true;
        },
        {
          name: "tokenVault1";
          writable: true;
        },
        {
          name: "tokenProgram";
        },
      ];
      args: [
        {
          name: "liquidity";
          type: "u128";
        },
        {
          name: "amount0Max";
          type: "u64";
        },
        {
          name: "amount1Max";
          type: "u64";
        },
      ];
    },
    {
      name: "increaseLiquidityV2";
      discriminator: [133, 29, 89, 223, 69, 238, 176, 10];
      accounts: [
        {
          name: "nftOwner";
          signer: true;
        },
        {
          name: "nftAccount";
        },
        {
          name: "poolState";
          writable: true;
        },
        {
          name: "protocolPosition";
          writable: true;
        },
        {
          name: "personalPosition";
          writable: true;
        },
        {
          name: "tickArrayLower";
          writable: true;
        },
        {
          name: "tickArrayUpper";
          writable: true;
        },
        {
          name: "tokenAccount0";
          writable: true;
        },
        {
          name: "tokenAccount1";
          writable: true;
        },
        {
          name: "tokenVault0";
          writable: true;
        },
        {
          name: "tokenVault1";
          writable: true;
        },
        {
          name: "tokenProgram";
        },
        {
          name: "tokenProgram2022";
        },
        {
          name: "vault0Mint";
        },
        {
          name: "vault1Mint";
        },
      ];
      args: [
        {
          name: "liquidity";
          type: "u128";
        },
        {
          name: "amount0Max";
          type: "u64";
        },
        {
          name: "amount1Max";
          type: "u64";
        },
        {
          name: "baseFlag";
          type: {
            option: "bool";
          };
        },
      ];
    },
    {
      name: "decreaseLiquidity";
      discriminator: [160, 38, 208, 111, 104, 91, 44, 1];
      accounts: [
        {
          name: "nftOwner";
          signer: true;
        },
        {
          name: "nftAccount";
        },
        {
          name: "personalPosition";
          writable: true;
        },
        {
          name: "poolState";
          writable: true;
        },
        {
          name: "protocolPosition";
          writable: true;
        },
        {
          name: "tokenVault0";
          writable: true;
        },
        {
          name: "tokenVault1";
          writable: true;
        },
        {
          name: "tickArrayLower";
          writable: true;
        },
        {
          name: "tickArrayUpper";
          writable: true;
        },
        {
          name: "recipientTokenAccount0";
          writable: true;
        },
        {
          name: "recipientTokenAccount1";
          writable: true;
        },
        {
          name: "tokenProgram";
        },
      ];
      args: [
        {
          name: "liquidity";
          type: "u128";
        },
        {
          name: "amount0Min";
          type: "u64";
        },
        {
          name: "amount1Min";
          type: "u64";
        },
      ];
    },
    {
      name: "decreaseLiquidityV2";
      discriminator: [58, 127, 188, 62, 79, 82, 196, 96];
      accounts: [
        {
          name: "nftOwner";
          signer: true;
        },
        {
          name: "nftAccount";
        },
        {
          name: "personalPosition";
          writable: true;
        },
        {
          name: "poolState";
          writable: true;
        },
        {
          name: "protocolPosition";
          writable: true;
        },
        {
          name: "tokenVault0";
          writable: true;
        },
        {
          name: "tokenVault1";
          writable: true;
        },
        {
          name: "tickArrayLower";
          writable: true;
        },
        {
          name: "tickArrayUpper";
          writable: true;
        },
        {
          name: "recipientTokenAccount0";
          writable: true;
        },
        {
          name: "recipientTokenAccount1";
          writable: true;
        },
        {
          name: "tokenProgram";
        },
        {
          name: "tokenProgram2022";
        },
        {
          name: "memoProgram";
        },
        {
          name: "vault0Mint";
        },
        {
          name: "vault1Mint";
        },
      ];
      args: [
        {
          name: "liquidity";
          type: "u128";
        },
        {
          name: "amount0Min";
          type: "u64";
        },
        {
          name: "amount1Min";
          type: "u64";
        },
      ];
    },
    {
      name: "swap";
      discriminator: [248, 198, 158, 145, 225, 117, 135, 200];
      accounts: [
        {
          name: "payer";
          signer: true;
        },
        {
          name: "ammConfig";
        },
        {
          name: "poolState";
          writable: true;
        },
        {
          name: "inputTokenAccount";
          writable: true;
        },
        {
          name: "outputTokenAccount";
          writable: true;
        },
        {
          name: "inputVault";
          writable: true;
        },
        {
          name: "outputVault";
          writable: true;
        },
        {
          name: "observationState";
          writable: true;
        },
        {
          name: "tokenProgram";
        },
        {
          name: "tickArray";
          writable: true;
        },
      ];
      args: [
        {
          name: "amount";
          type: "u64";
        },
        {
          name: "otherAmountThreshold";
          type: "u64";
        },
        {
          name: "sqrtPriceLimitX64";
          type: "u128";
        },
        {
          name: "isBaseInput";
          type: "bool";
        },
      ];
    },
    {
      name: "swapV2";
      discriminator: [43, 4, 237, 11, 26, 201, 30, 98];
      accounts: [
        {
          name: "payer";
          signer: true;
        },
        {
          name: "ammConfig";
        },
        {
          name: "poolState";
          writable: true;
        },
        {
          name: "inputTokenAccount";
          writable: true;
        },
        {
          name: "outputTokenAccount";
          writable: true;
        },
        {
          name: "inputVault";
          writable: true;
        },
        {
          name: "outputVault";
          writable: true;
        },
        {
          name: "observationState";
          writable: true;
        },
        {
          name: "tokenProgram";
        },
        {
          name: "tokenProgram2022";
        },
        {
          name: "memoProgram";
        },
        {
          name: "inputVaultMint";
        },
        {
          name: "outputVaultMint";
        },
      ];
      args: [
        {
          name: "amount";
          type: "u64";
        },
        {
          name: "otherAmountThreshold";
          type: "u64";
        },
        {
          name: "sqrtPriceLimitX64";
          type: "u128";
        },
        {
          name: "isBaseInput";
          type: "bool";
        },
      ];
    },
    {
      name: "swapRouterBaseIn";
      discriminator: [69, 125, 115, 218, 245, 186, 242, 196];
      accounts: [
        {
          name: "payer";
          signer: true;
        },
        {
          name: "inputTokenAccount";
          writable: true;
        },
        {
          name: "inputTokenMint";
          writable: true;
        },
        {
          name: "tokenProgram";
        },
        {
          name: "tokenProgram2022";
        },
        {
          name: "memoProgram";
        },
      ];
      args: [
        {
          name: "amountIn";
          type: "u64";
        },
        {
          name: "amountOutMinimum";
          type: "u64";
        },
      ];
    },
  ];
  accounts: [
    {
      name: "ammConfig";
      discriminator: [218, 244, 33, 104, 203, 203, 43, 111];
    },
    {
      name: "operationState";
      discriminator: [19, 236, 58, 237, 81, 222, 183, 252];
    },
    {
      name: "observationState";
      discriminator: [122, 174, 197, 53, 129, 9, 165, 132];
    },
    {
      name: "personalPositionState";
      discriminator: [70, 111, 150, 126, 230, 15, 25, 117];
    },
    {
      name: "poolState";
      discriminator: [247, 237, 227, 245, 215, 195, 222, 70];
    },
    {
      name: "protocolPositionState";
      discriminator: [100, 226, 145, 99, 146, 218, 160, 106];
    },
    {
      name: "tickArrayState";
      discriminator: [192, 155, 85, 205, 49, 249, 129, 42];
    },
    {
      name: "tickArrayBitmapExtension";
      discriminator: [60, 150, 36, 219, 97, 128, 139, 153];
    },
  ];
  events: [
    {
      name: "configChangeEvent";
      discriminator: [247, 189, 7, 119, 106, 112, 95, 151];
    },
    {
      name: "createPersonalPositionEvent";
      discriminator: [100, 30, 87, 249, 196, 223, 154, 206];
    },
    {
      name: "increaseLiquidityEvent";
      discriminator: [49, 79, 105, 212, 32, 34, 30, 84];
    },
    {
      name: "decreaseLiquidityEvent";
      discriminator: [58, 222, 86, 58, 68, 50, 85, 56];
    },
    {
      name: "liquidityCalculateEvent";
      discriminator: [237, 112, 148, 230, 57, 84, 180, 162];
    },
    {
      name: "collectPersonalFeeEvent";
      discriminator: [166, 174, 105, 192, 81, 161, 83, 105];
    },
    {
      name: "updateRewardInfosEvent";
      discriminator: [109, 127, 186, 78, 114, 65, 37, 236];
    },
    {
      name: "poolCreatedEvent";
      discriminator: [25, 94, 75, 47, 112, 99, 53, 63];
    },
    {
      name: "collectProtocolFeeEvent";
      discriminator: [206, 87, 17, 79, 45, 41, 213, 61];
    },
    {
      name: "swapEvent";
      discriminator: [64, 198, 205, 232, 38, 8, 113, 226];
    },
    {
      name: "liquidityChangeEvent";
      discriminator: [126, 240, 175, 206, 158, 88, 153, 107];
    },
  ];
  errors: [
    {
      code: 6000;
      name: "lok";
      msg: "lok";
    },
    {
      code: 6001;
      name: "notApproved";
      msg: "Not approved";
    },
    {
      code: 6002;
      name: "invalidUpdateConfigFlag";
      msg: "invalid update amm config flag";
    },
    {
      code: 6003;
      name: "accountLack";
      msg: "Account lack";
    },
    {
      code: 6004;
      name: "closePositionErr";
      msg: "Remove liquitity, collect fees owed and reward then you can close position account";
    },
    {
      code: 6005;
      name: "zeroMintAmount";
      msg: "Minting amount should be greater than 0";
    },
    {
      code: 6006;
      name: "invaildTickIndex";
      msg: "Tick out of range";
    },
    {
      code: 6007;
      name: "tickInvaildOrder";
      msg: "The lower tick must be below the upper tick";
    },
    {
      code: 6008;
      name: "tickLowerOverflow";
      msg: "The tick must be greater, or equal to the minimum tick(-221818)";
    },
    {
      code: 6009;
      name: "tickUpperOverflow";
      msg: "The tick must be lesser than, or equal to the maximum tick(221818)";
    },
    {
      code: 6010;
      name: "tickAndSpacingNotMatch";
      msg: "tick % tick_spacing must be zero";
    },
    {
      code: 6011;
      name: "invalidTickArray";
      msg: "Invaild tick array account";
    },
    {
      code: 6012;
      name: "invalidTickArrayBoundary";
      msg: "Invaild tick array boundary";
    },
    {
      code: 6013;
      name: "sqrtPriceLimitOverflow";
      msg: "Square root price limit overflow";
    },
    {
      code: 6014;
      name: "sqrtPriceX64";
      msg: "sqrt_price_x64 out of range";
    },
    {
      code: 6015;
      name: "liquiditySubValueErr";
      msg: "Liquidity sub delta L must be smaller than before";
    },
    {
      code: 6016;
      name: "liquidityAddValueErr";
      msg: "Liquidity add delta L must be greater, or equal to before";
    },
    {
      code: 6017;
      name: "invaildLiquidity";
      msg: "Invaild liquidity when update position";
    },
    {
      code: 6018;
      name: "forbidBothZeroForSupplyLiquidity";
      msg: "Both token amount must not be zero while supply liquidity";
    },
    {
      code: 6019;
      name: "liquidityInsufficient";
      msg: "Liquidity insufficient";
    },
    {
      code: 6020;
      name: "transactionTooOld";
      msg: "Transaction too old";
    },
    {
      code: 6021;
      name: "priceSlippageCheck";
      msg: "Price slippage check";
    },
    {
      code: 6022;
      name: "tooLittleOutputReceived";
      msg: "Too little output received";
    },
    {
      code: 6023;
      name: "tooMuchInputPaid";
      msg: "Too much input paid";
    },
    {
      code: 6024;
      name: "invaildSwapAmountSpecified";
      msg: "Swap special amount can not be zero";
    },
    {
      code: 6025;
      name: "invalidInputPoolVault";
      msg: "Input pool vault is invalid";
    },
    {
      code: 6026;
      name: "tooSmallInputOrOutputAmount";
      msg: "Swap input or output amount is too small";
    },
    {
      code: 6027;
      name: "notEnoughTickArrayAccount";
      msg: "Not enought tick array account";
    },
    {
      code: 6028;
      name: "invalidFirstTickArrayAccount";
      msg: "Invaild first tick array account";
    },
    {
      code: 6029;
      name: "invalidRewardIndex";
      msg: "Invalid reward index";
    },
    {
      code: 6030;
      name: "fullRewardInfo";
      msg: "The init reward token reach to the max";
    },
    {
      code: 6031;
      name: "rewardTokenAlreadyInUse";
      msg: "The init reward token already in use";
    },
    {
      code: 6032;
      name: "exceptPoolVaultMint";
      msg: "The reward tokens must contain one of pool vault mint except the last reward";
    },
    {
      code: 6033;
      name: "invalidRewardInitParam";
      msg: "Invalid reward init param";
    },
    {
      code: 6034;
      name: "invalidRewardDesiredAmount";
      msg: "Invalid collect reward desired amount";
    },
    {
      code: 6035;
      name: "invalidRewardInputAccountNumber";
      msg: "Invalid collect reward input account number";
    },
    {
      code: 6036;
      name: "invalidRewardPeriod";
      msg: "Invalid reward period";
    },
    {
      code: 6037;
      name: "notApproveUpdateRewardEmissiones";
      msg: "Modification of emissiones is allowed within 72 hours from the end of the previous cycle";
    },
    {
      code: 6038;
      name: "unInitializedRewardInfo";
      msg: "uninitialized reward info";
    },
    {
      code: 6039;
      name: "notSupportMint";
      msg: "Not support token_2022 mint extension";
    },
    {
      code: 6040;
      name: "missingTickArrayBitmapExtensionAccount";
      msg: "Missing tickarray bitmap extension account";
    },
    {
      code: 6041;
      name: "insufficientLiquidityForDirection";
      msg: "Insufficient liquidity for this direction";
    },
  ];
  types: [
    {
      name: "initializeRewardParam";
      type: {
        kind: "struct";
        fields: [
          {
            name: "openTime";
            type: "u64";
          },
          {
            name: "endTime";
            type: "u64";
          },
          {
            name: "emissionsPerSecondX64";
            type: "u128";
          },
        ];
      };
    },
    {
      name: "observation";
      type: {
        kind: "struct";
        fields: [
          {
            name: "blockTimestamp";
            type: "u32";
          },
          {
            name: "tickCumulative";
            type: "i64";
          },
          {
            name: "padding";
            type: {
              array: ["u64", 4];
            };
          },
        ];
      };
    },
    {
      name: "positionRewardInfo";
      type: {
        kind: "struct";
        fields: [
          {
            name: "growthInsideLastX64";
            type: "u128";
          },
          {
            name: "rewardAmountOwed";
            type: "u64";
          },
        ];
      };
    },
    {
      name: "rewardInfo";
      type: {
        kind: "struct";
        fields: [
          {
            name: "rewardState";
            type: "u8";
          },
          {
            name: "openTime";
            type: "u64";
          },
          {
            name: "endTime";
            type: "u64";
          },
          {
            name: "lastUpdateTime";
            type: "u64";
          },
          {
            name: "emissionsPerSecondX64";
            type: "u128";
          },
          {
            name: "rewardTotalEmissioned";
            type: "u64";
          },
          {
            name: "rewardClaimed";
            type: "u64";
          },
          {
            name: "tokenMint";
            type: "pubkey";
          },
          {
            name: "tokenVault";
            type: "pubkey";
          },
          {
            name: "authority";
            type: "pubkey";
          },
          {
            name: "rewardGrowthGlobalX64";
            type: "u128";
          },
        ];
      };
    },
    {
      name: "tickState";
      type: {
        kind: "struct";
        fields: [
          {
            name: "tick";
            type: "i32";
          },
          {
            name: "liquidityNet";
            type: "i128";
          },
          {
            name: "liquidityGross";
            type: "u128";
          },
          {
            name: "feeGrowthOutside0X64";
            type: "u128";
          },
          {
            name: "feeGrowthOutside1X64";
            type: "u128";
          },
          {
            name: "rewardGrowthsOutsideX64";
            type: {
              array: ["u128", 3];
            };
          },
          {
            name: "padding";
            type: {
              array: ["u32", 13];
            };
          },
        ];
      };
    },
    {
      name: "poolStatusBitIndex";
      type: {
        kind: "enum";
        variants: [
          {
            name: "openPositionOrIncreaseLiquidity";
          },
          {
            name: "decreaseLiquidity";
          },
          {
            name: "collectFee";
          },
          {
            name: "collectReward";
          },
          {
            name: "swap";
          },
        ];
      };
    },
    {
      name: "poolStatusBitFlag";
      type: {
        kind: "enum";
        variants: [
          {
            name: "enable";
          },
          {
            name: "disable";
          },
        ];
      };
    },
    {
      name: "rewardState";
      type: {
        kind: "enum";
        variants: [
          {
            name: "uninitialized";
          },
          {
            name: "initialized";
          },
          {
            name: "opening";
          },
          {
            name: "ended";
          },
        ];
      };
    },
    {
      name: "tickArryBitmap";
      type: {
        kind: "type";
        alias: {
          array: ["u64", 8];
        };
      };
    },
    {
      name: "ammConfig";
      type: {
        kind: "struct";
        fields: [
          {
            name: "bump";
            type: "u8";
          },
          {
            name: "index";
            type: "u16";
          },
          {
            name: "owner";
            type: "pubkey";
          },
          {
            name: "protocolFeeRate";
            type: "u32";
          },
          {
            name: "tradeFeeRate";
            type: "u32";
          },
          {
            name: "tickSpacing";
            type: "u16";
          },
          {
            name: "fundFeeRate";
            type: "u32";
          },
          {
            name: "paddingU32";
            type: "u32";
          },
          {
            name: "fundOwner";
            type: "pubkey";
          },
          {
            name: "padding";
            type: {
              array: ["u64", 3];
            };
          },
        ];
      };
    },
    {
      name: "operationState";
      type: {
        kind: "struct";
        fields: [
          {
            name: "bump";
            type: "u8";
          },
          {
            name: "operationOwners";
            type: {
              array: ["pubkey", 10];
            };
          },
          {
            name: "whitelistMints";
            type: {
              array: ["pubkey", 100];
            };
          },
        ];
      };
    },
    {
      name: "observationState";
      type: {
        kind: "struct";
        fields: [
          {
            name: "initialized";
            type: "bool";
          },
          {
            name: "recentEpoch";
            type: "u64";
          },
          {
            name: "observationIndex";
            type: "u16";
          },
          {
            name: "poolId";
            type: "pubkey";
          },
          {
            name: "observations";
            type: {
              array: [
                {
                  defined: {
                    name: "observation";
                  };
                },
                100,
              ];
            };
          },
          {
            name: "padding";
            type: {
              array: ["u64", 4];
            };
          },
        ];
      };
    },
    {
      name: "personalPositionState";
      type: {
        kind: "struct";
        fields: [
          {
            name: "bump";
            type: "u8";
          },
          {
            name: "nftMint";
            type: "pubkey";
          },
          {
            name: "poolId";
            type: "pubkey";
          },
          {
            name: "tickLowerIndex";
            type: "i32";
          },
          {
            name: "tickUpperIndex";
            type: "i32";
          },
          {
            name: "liquidity";
            type: "u128";
          },
          {
            name: "feeGrowthInside0LastX64";
            type: "u128";
          },
          {
            name: "feeGrowthInside1LastX64";
            type: "u128";
          },
          {
            name: "tokenFeesOwed0";
            type: "u64";
          },
          {
            name: "tokenFeesOwed1";
            type: "u64";
          },
          {
            name: "rewardInfos";
            type: {
              array: [
                {
                  defined: {
                    name: "positionRewardInfo";
                  };
                },
                3,
              ];
            };
          },
          {
            name: "recentEpoch";
            type: "u64";
          },
          {
            name: "padding";
            type: {
              array: ["u64", 7];
            };
          },
        ];
      };
    },
    {
      name: "poolState";
      type: {
        kind: "struct";
        fields: [
          {
            name: "bump";
            type: {
              array: ["u8", 1];
            };
          },
          {
            name: "ammConfig";
            type: "pubkey";
          },
          {
            name: "owner";
            type: "pubkey";
          },
          {
            name: "tokenMint0";
            type: "pubkey";
          },
          {
            name: "tokenMint1";
            type: "pubkey";
          },
          {
            name: "tokenVault0";
            type: "pubkey";
          },
          {
            name: "tokenVault1";
            type: "pubkey";
          },
          {
            name: "observationKey";
            type: "pubkey";
          },
          {
            name: "mintDecimals0";
            type: "u8";
          },
          {
            name: "mintDecimals1";
            type: "u8";
          },
          {
            name: "tickSpacing";
            type: "u16";
          },
          {
            name: "liquidity";
            type: "u128";
          },
          {
            name: "sqrtPriceX64";
            type: "u128";
          },
          {
            name: "tickCurrent";
            type: "i32";
          },
          {
            name: "padding3";
            type: "u16";
          },
          {
            name: "padding4";
            type: "u16";
          },
          {
            name: "feeGrowthGlobal0X64";
            type: "u128";
          },
          {
            name: "feeGrowthGlobal1X64";
            type: "u128";
          },
          {
            name: "protocolFeesToken0";
            type: "u64";
          },
          {
            name: "protocolFeesToken1";
            type: "u64";
          },
          {
            name: "swapInAmountToken0";
            type: "u128";
          },
          {
            name: "swapOutAmountToken1";
            type: "u128";
          },
          {
            name: "swapInAmountToken1";
            type: "u128";
          },
          {
            name: "swapOutAmountToken0";
            type: "u128";
          },
          {
            name: "status";
            type: "u8";
          },
          {
            name: "padding";
            type: {
              array: ["u8", 7];
            };
          },
          {
            name: "rewardInfos";
            type: {
              array: [
                {
                  defined: {
                    name: "rewardInfo";
                  };
                },
                3,
              ];
            };
          },
          {
            name: "tickArrayBitmap";
            type: {
              array: ["u64", 16];
            };
          },
          {
            name: "totalFeesToken0";
            type: "u64";
          },
          {
            name: "totalFeesClaimedToken0";
            type: "u64";
          },
          {
            name: "totalFeesToken1";
            type: "u64";
          },
          {
            name: "totalFeesClaimedToken1";
            type: "u64";
          },
          {
            name: "fundFeesToken0";
            type: "u64";
          },
          {
            name: "fundFeesToken1";
            type: "u64";
          },
          {
            name: "openTime";
            type: "u64";
          },
          {
            name: "recentEpoch";
            type: "u64";
          },
          {
            name: "padding1";
            type: {
              array: ["u64", 24];
            };
          },
          {
            name: "padding2";
            type: {
              array: ["u64", 32];
            };
          },
        ];
      };
    },
    {
      name: "protocolPositionState";
      type: {
        kind: "struct";
        fields: [
          {
            name: "bump";
            type: "u8";
          },
          {
            name: "poolId";
            type: "pubkey";
          },
          {
            name: "tickLowerIndex";
            type: "i32";
          },
          {
            name: "tickUpperIndex";
            type: "i32";
          },
          {
            name: "liquidity";
            type: "u128";
          },
          {
            name: "feeGrowthInside0LastX64";
            type: "u128";
          },
          {
            name: "feeGrowthInside1LastX64";
            type: "u128";
          },
          {
            name: "tokenFeesOwed0";
            type: "u64";
          },
          {
            name: "tokenFeesOwed1";
            type: "u64";
          },
          {
            name: "rewardGrowthInside";
            type: {
              array: ["u128", 3];
            };
          },
          {
            name: "recentEpoch";
            type: "u64";
          },
          {
            name: "padding";
            type: {
              array: ["u64", 7];
            };
          },
        ];
      };
    },
    {
      name: "tickArrayState";
      type: {
        kind: "struct";
        fields: [
          {
            name: "poolId";
            type: "pubkey";
          },
          {
            name: "startTickIndex";
            type: "i32";
          },
          {
            name: "ticks";
            type: {
              array: [
                {
                  defined: {
                    name: "tickState";
                  };
                },
                60,
              ];
            };
          },
          {
            name: "initializedTickCount";
            type: "u8";
          },
          {
            name: "recentEpoch";
            type: "u64";
          },
          {
            name: "padding";
            type: {
              array: ["u8", 107];
            };
          },
        ];
      };
    },
    {
      name: "tickArrayBitmapExtension";
      type: {
        kind: "struct";
        fields: [
          {
            name: "poolId";
            type: "pubkey";
          },
          {
            name: "positiveTickArrayBitmap";
            type: {
              array: [
                {
                  array: ["u64", 8];
                },
                14,
              ];
            };
          },
          {
            name: "negativeTickArrayBitmap";
            type: {
              array: [
                {
                  array: ["u64", 8];
                },
                14,
              ];
            };
          },
        ];
      };
    },
    {
      name: "configChangeEvent";
      type: {
        kind: "struct";
        fields: [
          {
            name: "index";
            type: "u16";
          },
          {
            name: "owner";
            type: "pubkey";
          },
          {
            name: "protocolFeeRate";
            type: "u32";
          },
          {
            name: "tradeFeeRate";
            type: "u32";
          },
          {
            name: "tickSpacing";
            type: "u16";
          },
          {
            name: "fundFeeRate";
            type: "u32";
          },
          {
            name: "fundOwner";
            type: "pubkey";
          },
        ];
      };
    },
    {
      name: "createPersonalPositionEvent";
      type: {
        kind: "struct";
        fields: [
          {
            name: "poolState";
            type: "pubkey";
          },
          {
            name: "minter";
            type: "pubkey";
          },
          {
            name: "nftOwner";
            type: "pubkey";
          },
          {
            name: "tickLowerIndex";
            type: "i32";
          },
          {
            name: "tickUpperIndex";
            type: "i32";
          },
          {
            name: "liquidity";
            type: "u128";
          },
          {
            name: "depositAmount0";
            type: "u64";
          },
          {
            name: "depositAmount1";
            type: "u64";
          },
          {
            name: "depositAmount0TransferFee";
            type: "u64";
          },
          {
            name: "depositAmount1TransferFee";
            type: "u64";
          },
        ];
      };
    },
    {
      name: "increaseLiquidityEvent";
      type: {
        kind: "struct";
        fields: [
          {
            name: "positionNftMint";
            type: "pubkey";
          },
          {
            name: "liquidity";
            type: "u128";
          },
          {
            name: "amount0";
            type: "u64";
          },
          {
            name: "amount1";
            type: "u64";
          },
          {
            name: "amount0TransferFee";
            type: "u64";
          },
          {
            name: "amount1TransferFee";
            type: "u64";
          },
        ];
      };
    },
    {
      name: "decreaseLiquidityEvent";
      type: {
        kind: "struct";
        fields: [
          {
            name: "positionNftMint";
            type: "pubkey";
          },
          {
            name: "liquidity";
            type: "u128";
          },
          {
            name: "decreaseAmount0";
            type: "u64";
          },
          {
            name: "decreaseAmount1";
            type: "u64";
          },
          {
            name: "feeAmount0";
            type: "u64";
          },
          {
            name: "feeAmount1";
            type: "u64";
          },
          {
            name: "rewardAmounts";
            type: {
              array: ["u64", 3];
            };
          },
          {
            name: "transferFee0";
            type: "u64";
          },
          {
            name: "transferFee1";
            type: "u64";
          },
        ];
      };
    },
    {
      name: "liquidityCalculateEvent";
      type: {
        kind: "struct";
        fields: [
          {
            name: "poolLiquidity";
            type: "u128";
          },
          {
            name: "poolSqrtPriceX64";
            type: "u128";
          },
          {
            name: "poolTick";
            type: "i32";
          },
          {
            name: "calcAmount0";
            type: "u64";
          },
          {
            name: "calcAmount1";
            type: "u64";
          },
          {
            name: "tradeFeeOwed0";
            type: "u64";
          },
          {
            name: "tradeFeeOwed1";
            type: "u64";
          },
          {
            name: "transferFee0";
            type: "u64";
          },
          {
            name: "transferFee1";
            type: "u64";
          },
        ];
      };
    },
    {
      name: "collectPersonalFeeEvent";
      type: {
        kind: "struct";
        fields: [
          {
            name: "positionNftMint";
            type: "pubkey";
          },
          {
            name: "recipientTokenAccount0";
            type: "pubkey";
          },
          {
            name: "recipientTokenAccount1";
            type: "pubkey";
          },
          {
            name: "amount0";
            type: "u64";
          },
          {
            name: "amount1";
            type: "u64";
          },
        ];
      };
    },
    {
      name: "updateRewardInfosEvent";
      type: {
        kind: "struct";
        fields: [
          {
            name: "rewardGrowthGlobalX64";
            type: {
              array: ["u128", 3];
            };
          },
        ];
      };
    },
    {
      name: "poolCreatedEvent";
      type: {
        kind: "struct";
        fields: [
          {
            name: "tokenMint0";
            type: "pubkey";
          },
          {
            name: "tokenMint1";
            type: "pubkey";
          },
          {
            name: "tickSpacing";
            type: "u16";
          },
          {
            name: "poolState";
            type: "pubkey";
          },
          {
            name: "sqrtPriceX64";
            type: "u128";
          },
          {
            name: "tick";
            type: "i32";
          },
          {
            name: "tokenVault0";
            type: "pubkey";
          },
          {
            name: "tokenVault1";
            type: "pubkey";
          },
        ];
      };
    },
    {
      name: "collectProtocolFeeEvent";
      type: {
        kind: "struct";
        fields: [
          {
            name: "poolState";
            type: "pubkey";
          },
          {
            name: "recipientTokenAccount0";
            type: "pubkey";
          },
          {
            name: "recipientTokenAccount1";
            type: "pubkey";
          },
          {
            name: "amount0";
            type: "u64";
          },
          {
            name: "amount1";
            type: "u64";
          },
        ];
      };
    },
    {
      name: "swapEvent";
      type: {
        kind: "struct";
        fields: [
          {
            name: "poolState";
            type: "pubkey";
          },
          {
            name: "sender";
            type: "pubkey";
          },
          {
            name: "tokenAccount0";
            type: "pubkey";
          },
          {
            name: "tokenAccount1";
            type: "pubkey";
          },
          {
            name: "amount0";
            type: "u64";
          },
          {
            name: "transferFee0";
            type: "u64";
          },
          {
            name: "amount1";
            type: "u64";
          },
          {
            name: "transferFee1";
            type: "u64";
          },
          {
            name: "zeroForOne";
            type: "bool";
          },
          {
            name: "sqrtPriceX64";
            type: "u128";
          },
          {
            name: "liquidity";
            type: "u128";
          },
          {
            name: "tick";
            type: "i32";
          },
        ];
      };
    },
    {
      name: "liquidityChangeEvent";
      type: {
        kind: "struct";
        fields: [
          {
            name: "poolState";
            type: "pubkey";
          },
          {
            name: "tick";
            type: "i32";
          },
          {
            name: "tickLower";
            type: "i32";
          },
          {
            name: "tickUpper";
            type: "i32";
          },
          {
            name: "liquidityBefore";
            type: "u128";
          },
          {
            name: "liquidityAfter";
            type: "u128";
          },
        ];
      };
    },
  ];
};
