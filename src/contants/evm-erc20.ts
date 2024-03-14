import { EVM_CHAINS } from "./evm-chains";

export const ERC20 = {
  [EVM_CHAINS["ETHEREUM"].name]: {
    "0xdac17f958d2ee523a2206206994597c13d831ec7": {
      symbol: "USDT",
      decimals: 6,
      startBlock: 4634748,
    },
    "0xb8c77482e45f1f44de1745f52c74426c631bdd52": {
      symbol: "BNB",
      decimals: 18,
      startBlock: 3978343,
    },
    "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48": {
      symbol: "USDC",
      decimals: 6,
      startBlock: 6082465,
    },
    "0x95ad61b0a150d79219dcf64e1e6cc01f0b64c4ce": {
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
    "0xb50721bcf8d664c30412cfbc6cf7a15145234ad1": {
      symbol: "ARB",
      decimals: 18,
      startBlock: 16840305,
    },
    "0x7fc66500c84a76ad7e9c93437bfc5ac33e2ddae9": {
      symbol: "AAVE",
      decimals: 18,
      startBlock: 10926829,
    },
    "0x152649ea73beab28c5b49b26eb48f7ead6d4c898": {
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
    "0x3ba4c387f786bfee076a58914f5bd38d668b42c3": {
      symbol: "BNB",
      decimals: 18,
      startBlock: 15427667,
    },
    "0x3c499c542cef5e3811e1192ce70d8cc03d5c3359": {
      symbol: "USDC",
      decimals: 6,
      startBlock: 45319261,
    },
    "0x6f8a06447ff6fcf75d803135a7de15ce88c1d4ec": {
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
    "0xac51c4c48dc3116487ed4bc16542e27b5694da1b": {
      symbol: "ATOM",
      decimals: 6,
      startBlock: 19195273,
    },
    "0x8f3cf7ad23cd3cadbd9735aff958023239c6a063": {
      symbol: "DAI",
      decimals: 18,
      startBlock: 4362007,
    },
    "0xd6df932a45c0f255f85145f286ea0b292b21c90b": {
      symbol: "AAVE",
      decimals: 18,
      startBlock: 11666003,
    },
    "0x805262b407177c3a4aa088088c571164f645c5d0": {
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
    "0x2859e4544c4bb03966803b044a93563bd2d0dd4d": {
      symbol: "SHIB",
      decimals: 18,
      startBlock: 7294986,
    },
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
    "0x0e09fabb73bd3ade0a17ecc321fd13a19e81ce82": {
      symbol: "CAKE",
      decimals: 18,
      startBlock: 693963,
    },
    "0x2170ed0880ac9a755fd29b2688956bd959f933f8": {
      symbol: "ETH",
      decimals: 18,
      startBlock: 326031,
    },
    "0x7083609fce4d1d8dc0c979aab8c869ea2c873402": {
      symbol: "DOT",
      decimals: 18,
      startBlock: 325172,
    },
    "0x7130d2a12b9bcbfae4f2634d864a1ee1ce3ead9c": {
      symbol: "BTC",
      decimals: 18,
      startBlock: 325172,
    },
  },
};
