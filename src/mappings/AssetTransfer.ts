import {
  SubstrateEvent,
  SubstrateExtrinsic,
  TypedEventRecord,
} from "@subql/types";
import { Asset, Status, Transaction } from "../types";
import { SUBSTRATE_CHAINS } from "../contants/polkadot-chains";
import {
  calculateFeeAsString,
  isEvmExecutedEvent,
  isEvmTransaction,
} from "./common";
import { ethereumEncode } from "@polkadot/util-crypto";
import { AnyTuple, Codec } from "@polkadot/types-codec/types";
import {
  getModuleVersion,
  handleXTokensTargetAddress,
} from "../utils/polkadot-utils";
import { evmToAddress } from "@polkadot/util-crypto";
import { parseBigumber } from "../utils/parse-amounts";

export const handleAssetTransferred = async (
  event: SubstrateEvent,
  chain: string
) => {
  const txInfo = await getTransferEventData(event, chain);

  if (txInfo) {
    const blockNumber = event.extrinsic.block.block.header.number.toNumber();

    const {
      amount,
      asset,
      fee,
      hash,
      recipient,
      sender,
      status,
      targetNetwork,
      type,
    } = txInfo;

    const tx = Transaction.create({
      id: hash,
      sender,
      recipient,
      amount: amount || "0",
      asset,
      fee,
      status,
      targetNetwork: targetNetwork || chain,
      type,
      blockNumber,
      hash,
      originNetwork: chain,
      tip: "0",
    });

    logger.info(`tx: ${JSON.stringify(tx, null, 2)}`);
  }
};

const getTransferEventData = async (event: SubstrateEvent, chain: string) => {
  const extrinsic = event.extrinsic;

  if (!extrinsic) return;

  let sender = "";
  let asset = SUBSTRATE_CHAINS[chain.toUpperCase()].symbol;
  let amount = "";
  let recipient = "";
  let hash = "";
  let status = "";
  let type = "transfer";
  let targetNetwork = "";
  let fee = "";

  const isEVM =
    extrinsic && isEvmTransaction(extrinsic.extrinsic.method as any);

  let _recipient = "";

  if (isEVM) {
    const executedEvent = extrinsic.events.find(isEvmExecutedEvent);
    if (!executedEvent) {
      return;
    }

    const {
      sender: _sender,
      recipient: evmRecipient,
      hash: _hash,
      success,
    } = getEvmTransferData(executedEvent);

    hash = _hash;
    sender = _sender;
    fee = calculateFeeAsString(extrinsic, sender);
    _recipient = evmRecipient;
    status = success ? Status.SUCCESS : Status.FAILED;
  } else {
    sender = extrinsic.extrinsic.signer.toString();
    hash = extrinsic.extrinsic.hash.toString();
    status = extrinsic.success ? Status.SUCCESS : Status.FAILED;
  }

  fee = calculateFeeAsString(extrinsic, sender);

  if (isAssetBurnedEvent(event)) {
    const { assetId, owner, balance } = getAssetBurnedEventData(event);

    const { amount: _amount, symbol } = await parseBalanceWithAsset(
      assetId,
      balance
    );

    asset = symbol;
    amount = _amount;

    const trasnformedSender = isEVM
      ? transformAddressToWASM(sender, chain)
      : sender;
    if (isTranferFromContract(trasnformedSender, owner)) {
      recipient = _recipient;
      type = "contract";
    } else {
      const xcmData = handleXcmTransfer(extrinsic);
      if (xcmData?.recipient && xcmData?.targetNetwork) {
        recipient = xcmData.recipient;
        targetNetwork = xcmData.targetNetwork;
      }
    }
  } else if (isAssetTransferredEvent(event)) {
    const isFirst = isFirstEvent(event, extrinsic, "assets", "Transferred");

    if (!isFirst) return;

    const {
      assetId: _assetId,
      from,
      to,
      balance,
    } = getAssetTransferredEventData(event);

    const trasnformedSender = isEVM
      ? transformAddressToWASM(sender, chain)
      : sender;
    if (isTranferFromContract(trasnformedSender, from)) {
      recipient = _recipient;
      type = "contract";
    } else {
      sender = from;
      recipient = to;

      const { amount: _amount, symbol } = await parseBalanceWithAsset(
        _assetId,
        balance
      );

      asset = symbol;
      amount = _amount;
    }
  } else if (isBalanceTransferEvent(event)) {
    const { to, balance } = getBalanceTransferEventData(event);

    amount = balance;

    const eventIsFirst = isFirstEvent(event, extrinsic, "balances", "Transfer");

    if (!eventIsFirst) return;

    const xcmData = handleXcmTransfer(extrinsic);
    if (xcmData?.recipient && xcmData?.targetNetwork) {
      recipient = xcmData.recipient;
      targetNetwork = xcmData.targetNetwork;
    } else {
      recipient = to.toString();
      const recipientIsContract = extrinsic.events.some((event) => {
        if (
          event.event.section === "balances" &&
          event.event.method === "Transfer"
        ) {
          const [from] = event.event.data;
          return from.toString() === to.toString();
        }
        return false;
      });

      if (recipientIsContract) {
        type = "contract";
      }
    }
  }

  return {
    sender,
    asset,
    amount,
    recipient,
    hash,
    type,
    status,
    targetNetwork,
    fee,
  };
};

