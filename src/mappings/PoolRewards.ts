import {
  AccountPoolReward,
  AccumulatedReward,
  AccumulatedPoolReward,
  // HistoryElement,
  RewardType,
  Transaction,
  Status,
  TransactionType,
} from "../types";
import { SubstrateEvent } from "@subql/types";
import {
  eventIdFromBlockAndIdxAndAddress,
  timestamp,
  eventIdWithAddress,
  blockNumber,
  calculateFeeAsString,
} from "./common";
import { Codec } from "@polkadot/types/types";
import { INumber } from "@polkadot/types-codec/types/interfaces";
import { PalletNominationPoolsPoolMember } from "@polkadot/types/lookup";
import { updateAccumulatedGenericReward } from "./Rewards";
import { getPoolMembers } from "./Cache";
import { SUBSTRATE_CHAINS } from "../contants/polkadot-chains";
import { parseBigumber } from "../utils/parse-amounts";

export async function handlePoolReward(
  rewardEvent: SubstrateEvent<
    [accountId: Codec, poolId: INumber, reward: INumber]
  >,
  chainName: string
): Promise<void> {
  await handlePoolRewardForTxHistory(rewardEvent, chainName);
  let accumulatedReward = await updateAccumulatedPoolReward(rewardEvent, true);
  let {
    event: {
      data: [accountId, poolId, amount],
    },
  } = rewardEvent;
  await updateAccountPoolRewards(
    rewardEvent,
    accountId.toString(),
    amount.toBigInt(),
    poolId.toNumber(),
    RewardType.reward,
    accumulatedReward.amount
  );
}

async function handlePoolRewardForTxHistory(
  rewardEvent: SubstrateEvent<
    [accountId: Codec, poolId: INumber, reward: INumber]
  >,
  chainName: string
): Promise<void> {
  const {
    event: {
      data: [account, poolId, amount],
    },
  } = rewardEvent;

  const asset = SUBSTRATE_CHAINS[chainName.toUpperCase()].symbol;
  const decimals = SUBSTRATE_CHAINS[chainName.toUpperCase()].decimals;

  const fee = calculateFeeAsString(rewardEvent.extrinsic, account.toString());

  const hash = rewardEvent.extrinsic?.extrinsic.hash.toString() || "";

  const tx = Transaction.create({
    blockNumber: blockNumber(rewardEvent),
    timestamp: Number(timestamp(rewardEvent.block)),
    id: hash,
    hash,
    amount: parseBigumber(amount.toBn().toString(), decimals),
    asset,
    fee,
    originNetwork: chainName,
    targetNetwork: chainName,
    sender: account.toString(),
    recipient: "",
    status: Status.success,
    tip: "",
    type: TransactionType.RewardClaimed,
  });

  // logger.info(`reward claimed ${tx.id}`);
  tx.save();
}

async function updateAccumulatedPoolReward(
  event: SubstrateEvent<[accountId: Codec, poolId: INumber, reward: INumber]>,
  isReward: boolean
): Promise<AccumulatedReward> {
  let {
    event: {
      data: [accountId, _, amount],
    },
  } = event;
  return await updateAccumulatedGenericReward(
    AccumulatedPoolReward,
    accountId.toString(),
    amount.toBigInt(),
    isReward
  );
}

async function updateAccountPoolRewards(
  event: SubstrateEvent,
  accountAddress: string,
  amount: bigint,
  poolId: number,
  rewardType: RewardType,
  accumulatedAmount: bigint
): Promise<void> {
  let id = eventIdWithAddress(event, accountAddress);
  let accountPoolReward = new AccountPoolReward(
    id,
    accountAddress,
    blockNumber(event),
    timestamp(event.block),
    amount,
    accumulatedAmount,
    rewardType,
    poolId
  );
  await accountPoolReward.save();
}

// export async function handlePoolBondedSlash(bondedSlashEvent: SubstrateEvent<[poolId: INumber, slash: INumber]>): Promise<void> {
//     const {event: {data: [poolIdEncoded, slash]}} = bondedSlashEvent
//     const poolId = poolIdEncoded.toNumber()

