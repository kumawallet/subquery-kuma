import { SubstrateEvent } from "@subql/types";
import { Asset } from "../types";

export const handleAssetCreated = async (event: SubstrateEvent) => {
  const section = event.event.section;
  const method = event.event.method;

  // Acala assets
  if (section === "assetRegistry") {
    const { assetId, metadata } = event.event.data.toHuman() as {
      assetId: string | { Erc20: string };
      metadata: {
        symbol: string;
        decimals: string;
      };
    };

    const id =
      typeof assetId === "string"
        ? `ForeignAsset:${assetId}`
        : `erc20:${assetId.Erc20}`;

    if (method === "ForeignAssetRegistered" || method === "AssetRegistered") {
      const asset = Asset.create({
        id,
        name: id,
        symbol: metadata.symbol,
        decimals: Number(metadata.decimals),
      });
      await asset.save();
    } else {
      const asset = await Asset.get(id);
      if (asset) {
        asset.symbol = metadata.symbol;
        await asset.save();
      }
    }
  }

  // Astar / Moonbeam assets
  if (section === "assets" && method === "MetadataSet") {
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
  }
};
