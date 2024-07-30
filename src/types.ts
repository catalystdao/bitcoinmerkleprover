export type Block = {
  hash: "string";
  confirmations: number;
  height: number;
  version: number;
  versionHex: "string";
  merkleroot: "string";
  time: number;
  mediantime: number;
  nonce: number;
  bits: "string";
  difficulty: number;
  chainwork: "string";
  nTx: number;
  previousblockhash: "string";
  nextblockhash: "string";
  strippedsize: number;
  size: number;
  weight: number;
  tx: string[];
};

export type Input = {
  txid: string;
  vout: number;
  scriptSig: any;
  txinwitness: any;
  sequence: number;
};

export type Output = {
  value: number;
  n: number;
  scriptPubKey: any;
};

export type Transaction = {
  txid: string;
  hash: string;
  version: number;
  size: number;
  vsize: number;
  weight: number;
  locktime: number;
  vin: Input[];
  vout: Output[];
  hex: string;
  blockhash: string;
  confirmations: number;
  time: number;
  blocktime: number;
};

export type Proof = {
  txId: string;
  txIndex: number;
  sibling: string[];
};