//     const pool = (await api.query.nominationPools.bondedPools(poolId)).unwrap()

//     await handleRelaychainPooledStakingSlash(
//         bondedSlashEvent,
//         poolId,
//         pool.points.toBigInt(),
//         slash.toBigInt(),
//         (member: PalletNominationPoolsPoolMember) : bigint => {
//             return member.points.toBigInt()
//         }
//     )
// }

// export async function handlePoolUnbondingSlash(unbondingSlashEvent: SubstrateEvent<[era: INumber, poolId: INumber, slash: INumber]>): Promise<void> {
//     const {event: {data: [era, poolId, slash]}} = unbondingSlashEvent
//     const poolIdNumber = poolId.toNumber()
//     const eraIdNumber = era.toNumber()

//     const unbondingPools = (await api.query.nominationPools.subPoolsStorage(poolIdNumber)).unwrap()

//     const pool = unbondingPools.withEra[eraIdNumber] ?? unbondingPools.noEra

//     await handleRelaychainPooledStakingSlash(
//         unbondingSlashEvent,
//         poolIdNumber,
//         pool.points.toBigInt(),
//         slash.toBigInt(),
//         (member: PalletNominationPoolsPoolMember) : bigint => {
//             return member.unbondingEras[eraIdNumber]?.toBigInt() ?? BigInt(0)
//         }
//     )
// }

// async function handleRelaychainPooledStakingSlash(
//     event: SubstrateEvent,
//     poolId: number,
//     poolPoints: bigint,
//     slash: bigint,
//     memberPointsCounter: (member: PalletNominationPoolsPoolMember) => bigint
// ): Promise<void> {
//     if(poolPoints == BigInt(0)) {
//         return
//     }

//     const members = await getPoolMembers(blockNumber(event))

//     await Promise.all(members.map(async ([accountId, member]) => {
//         let memberPoints: bigint
//         if (member.poolId.toNumber() === poolId) {
//             memberPoints = memberPointsCounter(member)
//             if (memberPoints != BigInt(0)) {
//                 const personalSlash = (slash * memberPoints) / poolPoints

//                 await handlePoolSlashForTxHistory(event, poolId, accountId, personalSlash)
//                 let accumulatedReward = await updateAccumulatedGenericReward(AccumulatedPoolReward, accountId, personalSlash, false)
//                 await updateAccountPoolRewards(
//                     event,
//                     accountId,
//                     personalSlash,
//                     poolId,
//                     RewardType.slash,
//                     accumulatedReward.amount
//                 )
//             }
//         }
//     }))
// }

// async function handlePoolSlashForTxHistory(slashEvent: SubstrateEvent, poolId: number, accountId: string, personalSlash: bigint): Promise<void> {
//     const extrinsic = slashEvent.extrinsic;
//     const block = slashEvent.block;
//     const blockNumber = block.block.header.number.toString()
//     const blockTimestamp = timestamp(block)
//     const eventId = eventIdFromBlockAndIdxAndAddress(blockNumber, slashEvent.idx.toString(), accountId)

//     const fee = calculateFeeAsString(slashEvent.extrinsic, accountId);

//     // TODO: change
//     const tx = Transaction.create({
//         id: eventId,
//         blockNumber: Number(blockNumber),
//         timestamp: Number(blockTimestamp),
//         hash: extrinsic?.extrinsic.hash.toString(),
//         amount: personalSlash.toString(),
//         fee,
//         sender: accountId,
//         recipient: "",
//         status: Status.success,
//         type: TransactionType.Reward,
//         tip: ""
//     })
//     // const element = new HistoryElement(
//     //     eventId,
//     //     block.block.header.number.toNumber(),
//     //     blockTimestamp,
//     //     accountId
//     // );
//     // if (extrinsic !== undefined) {
//     //     element.extrinsicHash = extrinsic.extrinsic.hash.toString()
//     //     element.extrinsicIdx = extrinsic.idx
//     // }
//     // element.poolReward = {
//     //     eventIdx: slashEvent.idx,
//     //     amount: personalSlash.toString(),
//     //     isReward: false,
//     //     poolId: poolId
//     // }
//     // await element.save()
// }
