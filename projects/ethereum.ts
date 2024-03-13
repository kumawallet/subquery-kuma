import {
  EthereumProject,
  EthereumDatasourceKind,
  EthereumHandlerKind,
} from "@subql/types-ethereum";
import { erc20DataSources, getEVMBaseConfig } from "./base-config";

const project: EthereumProject = {
  ...getEVMBaseConfig("Ethereum"),
  network: {
    chainId: "1",
    endpoint: [
      "https://rpc.ankr.com/eth",
      "https://eth.api.onfinality.io/public",
      "https://eth.llamarpc.com",
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
            handler: "handleNativeTransferEthereum",
            filter: {
              function: "0x",
            },
          },
        ],
      },
    },
    ...erc20DataSources("Ethereum"),
  ],
};

export default project;
