import { parseUnits } from "ethers";

export const parseBigumber = (amount: string, decimals: number) => {
  const _result = parseUnits(amount, decimals).toString();

  const _decimal = _result.split(".")[1];

  if (_decimal === "0") {
    return _result.split(".")[0];
  }

  return _result;
};