const getEvmTransferData = (event: TypedEventRecord<Codec[]>) => {
  const sender = ethereumEncode(event.event.data?.[0]?.toString());
  const recipient = ethereumEncode(event.event.data?.[1]?.toString());
  const hash = event.event.data?.[2]?.toString();
  const success = !!(event.event.data?.[3].toJSON() as any).succeed;

  return {
    sender,
    recipient,
    hash,
    success,
  };
};

const isAssetBurnedEvent = (event: SubstrateEvent) => {
  return event.event.section === "assets" && event.event.method === "Burned";
};

const isAssetTransferredEvent = (event: SubstrateEvent) => {
  return (
    event.event.section === "assets" && event.event.method === "Transferred"
  );
};

const isBalanceTransferEvent = (event: SubstrateEvent) => {
  return (
    event.event.section === "balances" && event.event.method === "Transfer"
  );
};

const findXTokensEvent = ({ events }: SubstrateExtrinsic<AnyTuple>) => {
  return events.find((event) => event.event.section === "xTokens" && event);
};

const getPolkadotXcmData = (extrinsic: SubstrateExtrinsic<AnyTuple>) => {
  return extrinsic.extrinsic.args;
};

const handleXcmTransfer = (
  extrinsic: SubstrateExtrinsic<AnyTuple>
): {
  recipient: string;
  targetNetwork: string;
} => {
  if (isXTokensXCM(extrinsic)) {
    const xTokensEvent = findXTokensEvent(extrinsic);
    return getXTokensData(xTokensEvent);
  } else if (isXcmPalletXCM(extrinsic) || isPolkadotXCM(extrinsic)) {
    const xcmData = getPolkadotXcmData(extrinsic);
    return handleXcmPalletTargetAddress(xcmData);
  }

  return null;
};

const isXTokensXCM = ({ events }: SubstrateExtrinsic<AnyTuple>) => {
  return events.some((event) => event.event.section === "xTokens");
};

const isXcmPalletXCM = ({ events }: SubstrateExtrinsic<AnyTuple>) => {
  return events.some((event) => event.event.section === "xcmPallet");
};

const isPolkadotXCM = ({ events }: SubstrateExtrinsic<AnyTuple>) => {
  return events.some((event) => event.event.section === "polkadotXcm");
};

const getXTokensData = (event: TypedEventRecord<Codec[]>) => {
  const dest = event.event.data?.[3]?.toJSON();
  const destInfo = handleXTokensTargetAddress(dest);

  return {
    recipient: destInfo.to,
    targetNetwork: destInfo.targetNetwork,
  };
};

const isFirstEvent = (
  event: SubstrateEvent<AnyTuple>,
  extrinsic: SubstrateExtrinsic<AnyTuple>,
  section: string,
  method: string
) => {
  // If it's first, that means it's a  tranfer from a contract
  const eventHash = event.event.hash.toString();

  const eventHashIndex = extrinsic.events
    .filter(
      (event) =>
        event.event.section === section && event.event.method === method
    )
    .findIndex((event) => event.event.hash.toString() === eventHash);

  return eventHashIndex === 0;
};

const isTranferFromContract = (
  extrinsicSender: string,
  eventSender: string
) => {
  return extrinsicSender !== eventSender;
};

const getAssetBurnedEventData = (event: SubstrateEvent) => {
  const [assetId, owner, balance] = event.event.data;

  return {
    assetId: assetId.toString(),
    owner: owner.toString(),
    balance: balance.toString(),
  };
};

const getAssetTransferredEventData = (event: SubstrateEvent) => {
  const [assetId, from, to, balance] = event.event.data;

  return {
    assetId: assetId.toString(),
    from: from.toString(),
    to: to.toString(),
    balance: balance.toString(),
  };
};

const getBalanceTransferEventData = (event: SubstrateEvent) => {
  const [from, to, balance] = event.event.data;

  return {
    from: from.toString(),
    to: to.toString(),
    balance: balance.toString(),
  };
};

const transformAddressToWASM = (address: string, chain?: string) => {
  if (chain === SUBSTRATE_CHAINS["ASTAR"].name) {
    return evmToAddress(address, 5);
  }

  return address;
};

const handleXcmPalletTargetAddress = (extrinsic: AnyTuple) => {
  const [dest, beneficiary] = extrinsic;

  const interiorModule = getModuleVersion(beneficiary.toJSON())?.interior?.x1;

  if (interiorModule) {
    const account =
      interiorModule["accountKey20"] ||
      interiorModule["accountId32"] ||
      interiorModule["accountIndex64"];

    const accountId = account?.id || account?.key;

    const destModule = getModuleVersion(dest.toJSON())?.interior?.x1;
    const parachainId = destModule?.["parachain"];

    if (!parachainId || !accountId)
      return {
        recipient: accountId,
        targetNetwork: SUBSTRATE_CHAINS["POLKADOT"].name,
      };

    return {
      recipient: accountId,
      targetNetwork: `parachain-${parachainId}`,
    };
  }

  return {
    recipient: "",
    targetNetwork: "",
  };
};

const parseBalanceWithAsset = async (
  assetId: string,
  balance: string
): Promise<{
  symbol: string;
  amount: string;
}> => {
  try {
    const asset = await Asset.get(assetId);

    if (asset) {
      const decimals = asset.decimals;
      const symbol = asset.symbol;

      return {
        amount: parseBigumber(balance, decimals),
        symbol,
      };
    }

    return {
      amount: balance,
      symbol: assetId,
    };
  } catch (error) {
    return {
      amount: balance,
      symbol: assetId,
    };
  }
};
