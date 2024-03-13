import {
  SubstrateDatasourceKind,
  SubstrateHandlerKind,
  SubstrateProject,
} from "@subql/types";
import { getSubtrateBaseConfig } from "./base-config";

const project: SubstrateProject = {
  ...getSubtrateBaseConfig("Acala"),
  network: {
    chainId:
      "0xfc41b9bd8ef8fe53d58c7ea67c794c7ec9a73daf05e6d54b14ff6342c99ba64c",
    endpoint: ["wss://acala.polkawallet.io"],
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
          // {
          //   kind: SubstrateHandlerKind.Event,
          //   handler: "handleAssetTransferAstar",
          //   filter: {
          //     module: "tokens",
          //     method: "Transfer",
          //   },
          // },
        ],
      },
    },
  ],
};

export default project;
