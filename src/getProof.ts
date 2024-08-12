import axios from "axios";
import "dotenv/config";
import { getProof } from "./lib/bitcoin-proof";

import type { Block, Transaction, Proof } from "./types";

export function swapEndian(hex: string): string {
  // Ensure the hex string has an even number of characters
  if (hex.length % 2 !== 0) {
    hex = "0" + hex;
  }
  // Split the hex string into pairs of characters
  let pairs = hex.match(/.{1,2}/g);
  if (pairs == null) throw Error("Invalid hex encoded decimal number");
  // Reverse the pairs
  let reversedHexPairs = pairs.reverse();
  // Join the reversed pairs back into a string
  let reversedHex = reversedHexPairs.join("");
  return reversedHex;
}

const BTC_RPC = process.env.BTC_RPC;
if (BTC_RPC === undefined)
  throw Error("No Bitcoin RPC Error (env.BTC_RPC === UNDEFINED)");
const getBlocksURL = BTC_RPC ? BTC_RPC : "";

export async function getBtcBlockHash(height: number): Promise<string> {
  const res = await axios.post(
    getBlocksURL,
    JSON.stringify({
      jsonrpc: "2.0",
      method: "getblockhash",
      params: [height],
      id: "getblock.io",
    }),
    {
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    },
  );
  return res.data.result;
}

export async function getBtcBlock(blockhash: string): Promise<Block> {
  // Get the "bestblock" information
  const res = await axios.post(
    getBlocksURL,
    JSON.stringify({
      jsonrpc: "2.0",
      method: "getblock",
      params: [blockhash, 1],
      id: "getblock.io",
    }),
    {
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    },
  );
  return res.data.result;
}

export async function getRawTransaction(txid: string): Promise<Transaction> {
  const res = await axios.post(
    getBlocksURL,
    JSON.stringify({
      jsonrpc: "2.0",
      method: "getrawtransaction",
      params: [txid, true, null],
      id: "getblock.io",
    }),
    {
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    },
  );
  return res.data.result;
}

export async function generateProof(
  txid: string,
): Promise<{ blockHeader: string; proof: Proof, rawTx: string }> {
  const tx = await getRawTransaction(txid);

  const block = await getBtcBlock(tx.blockhash);
  const txIndex: number = block.tx.indexOf(txid);
  const proof = await getProof(block.tx, txIndex);
  const blockHeader = generateBlockHeader(block);

  return { blockHeader, proof, rawTx: tx.hex };
}

export function generateBlockHeader(block: {
  versionHex: string;
  previousblockhash: string;
  merkleroot: string;
  time: number;
  bits: string;
  nonce: number;
}): string {
  const { versionHex, previousblockhash, merkleroot, time, bits, nonce } =
    block;
  return (
    swapEndian(versionHex) +
    swapEndian(previousblockhash) +
    swapEndian(merkleroot) +
    swapEndian(time.toString(16)) +
    swapEndian(bits) +
    swapEndian(nonce.toString(16))
  );
}
