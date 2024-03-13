import { EVM_CHAINS } from "./evm-chains";

export const ERC20 = {
  [EVM_CHAINS["ETHEREUM"].name]: {
    "0xdac17f958d2ee523a2206206994597c13d831ec7": {
      symbol: "USDT",
      decimals: 6,
      startBlock: 4634748,
    },
    "0xB8c77482e45F1F44dE1745F52C74426C631bDD52": {
      symbol: "BNB",
      decimals: 18,
      startBlock: 3978343,
    },
    "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48": {
      symbol: "USDC",
      decimals: 6,
      startBlock: 6082465,
    },
    "0x95aD61b0a150d79219dCF64E1E6Cc01f0B64C4cE": {
      symbol: "SHIB",
      decimals: 18,
      startBlock: 10569013,
    },
    "0x7d1afa7b718fb893db30a3abc0cfc608aacfebb0": {
      symbol: "MATIC",
      decimals: 18,
      startBlock: 7605604,
    },
    "0x2260fac5e5542a773aa44fbcfedf7c193bc2c599": {
      symbol: "WBTC",
      decimals: 8,
      startBlock: 6766284,
    },
    "0x1f9840a85d5af5bf1d1762f925bdaddc4201f984": {
      symbol: "UNI",
      decimals: 18,
      startBlock: 10861674,
    },
    "0x8d983cb9388eac77af0474fa441c4815500cb7bb": {
      symbol: "ATOM",
      decimals: 6,
      startBlock: 13155261,
    },
    "0x6b175474e89094c44da98b954eedeac495271d0f": {
      symbol: "DAI",
      decimals: 18,
      startBlock: 8928158,
    },
    "0xB50721BCf8d664c30412Cfbc6cf7a15145234ad1": {
      symbol: "ARB",
      decimals: 18,
      startBlock: 16840305,
    },
    "0x7fc66500c84a76ad7e9c93437bfc5ac33e2ddae9": {
      symbol: "AAVE",
      decimals: 18,
      startBlock: 10926829,
    },
    "0x152649eA73beAb28c5b49B26eb48f7EAD6d4c898": {
      symbol: "CAKE",
      decimals: 18,
      startBlock: 16924137,
    },
  },

  [EVM_CHAINS["POLYGON"].name]: {
    "0xc2132d05d31c914a87c6611c10748aeb04b58e8f": {
      symbol: "USDT",
      decimals: 6,
      startBlock: 4196335,
    },
    "0x3BA4c387f786bFEE076A58914F5Bd38d668B42c3": {
      symbol: "BNB",
      decimals: 18,
      startBlock: 15427667,
    },
    "0x3c499c542cef5e3811e1192ce70d8cc03d5c3359": {
      symbol: "USDC",
      decimals: 6,
      startBlock: 45319261,
    },
    "0x6f8a06447Ff6FcF75d803135a7de15CE88C1d4ec": {
      symbol: "SHIB",
      decimals: 18,
      startBlock: 14027287,
    },
    "0x1bfd67037b42cf73acf2047067bd4f2c47d9bfd6": {
      symbol: "WBTC",
      decimals: 8,
      startBlock: 4196820,
    },
    "0xb33eaad8d922b1083446dc23f610c2567fb5180f": {
      symbol: "UNI",
      decimals: 18,
      startBlock: 5514730,
    },
    "0xac51C4c48Dc3116487eD4BC16542e27B5694Da1b": {
      symbol: "ATOM",
      decimals: 6,
      startBlock: 19195273,
    },
    "0x8f3cf7ad23cd3cadbd9735aff958023239c6a063": {
      symbol: "DAI",
      decimals: 18,
      startBlock: 4362007,
    },
    "0xD6DF932A45C0f255f85145f286eA0b292B21C90B": {
      symbol: "AAVE",
      decimals: 18,
      startBlock: 11666003,
    },
    "0x805262B407177c3a4AA088088c571164F645c5D0": {
      symbol: "CAKE",
      decimals: 18,
      startBlock: 15631509,
    },
  },

  [EVM_CHAINS["BNB"].name]: {
    "0x55d398326f99059ff775485246999027b3197955": {
      symbol: "USDT",
      decimals: 18,
      startBlock: 176416,
    },
    "0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d": {
      symbol: "USDC",
      decimals: 18,
      startBlock: 1477489,
    },
    "0x2859e4544C4bB03966803b044A93563Bd2D0DD4D": {
      symbol: "SHIB",
      decimals: 18,
      startBlock: 7294986,
    },
    // WBTC
    "0x8b9b4c5bFc50Bab521bF8016054fC8afbc381400": {},
    "0xbf5140a22578168fd562dccf235e5d43a02ce9b1": {
      symbol: "UNI",
      decimals: 18,
      startBlock: 1304051,
    },
    "0x0eb3a705fc54725037cc9e008bdede697f62f335": {
      symbol: "ATOM",
      decimals: 18,
      startBlock: 469772,
    },
    "0x1af3f329e8be154074d8769d1ffa4ee058b1dbc3": {
      symbol: "DAI",
      decimals: 18,
      startBlock: 325036,
    },
    "0xfb6115445bff7b52feb98650c87f44907e58f802": {
      symbol: "AAVE",
      decimals: 18,
      startBlock: 4407851,
    },
    "0x0E09FaBB73Bd3Ade0a17ECC321fD13a19e81cE82": {
      symbol: "CAKE",
      decimals: 18,
      startBlock: 693963,
    },
    "0x2170Ed0880ac9A755fd29B2688956BD959F933F8": {
      symbol: "ETH",
      decimals: 18,
      startBlock: 326031,
    },
    "0x7083609fCE4d1d8Dc0C979AAb8c869Ea2C873402": {
      symbol: "DOT",
      decimals: 18,
      startBlock: 325172,
    },
    "0x7130d2A12B9BCbFAe4f2634d864A1Ee1Ce3Ead9c": {
      symbol: "BTC",
      decimals: 18,
      startBlock: 325172,
    },
  },
};
