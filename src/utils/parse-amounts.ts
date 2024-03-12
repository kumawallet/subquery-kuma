function parseUnits(value, decimals) {
  const weiString = value.padStart(decimals + 1, "0");
  const wholePart = weiString.slice(0, -decimals) || "0";
  const fractionalPart = weiString.slice(-decimals).replace(/0+$/, "");
  const result = `${wholePart}${
    fractionalPart.length > 0 ? `.${fractionalPart}` : ""
  }`;
  return result;
}

export const parseBigumber = (amount: string, decimals: number) => {
  const _result = parseUnits(amount, decimals).toString();

  const _decimal = _result.split(".")[1];

  if (_decimal === "0") {
    return _result.split(".")[0];
  }

  return _result;
};
