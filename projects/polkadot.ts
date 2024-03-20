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
    endpoint: [
      "wss://apps-rpc.polkadot.io",
      "wss://polkadot-rpc.dwellir.com",
      "wss://polkadot-rpc-tn.dwellir.com",
      "wss://rpc.ibp.network/polkadot",
      "wss://rpc.dotters.network/polkadot",
      "wss://1rpc.io/dot",
      "wss://rpc-polkadot.luckyfriday.io",
      "wss://polkadot.public.curie.radiumblock.co/ws",
      "wss://dot-rpc.stakeworld.io",
    ],
  },
  dataSources: [
    {
      kind: SubstrateDatasourceKind.Runtime,
      startBlock: 19810396,
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
            handler: "handleRewardedPolkadot",
            filter: {
              module: "staking",
              method: "Rewarded",
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
          {
            kind: SubstrateHandlerKind.Event,
            handler: "handlePoolRewardPolkadot",
            filter: {
              module: "nominationPools",
              method: "PaidOut",
            },
          },
        ],
      },
    },
  ],
};

export default project;
