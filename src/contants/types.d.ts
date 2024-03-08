export interface Chain {
  [key: string]: {
    name: string;
    symbol: string;
    decimals: number;
  };
}
