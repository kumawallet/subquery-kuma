import { SubstrateProject } from "@subql/types";
import {
  EthereumProject,
  EthereumDatasourceKind,
  EthereumHandlerKind,
} from "@subql/types-ethereum";
import { ERC20 } from "../src/contants/evm-erc20";

type SubtrateBaseConfig = Pick<
  SubstrateProject,
  "specVersion" | "version" | "name" | "description" | "runner" | "schema"
>;

export const getSubtrateBaseConfig = (
  chainName: string
): SubtrateBaseConfig => {
  return {
    specVersion: "1.0.0",
    version: "0.0.1",
    name: chainName,
    description: "Kuma Subquery Porject",
    runner: {
      node: {
        name: "@subql/node",
        version: ">=3.0.1",
      },
      query: {
        name: "@subql/query",
        version: "*",
      },
    },
    schema: {
      file: "./schema.graphql",
    },
  };
};

export const getEVMBaseConfig = (chainName: string): SubtrateBaseConfig => {
  return {
    specVersion: "1.0.0",
    version: "0.0.1",
    name: chainName,
    description: "Kuma Subquery Porject",
    runner: {
      node: {
        name: "@subql/node-ethereum",
        version: ">=3.0.0",
      },
      query: {
        name: "@subql/query",
        version: "*",
      },
    },
    schema: {
      file: "./schema.graphql",
    },
  };
};

export const erc20DataSources = (
  chainName: string
): EthereumProject["dataSources"] => {
  const erc20 = ERC20[chainName];

  return Object.keys(erc20).map((key) => ({
    kind: EthereumDatasourceKind.Runtime,
    startBlock: erc20[key].startBlock,
    options: {
      abi: "erc20",
      address: key,
    },
    assets: new Map([["erc20", { file: "./abis/erc20.abi.json" }]]),
    mapping: {
      file: "./dist/index.js",
      handlers: [
        {
          kind: EthereumHandlerKind.Call,
          handler: `handleErc20Transfer${chainName}`,
          filter: {
            function: "transfer(address to, uint256 value)",
          },
          // kind: EthereumHandlerKind.Event,
          // handler: `handleErc20Transfer${chainName}`,
          // filter: {

          //   topics: [
          //     "Transfer(address indexed from, address indexed to, uint256 amount)",
          //   ],
          // },
        },
      ],
    },
  }));
};
