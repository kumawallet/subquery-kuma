import {
  AccountReward,
  AccumulatedReward,
  HistoryElement,
  Reward,
  RewardType,
  Status,
  Transaction,
  TransactionType,
} from "../types";
import {
  SubstrateBlock,
  SubstrateEvent,
  SubstrateExtrinsic,
} from "@subql/types";
import {
  callsFromBatch,
  eventIdFromBlockAndIdx,
  isBatch,
  timestamp,
  eventId,
  eventIdWithAddress,
  isProxy,
  callFromProxy,
  blockNumber,
  eventRecordToSubstrateEvent,
  getRewardData,
} from "./common";
import { CallBase } from "@polkadot/types/types/calls";
import { AnyTuple } from "@polkadot/types/types/codec";
import { EraIndex } from "@polkadot/types/interfaces/staking";
import { Balance } from "@polkadot/types/interfaces";
import {
  cachedRewardDestination,
  cachedController,
  cachedStakingRewardEraIndex,
} from "./Cache";
import { Codec } from "@polkadot/types/types";
import { INumber } from "@polkadot/types-codec/types/interfaces";
import { SUBSTRATE_CHAINS } from "../contants/polkadot-chains";
import { parseBigumber } from "../utils/parse-amounts";

function isPayoutStakers(call: CallBase<AnyTuple>): boolean {
  return call.method == "payoutStakers";
}

function isPayoutValidator(call: CallBase<AnyTuple>): boolean {
  return call.method == "payoutValidator";
}

function extractArgsFromPayoutStakers(
  call: CallBase<AnyTuple>
): [string, number] {
  const [validatorAddressRaw, eraRaw] = call.args;

  return [validatorAddressRaw.toString(), (eraRaw as EraIndex).toNumber()];
}

function extractArgsFromPayoutValidator(
  call: CallBase<AnyTuple>,
  sender: string
): [string, number] {
  const [eraRaw] = call.args;

  return [sender, (eraRaw as EraIndex).toNumber()];
}

export async function handleRewarded(
  rewardEvent: SubstrateEvent<[accountId: Codec, reward: INumber]>
): Promise<void> {
  await handleReward(rewardEvent);
}

export async function handleReward(
  rewardEvent: SubstrateEvent<[accountId: Codec, reward: INumber]>
): Promise<void> {
  await handleRewardForTxHistory(rewardEvent);
  let accumulatedReward = await updateAccumulatedReward(rewardEvent, true);
  await updateAccountRewards(
    rewardEvent,
    RewardType.reward,
    accumulatedReward.amount
  );
}

async function handleRewardForTxHistory(
  rewardEvent: SubstrateEvent
): Promise<void> {
  let element = await HistoryElement.get(eventId(rewardEvent));

  if (element !== undefined) {
    // already processed reward previously
    return;
  }

  let payoutCallsArgs = rewardEvent.block.block.extrinsics
    .map((extrinsic) =>
      determinePayoutCallsArgs(extrinsic.method, extrinsic.signer.toString())
    )
    .filter((args) => args.length != 0)
    .flat();

  if (payoutCallsArgs.length == 0) {
    return;
  }

  const payoutValidators = payoutCallsArgs.map(([validator]) => validator);

  const initialCallIndex = -1;

  var accountsMapping: { [address: string]: string } = {};

  for (const eventRecord of rewardEvent.block.events) {
    if (
      eventRecord.event.section == rewardEvent.event.section &&
      eventRecord.event.method == rewardEvent.event.method
    ) {
      let {
        event: {
          data: [account, _],
        },
      } = eventRecord;

      if (account.toRawType() === "Balance") {
        return;
      }

      let accountAddress = account.toString();
      let rewardDestination = await cachedRewardDestination(
        accountAddress,
        eventRecord as unknown as SubstrateEvent
      );

      if (rewardDestination.isStaked || rewardDestination.isStash) {
        accountsMapping[accountAddress] = accountAddress;
      } else if (rewardDestination.isController) {
        accountsMapping[accountAddress] = await cachedController(
          accountAddress,
          eventRecord as unknown as SubstrateEvent
        );
      } else if (rewardDestination.isAccount) {
        accountsMapping[accountAddress] =
          rewardDestination.asAccount.toString();
      }
    }
  }

  await buildRewardEvents(
    rewardEvent.block,
    rewardEvent.extrinsic,
    rewardEvent.event.method,
    rewardEvent.event.section,
    accountsMapping,
    initialCallIndex,
    (currentCallIndex, eventAccount) => {
      if (payoutValidators.length > currentCallIndex + 1) {
        const index = payoutValidators.indexOf(eventAccount);
        return index !== -1 && index > currentCallIndex
          ? index
          : currentCallIndex;
      } else {
        return currentCallIndex;
      }
    },
    (currentCallIndex, eventIdx, stash, amount) => {
      if (currentCallIndex == -1) {
        return {
          eventIdx: eventIdx,
          amount: amount,
          isReward: true,
          stash: stash,
          validator: "",
          era: -1,
        };
      } else {
        const [validator, era] = payoutCallsArgs[currentCallIndex];
        return {
          eventIdx: eventIdx,
          amount: amount,
          isReward: true,
          stash: stash,
          validator: validator,
          era: era,
        };
      }
    }
  );
}

