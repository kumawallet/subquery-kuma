import { SubstrateEvent } from "@subql/types";
import { Asset } from "../types";

export const handleAssetCreated = async (event: SubstrateEvent) => {
  const { assetId, name, symbol, decimals } = event.event.data.toHuman() as {
    assetId: string;
    name: string;
    symbol: string;
    decimals: number;
  };

  const asset = Asset.create({
    id: assetId.replace(/,/g, ""),
    name,
    symbol,
    decimals: Number(decimals),
  });

  await asset.save();
};
