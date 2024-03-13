import {
  SubstrateDatasourceKind,
  SubstrateHandlerKind,
  SubstrateProject,
} from "@subql/types";
import { getSubtrateBaseConfig } from "./base-config";

const project: SubstrateProject = {
  ...getSubtrateBaseConfig("Polkadot"),
  network: {
    chainId:
      "0x91b171bb158e2d3848fa23a9f1c25182fb8e20313b2c1eb49219da7a70ce90c3",
    endpoint: ["wss://polkadot.api.onfinality.io/public-ws"],
  },
  dataSources: [
    {
      kind: SubstrateDatasourceKind.Runtime,
      startBlock: 1,
      mapping: {
        file: "./dist/index.js",
        handlers: [
          {
            kind: SubstrateHandlerKind.Event,
            handler: "handleAssetTransferPolkadot",
            filter: {
              module: "balances",
              method: "Transfer",
            },
          },
          {
            kind: SubstrateHandlerKind.Event,
            handler: "handleReward",
            filter: {
              module: "staking",
              method: "Reward",
            },
          },
          {
            kind: SubstrateHandlerKind.Event,
            handler: "handleRewarded",
            filter: {
              module: "staking",
              method: "Rewarded",
            },
          },
          {
            kind: SubstrateHandlerKind.Event,
            handler: "handlePoolReward",
            filter: {
              module: "nominationPools",
              method: "PaidOut",
            },
          },
          {
            kind: SubstrateHandlerKind.Event,
            handler: "handleSlash",
            filter: {
              module: "staking",
              method: "Slash",
            },
          },
          {
            kind: SubstrateHandlerKind.Event,
            handler: "handleSlashed",
            filter: {
              module: "staking",
              method: "Slashed",
            },
          },
          {
            kind: SubstrateHandlerKind.Event,
            handler: "handlePoolBondedSlash",
            filter: {
              module: "nominationPools",
              method: "PoolSlashed",
            },
          },
          {
            kind: SubstrateHandlerKind.Event,
            handler: "handlePoolUnbondingSlash",
            filter: {
              module: "nominationPools",
              method: "UnbondingPoolSlashed",
            },
          },
          {
            kind: SubstrateHandlerKind.Event,
            handler: "handleNewEra",
            filter: {
              module: "staking",
              method: "StakingElection",
            },
          },
          {
            kind: SubstrateHandlerKind.Event,
            handler: "handleStakersElected",
            filter: {
              module: "staking",
              method: "StakersElected",
            },
          },
        ],
      },
    },
  ],
};

export default project;
