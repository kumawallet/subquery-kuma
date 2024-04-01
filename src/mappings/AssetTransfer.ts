import {
  SubstrateEvent,
  SubstrateExtrinsic,
  TypedEventRecord,
} from "@subql/types";
import {
  Asset,
  Parachain,
  Status,
  Transaction,
  TransactionType,
} from "../types";
import { SUBSTRATE_CHAINS } from "../contants/polkadot-chains";
import {
  calculateFeeAsString,
  isEvmExecutedEvent,
  isEvmTransaction,
  timestamp,
} from "./common";
import { ethereumEncode, encodeAddress } from "@polkadot/util-crypto";
import { AnyTuple, Codec } from "@polkadot/types-codec/types";
import {
  getModuleVersion,
  handleXTokensTargetAddress,
} from "../utils/polkadot-utils";
import { evmToAddress } from "@polkadot/util-crypto";
import { parseBigumber } from "../utils/parse-amounts";
import {
  findParachainId,
  getParachainsData,
} from "../utils/get-parachains-info";

export const handleAssetTransferred = async (
  event: SubstrateEvent,
  chain: string
) => {
  const txInfo = await getTransferEventData(event, chain);

  if (txInfo) {
    const blockNumber = event.extrinsic!.block.block.header.number.toNumber();
    const blockTimestamp = timestamp(event.extrinsic.block);

    const {
      amount,
      asset,
      fee,
      hash,
      recipient: _recipient,
      sender,
      status,
      targetNetwork: _targetNetwork,
      type,
    } = txInfo;

    const { recipientAddress, targetNetwork } = await formatRecipientAddress({
      recipient: _recipient,
      relayChain: "polkadot",
      targetNetwork: _targetNetwork,
    });

    const tx = Transaction.create({
      id: hash,
      sender,
      recipient: recipientAddress,
      amount: amount || "0",
      asset,
      fee,
      status,
      targetNetwork: targetNetwork || chain,
      type,
      blockNumber,
      hash,
      originNetwork: chain,
      timestamp: Number(blockTimestamp),
      tip: "0",
    });

    // logger.info(`tx saved: ${tx.id}`);
    tx.save();
  }
};

const getTransferEventData = async (event: SubstrateEvent, chain: string) => {
  const extrinsic = event.extrinsic;

  if (!extrinsic) return;

  let sender = "";
  let asset = SUBSTRATE_CHAINS[chain.toUpperCase()].symbol;
  let recipient = "";
  let hash = "";
  let status = "";
  let type = TransactionType.Transfer;
  let targetNetwork = SUBSTRATE_CHAINS[chain.toUpperCase()].name;
  let fee = "";

  const isEVM =
    extrinsic?.success && isEvmTransaction(extrinsic.extrinsic.method as any);

  if (isEVM) {
    const executedEvent = extrinsic.events.find((event) =>
      getEvmEvent(event as any, chain)
    );
    if (!executedEvent) {
      return;
    }

    const {
      sender: _sender,
      recipient: evmRecipient,
      hash: _hash,
      success,
    } = getEvmTransferData(executedEvent, chain);

    hash = _hash;
    sender = _sender;
    recipient = evmRecipient;
    status = success ? Status.success : Status.fail;
  } else {
    sender = extrinsic.extrinsic.signer.toString();
    hash = extrinsic.extrinsic.hash.toString();
    status = extrinsic.success ? Status.success : Status.fail;
  }

  const tranferData = await getTransferDataFromEvent({
    event,
    chainName: chain,
    isEVM,
    sender,
    extrinsic,
  });

  if (!tranferData) return null;

  const { amount } = tranferData;
  fee = calculateFeeAsString(extrinsic, sender);

  return {
    sender: tranferData.sender || sender,
    asset: tranferData.asset || asset,
    amount,
    recipient: tranferData.recipient || recipient,
    hash,
    type: tranferData.type || type,
    status,
    targetNetwork: tranferData.targetNetwork || targetNetwork,
    fee,
  };
};

