import {
  EthereumProject,
  EthereumDatasourceKind,
  EthereumHandlerKind,
} from "@subql/types-ethereum";
import { erc20DataSources, getEVMBaseConfig } from "./base-config";

const project: EthereumProject = {
  ...getEVMBaseConfig("Polygon"),
  network: {
    chainId: "137",
    endpoint: [
      "https://polygon-rpc.com/",
      "https://rpc.ankr.com/polygon",
      "https://polygon-mainnet.public.blastapi.io",
    ],
  },
  dataSources: [
    {
      kind: EthereumDatasourceKind.Runtime,
      startBlock: 1,
      options: {
        abi: "erc20",
      },
      assets: new Map([["erc20", { file: "../abis/erc20.abi.json" }]]),
      mapping: {
        file: "./dist/index.js",
        handlers: [
          {
            kind: EthereumHandlerKind.Call,
            handler: "handleNativeTransferPolygon",
            filter: {
              function: "0x",
            },
          },
        ],
      },
    },
    ...erc20DataSources("Polygon"),
  ],
};

export default project;