function determinePayoutCallsArgs(
  causeCall: CallBase<AnyTuple>,
  sender: string
): [string, number][] {
  if (isPayoutStakers(causeCall)) {
    return [extractArgsFromPayoutStakers(causeCall)];
  } else if (isPayoutValidator(causeCall)) {
    return [extractArgsFromPayoutValidator(causeCall, sender)];
  } else if (isBatch(causeCall)) {
    return callsFromBatch(causeCall)
      .map((call) => {
        return determinePayoutCallsArgs(call, sender).map(
          (value, index, array) => {
            return value;
          }
        );
      })
      .flat();
  } else if (isProxy(causeCall)) {
    let proxyCall = callFromProxy(causeCall);
    return determinePayoutCallsArgs(proxyCall, sender);
  } else {
    return [];
  }
}

export async function handleSlashed(
  slashEvent: SubstrateEvent<[accountId: Codec, slash: INumber]>
): Promise<void> {
  await handleSlash(slashEvent);
}

export async function handleSlash(
  slashEvent: SubstrateEvent<[accountId: Codec, slash: INumber]>
): Promise<void> {
  await handleSlashForTxHistory(slashEvent);
  let accumulatedReward = await updateAccumulatedReward(slashEvent, false);
  await updateAccountRewards(
    slashEvent,
    RewardType.slash,
    accumulatedReward.amount
  );
}

async function getValidators(era: number): Promise<Set<string>> {
  const eraStakersInSlashEra = await (api.query.staking.erasStakersClipped
    ? api.query.staking.erasStakersClipped.keys(era)
    : api.query.staking.erasStakersOverview.keys(era));
  const validatorsInSlashEra = eraStakersInSlashEra.map((key) => {
    let [, validatorId] = key.args;

    return validatorId.toString();
  });
  return new Set(validatorsInSlashEra);
}

async function handleSlashForTxHistory(
  slashEvent: SubstrateEvent
): Promise<void> {
  let element = await HistoryElement.get(eventId(slashEvent));

  if (element !== undefined) {
    // already processed reward previously
    return;
  }
  const eraWrapped = await api.query.staking.currentEra();
  const currentEra = Number(eraWrapped.toString());
  const slashDeferDuration = api.consts.staking.slashDeferDuration;
  let validatorsSet = new Set();

  const slashEra = !slashDeferDuration
    ? currentEra
    : currentEra - slashDeferDuration.toNumber();

  if (
    api.query.staking.erasStakersOverview ||
    api.query.staking.erasStakersClipped
  ) {
    validatorsSet = await getValidators(slashEra);
  }

  const initialValidator = null;

  await buildRewardEvents(
    slashEvent.block,
    slashEvent.extrinsic,
    slashEvent.event.method,
    slashEvent.event.section,
    {},
    initialValidator,
    (currentValidator, eventAccount) => {
      return validatorsSet.has(eventAccount) ? eventAccount : currentValidator;
    },
    (validator, eventIdx, stash, amount) => {
      return {
        eventIdx: eventIdx,
        amount: amount,
        isReward: false,
        stash: stash,
        validator: validator,
        era: slashEra,
      };
    }
  );
}

async function buildRewardEvents<A>(
  block: SubstrateBlock,
  extrinsic: SubstrateExtrinsic | undefined,
  eventMethod: String,
  eventSection: String,
  accountsMapping: { [address: string]: string },
  initialInnerAccumulator: A,
  produceNewAccumulator: (currentAccumulator: A, eventAccount: string) => A,
  produceReward: (
    currentAccumulator: A,
    eventIdx: number,
    stash: string,
    amount: string
  ) => Reward
) {
  let blockNumber = block.block.header.number.toString();
  let blockTimestamp = timestamp(block);

  const [, savingPromises] = block.events.reduce<[A, Promise<void>[]]>(
    (accumulator, eventRecord, eventIndex) => {
      let [innerAccumulator, currentPromises] = accumulator;

      if (
        !(
          eventRecord.event.method == eventMethod &&
          eventRecord.event.section == eventSection
        )
      )
        return accumulator;

      let [account, amount] = getRewardData(
        eventRecordToSubstrateEvent(eventRecord)
      );

      const newAccumulator = produceNewAccumulator(
        innerAccumulator,
        account.toString()
      );

      const eventId = eventIdFromBlockAndIdx(
        blockNumber,
        eventIndex.toString()
      );

      const accountAddress = account.toString();
      const destinationAddress = accountsMapping[accountAddress];

      const element = new HistoryElement(
        eventId,
        block.block.header.number.toNumber(),
        blockTimestamp,
        destinationAddress != undefined ? destinationAddress : accountAddress
      );

      if (extrinsic !== undefined) {
        element.extrinsicHash = extrinsic.extrinsic.hash.toString();
        element.extrinsicIdx = extrinsic.idx;
      }
      element.reward = produceReward(
        newAccumulator,
        eventIndex,
        accountAddress,
        amount.toString()
      );

      currentPromises.push(element.save());

      return [newAccumulator, currentPromises];
    },
    [initialInnerAccumulator, []]
  );

  await Promise.allSettled(savingPromises);
}

