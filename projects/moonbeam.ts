import {
  SubstrateDatasourceKind,
  SubstrateHandlerKind,
  SubstrateProject,
} from "@subql/types";
import { getSubtrateBaseConfig } from "./base-config";

const project: SubstrateProject = {
  ...getSubtrateBaseConfig("Moonbeam"),
  network: {
    chainId:
      "0xfe58ea77779b7abda7da4ec526d14db9b1e9cd40a217c34892af80a9b332b76d",
    endpoint: ["wss://moonbeam-rpc.dwellir.com"],
  },
  dataSources: [
    {
      kind: SubstrateDatasourceKind.Runtime,
      startBlock: 150000,
      mapping: {
        file: "./dist/index.js",
        handlers: [
          {
            kind: SubstrateHandlerKind.Event,
            handler: "handleAssetCreated",
            filter: {
              module: "assets",
              method: "MetadataSet",
            },
          },
          {
            kind: SubstrateHandlerKind.Event,
            handler: "handleAssetTransferMoonbeam",
            filter: {
              module: "balances",
              method: "Transfer",
            },
          },
          {
            kind: SubstrateHandlerKind.Event,
            handler: "handleAssetTransferMoonbeam",
            filter: {
              module: "assets",
              method: "Transferred",
            },
          },
          {
            kind: SubstrateHandlerKind.Event,
            handler: "handleAssetTransferMoonbeam",
            filter: {
              module: "assets",
              method: "Burned",
            },
          },
          {
            kind: SubstrateHandlerKind.Event,
            handler: "handleParachainRewardMoonbeam",
            filter: {
              module: "localassets",
              method: "Transferred",
            },
          },
        ],
      },
    },
  ],
};

export default project;