interface TransferDataFromEvent {
  event: SubstrateEvent;
  chainName: string;
  isEVM: boolean;
  sender: string;
  extrinsic: SubstrateExtrinsic<AnyTuple>;
}

const getTransferDataFromEvent = (
  props: TransferDataFromEvent
): Promise<HandleEventResponse | undefined> | undefined => {
  if (isAssetBurnedEvent(props.event)) {
    return handleBurnedEvent(props);
  } else if (isAssetTransferredEvent(props.event)) {
    return handleAssetTransferredEvent(props);
  } else if (isBalanceTransferEvent(props.event)) {
    return handleBalanceTransferEvent(props);
  }
  // else if (isCurrenciesTransferredEvent(props.event)) {
  //   return handleCurrenciesTransferredEvent(props);
  // }
};

interface HandleEvent {
  isEVM: boolean;
  sender: string;
  chainName: string;
  extrinsic: SubstrateExtrinsic<AnyTuple>;
  event: SubstrateEvent;
}

interface HandleEventResponse {
  asset: string;
  amount: string;
  sender: string;
  recipient: string;
  targetNetwork: string;
  type: string;
}

const getEvmTransferData = (
  event: TypedEventRecord<Codec[]>,
  chaiName: string
) => {
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

const handleBurnedEvent = async ({
  event,
  sender,
  extrinsic,
  chainName,
  isEVM,
}: HandleEvent): Promise<HandleEventResponse> => {
  let amount = "";
  let asset = "";
  let recipient = "";
  let type = "";
  let targetNetwork = "";

  const { assetId, owner, balance } = getAssetBurnedEventData(event);

  const { amount: _amount, symbol } = await parseBalanceWithAsset(
    assetId,
    balance
  );

  asset = symbol;
  amount = _amount;

  const trasnformedSender = isEVM
    ? transformAddressToWASM(sender, chainName)
    : sender;
  if (isTranferFromContract(trasnformedSender, owner)) {
    type = TransactionType.Contract;
  } else {
    const xcmData = handleXcmTransfer(extrinsic);
    if (xcmData?.recipient && xcmData?.targetNetwork) {
      recipient = xcmData.recipient;
      targetNetwork = xcmData.targetNetwork;
    }
  }

  return {
    amount,
    asset,
    sender,
    recipient,
    targetNetwork,
    type,
  };
};

const isAssetTransferredEvent = (event: SubstrateEvent) => {
  return (
    ["localAssets", "assets"].includes(event.event.section) &&
    event.event.method === "Transferred"
  );
};

const handleAssetTransferredEvent = async ({
  event,
  sender,
  extrinsic,
  chainName,
  isEVM,
}: HandleEvent): Promise<HandleEventResponse | undefined> => {
  let amount = "";
  let asset = "";
  let recipient = "";
  let type = "";
  let targetNetwork = "";

  const isFirst = isFirstEvent(event, extrinsic, "assets", "Transferred");

  if (!isFirst) return;

  const { assetId, from, to, balance } = getAssetTransferredEventData(event);

  const trasnformedSender = isEVM
    ? transformAddressToWASM(sender, chainName)
    : sender;
  if (isTranferFromContract(trasnformedSender, from)) {
    type = TransactionType.Contract;
  } else {
    sender = from;
    recipient = to;

    const { amount: _amount, symbol } = await parseBalanceWithAsset(
      assetId,
      balance
    );

    asset = symbol;
    amount = _amount;
  }

  return {
    amount,
    asset,
    sender,
    recipient,
    targetNetwork,
    type,
  };
};

const isBalanceTransferEvent = (event: SubstrateEvent) => {
  return (
    event.event.section === "balances" && event.event.method === "Transfer"
  );
};

const handleBalanceTransferEvent = async ({
  event,
  sender,
  extrinsic,
  chainName,
}: HandleEvent): Promise<HandleEventResponse | undefined> => {
  let amount = "";
  let asset = "";
  let recipient = "";
  let type = "";
  let targetNetwork = "";

  const { to, balance } = getBalanceTransferEventData(event);

  amount = parseBigumber(
    balance,
    SUBSTRATE_CHAINS[chainName.toUpperCase()].decimals
  );

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
      type = TransactionType.Contract;
    }
  }

  return {
    amount,
    asset,
    sender,
    recipient,
    targetNetwork,
    type,
  };
};

