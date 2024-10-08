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

export type Proof = {
  txId: string;
  txIndex: number;
  sibling: string[];
  concatedSiblings: string;
};
