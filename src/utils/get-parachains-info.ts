import { Parachain } from "../types";
import fetch from "node-fetch";

const PARACHAINS_URL = {
  polkadot:
    "https://raw.githubusercontent.com/kumawallet/chains-info/main/polkadot-parachains.json",
  kusama: "",
};

export const getParachainsData = async (
  relayChain: string
): Promise<Parachain[]> => {
  try {
    const url = PARACHAINS_URL[relayChain];

    if (!url) return [];

    const response = await fetch(url);
    const data = await response.json();
    const array = Object.keys(data).map((key) => data[key]);
    return array;
  } catch (error) {
    logger.error(`Error fetching parachains data: ${error}`);
    return [];
  }
};

export const findParachainId = (id: number, parachains: Parachain[] = []) => {
  return parachains.find((parachain) => parachain.parachainId === id);
};