// const isTokenTransferredEvent = (event: SubstrateEvent) => {
//   return (
//     event.event.section === "currencies" && event.event.method === "Transfer"
//   );
// };

// const handleTokenTransferredEvent = async ({
//   event,
//   sender,
//   extrinsic,
//   chainName,
//   isEVM,
// }: HandleEvent): Promise<HandleEventResponse> => {
//   let asset = "";
//   let type = "";
//   let targetNetwork = "";

//   const {
//     currencyId,
//     from,
//     to: recipient,
//     amount,
//   } = event.event.data.toHuman() as {
//     currencyId:
//       | {
//           ForeignAsset: string;
//         }
//       | {
//           Token: string;
//         }
//       | {
//           Erc20: string;
//         };
//     from: string;
//     to: string;
//     amount: string;
//   };

//   return {
//     amount,
//     asset,
//     sender,
//     recipient: from,
//     targetNetwork,
//     type,
//   };
// };

const findXTokensEvent = ({ events }: SubstrateExtrinsic<AnyTuple>) => {
  return events.find((event) => event.event.section === "xTokens" && event);
};

const getPolkadotXcmData = (extrinsic: SubstrateExtrinsic<AnyTuple>) => {
  return extrinsic.extrinsic.args;
};

const handleXcmTransfer = (
  extrinsic: SubstrateExtrinsic<AnyTuple>
):
  | {
      recipient: string;
      targetNetwork: string;
    }
  | undefined => {
  if (isXTokensXCM(extrinsic)) {
    const xTokensEvent = findXTokensEvent(extrinsic);
    return getXTokensData(xTokensEvent as any);
  } else if (isXcmPalletXCM(extrinsic) || isPolkadotXCM(extrinsic)) {
    const xcmData = getPolkadotXcmData(extrinsic);
    return handleXcmPalletTargetAddress(xcmData);
  }

  return;
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

  const interiorModule = getModuleVersion(beneficiary?.toJSON())?.interior?.x1;

  if (interiorModule) {
    const account =
      interiorModule["accountKey20"] ||
      interiorModule["accountId32"] ||
      interiorModule["accountIndex64"];

    const accountId = account?.id || account?.key;

    const destModule = getModuleVersion(dest?.toJSON())?.interior?.x1;
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

const getEvmEvent = (event: SubstrateEvent, chainName: string) => {
  return isEvmExecutedEvent(event);
};

const formatRecipientAddress = async ({
  recipient,
  relayChain,
  targetNetwork,
}: {
  targetNetwork: string;
  recipient: string;
  relayChain: string;
}): Promise<{
  recipientAddress: string;
  targetNetwork: string;
}> => {
  try {
    if (!targetNetwork.includes("parachain-"))
      return {
        recipientAddress: recipient,
        targetNetwork,
      };

    const parachainId = targetNetwork.split("-")[1];

    let parachainFound = (
      await Parachain.getByParachainId(Number(parachainId)).catch(
        (error) => null
      )
    )?.[0];

    if (!parachainFound) {
      const parachains = await getParachainsData(relayChain);

      await Promise.all(
        parachains.map((parachain) => {
          const _parachainToSave = Parachain.create({
            id: parachain.parachainId.toString(),
            name: parachain.name,
            parachainId: parachain.parachainId,
            base58prefix: parachain.base58prefix,
          });
          return _parachainToSave.save();
        })
      );

      parachainFound = findParachainId(Number(parachainId), parachains);
    }

    const _formatedAddress = encodeAddress(
      recipient,
      parachainFound.base58prefix
    );
    const _targetNetwork = parachainFound.name;

    return {
      recipientAddress: _formatedAddress,
      targetNetwork: _targetNetwork,
    };
  } catch (error) {
    return {
      recipientAddress: recipient,
      targetNetwork,
    };
  }
};
