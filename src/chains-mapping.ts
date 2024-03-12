import { SubstrateEvent } from "@subql/types";
import { SUBSTRATE_CHAINS } from "./contants/polkadot-chains";
import { handleParachainRewarded } from "./mappings/Rewards";

export const handleParachainRewardMoonbeam = async (event: SubstrateEvent) => {
  handleParachainRewarded(event as any, SUBSTRATE_CHAINS["MOONBEAM"].name);
};

export const handleParachainRewardMoonriver = async (event: SubstrateEvent) => {
  handleParachainRewarded(event as any, SUBSTRATE_CHAINS["MOONRIVER"].name);
};
