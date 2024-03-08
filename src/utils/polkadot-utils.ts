import { SUBSTRATE_CHAINS } from "../contants/polkadot-chains";

export const handleXTokensTargetAddress = (destModule: any) => {
  const module = destModule?.interior;

  if (!module) return;

  if ("x1" in module) {
    const accountId = module.x1.accountId32?.id;

    return {
      targetNetwork: SUBSTRATE_CHAINS["POLKADOT"].name,
      to: accountId,
    };
  }

  if ("x2" in module) {
    const parachainId = module.x2[0].parachain;
    if ("accountKey20" in module.x2[1]) return module.x2[1].accountKey20?.key;
    const account = module.x2[1].accountId32?.id;
    return {
      targetNetwork: `parachain-${parachainId}`,
      to: account,
    };
  }
};

export const getModuleVersion = (obj: any) => {
  let version = obj?.["v3"] ? "v3" : null;

  obj?.["v2"] && (version = "v2");
  obj?.["v1"] && (version = "v1");

  if (!version) return undefined;

  return obj[version];
};
