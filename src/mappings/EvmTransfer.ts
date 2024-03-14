import { EthereumTransaction } from "@subql/types-ethereum";
import { Status, Transaction, TransactionType } from "../types";
import { EVM_CHAINS } from "../contants/evm-chains";
import { ERC20 } from "../contants/evm-erc20";
import { parseBigumber } from "../utils/parse-amounts";

const getStatus = (type: string, status: boolean) => {
  if (Number(type) === 0) return Status.SUCCESS;

  return status ? Status.SUCCESS : Status.FAILED;
};

export const handleErc20Transfer = async (
  tx: EthereumTransaction,
  chainName: string
): Promise<void> => {
  if (tx.to && tx.from) {
    const nativeAssetDecimals = EVM_CHAINS[chainName.toUpperCase()].decimals;
    const asset = ERC20[chainName][tx.to.toLowerCase()];
    const amount = parseBigumber(tx.args[1]?.toString(), asset?.decimals || 1);
    const { gasUsed, effectiveGasPrice, status, type } = await tx.receipt();

    const fee = parseBigumber(
      String(gasUsed * effectiveGasPrice),
      nativeAssetDecimals || 1
    );

    const transaction = Transaction.create({
      id: tx.hash,
      blockNumber: Number(BigInt(tx.blockNumber)),
      hash: tx.hash,
      originNetwork: chainName,
      targetNetwork: chainName,
      type: TransactionType.Transfer,
      sender: tx.from,
      recipient: tx.args[0],
      asset: asset?.symbol || "",
      amount,
      fee: fee,
      status: getStatus(type, status),
      tip: "",
    });

    // logger.info(`ERC20 transaction ${JSON.stringify(transaction, null, 2)}`);
    // logger.info(
    //   JSON.stringify({
    //     status,
    //     type,
    //     to: tx.to,
    //   })
    // );

    await transaction.save();
  }
};

export const handleNativeTransfer = async (
  tx: EthereumTransaction,
  chainName: string
): Promise<void> => {
  if (tx.input === "0x" && tx.to && tx.from) {
    const nativeAssetDecimals = EVM_CHAINS[chainName.toUpperCase()].decimals;
    const amount = parseBigumber(
      tx.value?.toString(),
      nativeAssetDecimals || 1
    );
    const { gasUsed, effectiveGasPrice, status, type, ...r } =
      await tx.receipt();

    const fee = parseBigumber(
      String(gasUsed * effectiveGasPrice),
      nativeAssetDecimals || 1
    );

    const transaction = Transaction.create({
      id: tx.hash,
      blockNumber: Number(BigInt(tx.blockNumber)),
      hash: tx.hash,
      originNetwork: chainName,
      targetNetwork: chainName,
      type: TransactionType.Transfer,
      sender: tx.from,
      recipient: tx.to,
      asset: EVM_CHAINS[chainName.toUpperCase()].symbol,
      amount,
      fee: fee,
      status: getStatus(type, status),
      tip: "",
    });

    // logger.info(`native transaction ${JSON.stringify(transaction, null, 2)}`);
    // logger.info(
    //   JSON.stringify({
    //     status,
    //     type,
    //   })
    // );
    await transaction.save();
  }
};
