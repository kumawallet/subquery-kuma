import { SubstrateEvent } from "@subql/types";
import { SUBSTRATE_CHAINS } from "./contants/polkadot-chains";
import { handleParachainRewarded, handleRewarded } from "./mappings/Rewards";
import { handleAssetTransferred } from "./mappings/AssetTransfer";
import { EthereumTransaction } from "@subql/types-ethereum";
import {
  handleErc20Transfer,
  handleNativeTransfer,
} from "./mappings/EvmTransfer";
import { EVM_CHAINS } from "./contants/evm-chains";

export const handleAssetTransferPolkadot = async (event: SubstrateEvent) => {
  handleAssetTransferred(event, SUBSTRATE_CHAINS["POLKADOT"].name);
};

export const handleAssetTransferAstar = async (event: SubstrateEvent) => {
  handleAssetTransferred(event, SUBSTRATE_CHAINS["ASTAR"].name);
};

export const handleAssetTransferMoonbeam = async (event: SubstrateEvent) => {
  handleAssetTransferred(event, SUBSTRATE_CHAINS["MOONBEAM"].name);
};

// export const handleParachainRewardMoonbeam = async (event: SubstrateEvent) => {
//   handleParachainRewarded(event as any, SUBSTRATE_CHAINS["MOONBEAM"].name);
// };

// export const handleParachainRewardMoonriver = async (event: SubstrateEvent) => {
//   handleParachainRewarded(event as any, SUBSTRATE_CHAINS["MOONRIVER"].name);
// };

export const handleNativeTransferEthereum = async (tx: EthereumTransaction) => {
  handleNativeTransfer(tx, EVM_CHAINS["ETHEREUM"].name);
};

export const handleErc20TransferEthereum = async (tx: EthereumTransaction) => {
  handleErc20Transfer(tx, EVM_CHAINS["ETHEREUM"].name);
};

export const handleNativeTransferPolygon = async (tx: EthereumTransaction) => {
  handleNativeTransfer(tx, EVM_CHAINS["POLYGON"].name);
};

export const handleErc20TransferPolygon = async (tx: EthereumTransaction) => {
  handleErc20Transfer(tx, EVM_CHAINS["POLYGON"].name);
};

export const handleNativeTransferBNB = async (tx: EthereumTransaction) => {
  handleNativeTransfer(tx, EVM_CHAINS["BNB"].name);
};

export const handleErc20TransferBNB = async (tx: EthereumTransaction) => {
  handleErc20Transfer(tx, EVM_CHAINS["BNB"].name);
};
