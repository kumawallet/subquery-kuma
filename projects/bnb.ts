import {
  EthereumProject,
  EthereumDatasourceKind,
  EthereumHandlerKind,
} from "@subql/types-ethereum";
import { erc20DataSources, getEVMBaseConfig } from "./base-config";

const project: EthereumProject = {
  ...getEVMBaseConfig("BNB"),
  network: {
    chainId: "56",
    endpoint: [
      "https://rpc.ankr.com/bsc",
      "https://bsc-dataseed2.binance.org",
      "https://bsc-dataseed3.binance.org",
      "https://bsc-dataseed4.binance.org",
    ],
  },
  dataSources: [
    {
      kind: EthereumDatasourceKind.Runtime,
      startBlock: 1,
      options: {
        abi: "erc20",
      },
      assets: new Map([["erc20", { file: "./abis/erc20.abi.json" }]]),
      mapping: {
        file: "./dist/index.js",
        handlers: [
          {
            kind: EthereumHandlerKind.Call,
            handler: "handleNativeTransferBNB",
            filter: {
              function: "0x",
            },
          },
        ],
      },
    },
    ...erc20DataSources("BNB"),
  ],
};

export default project;