async function updateAccumulatedReward(
  event: SubstrateEvent<[accountId: Codec, reward: INumber]>,
  isReward: boolean
): Promise<AccumulatedReward> {
  let [accountId, amount] = getRewardData(event);
  return await updateAccumulatedGenericReward(
    AccumulatedReward,
    accountId.toString(),
    (amount as unknown as Balance).toBigInt(),
    isReward
  );
}

async function updateAccountRewards(
  event: SubstrateEvent,
  rewardType: RewardType,
  accumulatedAmount: bigint
): Promise<void> {
  let [accountId, amount] = getRewardData(event);

  const accountAddress = accountId.toString();
  let id = eventIdWithAddress(event, accountAddress);
  let accountReward = new AccountReward(
    id,
    accountAddress,
    blockNumber(event),
    timestamp(event.block),
    (amount as unknown as Balance).toBigInt(),
    accumulatedAmount,
    rewardType
  );
  await accountReward.save();
}

async function handleParachainRewardForTxHistory(
  rewardEvent: SubstrateEvent,
  chainName: string
): Promise<void> {
  const [account, amount] = getRewardData(rewardEvent);

  const blockNumber = rewardEvent.block.block.header.number.toNumber();
  const hash = rewardEvent.block.block.header.hash.toString();
  const fee = "";
  const originNetwork = SUBSTRATE_CHAINS[chainName.toUpperCase()].name;
  const targetNetwork = SUBSTRATE_CHAINS[chainName.toUpperCase()].name;
  const asset = SUBSTRATE_CHAINS[chainName.toUpperCase()].symbol;
  const decimals = SUBSTRATE_CHAINS[chainName.toUpperCase()].decimals;
  const sender = account.toString();
  const recipient = account.toString();
  const type = TransactionType.Reward;

  const tx = Transaction.create({
    id: eventId(rewardEvent),
    blockNumber,
    hash,
    fee,
    originNetwork,
    targetNetwork,
    sender,
    recipient,
    type,
    amount: parseBigumber(amount.toString(), decimals),
    asset: asset,
    status: Status.SUCCESS,
  });

  logger.info(`Saving ${JSON.stringify(tx, null, 2)}`);
}

export async function handleParachainRewarded(
  rewardEvent: SubstrateEvent<[accountId: Codec, reward: INumber]>,
  chainName: string
): Promise<void> {
  await handleParachainRewardForTxHistory(rewardEvent, chainName);
  let accumulatedReward = await updateAccumulatedReward(rewardEvent, true);
  await updateAccountRewards(
    rewardEvent,
    RewardType.reward,
    accumulatedReward.amount
  );
}

// ============= GENERICS ================

interface AccumulatedInterface {
  amount: bigint;
  save(): Promise<void>;
}

interface AccumulatedInterfaceStatic<BaseType extends AccumulatedInterface> {
  new (id: string, amount: bigint): BaseType;
  get(accountAddress: string): Promise<BaseType | undefined>;
}

export async function updateAccumulatedGenericReward<
  AccumulatedRewardType extends AccumulatedInterface,
  AccumulatedRewardClassType extends AccumulatedInterfaceStatic<AccumulatedRewardType>
>(
  AccumulatedRewardTypeObject: AccumulatedRewardClassType,
  accountId: string,
  amount: bigint,
  isReward: boolean
): Promise<AccumulatedRewardType> {
  let accountAddress = accountId;

  let accumulatedReward = await AccumulatedRewardTypeObject.get(accountAddress);
  if (!accumulatedReward) {
    accumulatedReward = new AccumulatedRewardTypeObject(
      accountAddress,
      BigInt(0)
    );
  }
  accumulatedReward.amount =
    accumulatedReward.amount + (isReward ? amount : -amount);
  await accumulatedReward.save();
  return accumulatedReward;
}

export async function handleGenericForTxHistory(
  event: SubstrateEvent,
  address: string,
  fieldCallback: (element: HistoryElement) => Promise<HistoryElement>
): Promise<void> {
  const extrinsic = event.extrinsic;
  const block = event.block;
  const blockNumber = block.block.header.number.toString();
  const blockTimestamp = timestamp(block);
  const eventId = eventIdFromBlockAndIdx(blockNumber, event.idx.toString());

  const element = new HistoryElement(
    eventId,
    block.block.header.number.toNumber(),
    blockTimestamp,
    address
  );
  if (extrinsic !== undefined) {
    element.extrinsicHash = extrinsic.extrinsic.hash.toString();
    element.extrinsicIdx = extrinsic.idx;
  }

  (await fieldCallback(element)).save();
}

interface AccountRewardsInterface {
  id: string;

  address: string;

  blockNumber: number;

  timestamp: bigint;

  amount: bigint;

  accumulatedAmount: bigint;

  type: RewardType;
  save(): Promise<void>;
}
