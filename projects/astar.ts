import {
  SubstrateDatasourceKind,
  SubstrateHandlerKind,
  SubstrateProject,
} from "@subql/types";
import { getSubtrateBaseConfig } from "./base-config";

const project: SubstrateProject = {
  ...getSubtrateBaseConfig("Astar"),
  network: {
    chainId:
      "0x9eb76c5184c4ab8679d2d5d819fdf90b9c001403e9e17da2e14b6d8aec4029c6",
    endpoint: ["wss://rpc.astar.network"],
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
            handler: "handleAssetCreated",
            filter: {
              module: "assets",
              method: "MetadataSet",
            },
          },
          {
            kind: SubstrateHandlerKind.Event,
            handler: "handleAssetTransferAstar",
            filter: {
              module: "balances",
              method: "Transfer",
            },
          },
          {
            kind: SubstrateHandlerKind.Event,
            handler: "handleAssetTransferAstar",
            filter: {
              module: "assets",
              method: "Transferred",
            },
          },
          {
            kind: SubstrateHandlerKind.Event,
            handler: "handleAssetTransferAstar",
            filter: {
              module: "assets",
              method: "Burned",
            },
          },
        ],
      },
    },
  ],
};

export default project;
