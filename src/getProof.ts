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

export async function getBlockHeight(): Promise<number> {
  const res = await axios.post(
    getBlocksURL,
    JSON.stringify({
      jsonrpc: "2.0",
      method: "getblockcount",
      params: [],
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
): Promise<{ blockHeader: string; proof: Proof; rawTx: string }> {
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
    swapEndian(time.toString(16).padStart(8, "0")) +
    swapEndian(bits) +
    swapEndian(nonce.toString(16).padStart(8, "0"))
  );
}

export async function getHeaderFromHeight(height: number): Promise<string> {
  const blockhash = await getBtcBlockHash(height);
  const block = await getBtcBlock(blockhash);
  const header = generateBlockHeader(block);
  return header;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function generateBlockHeaders(
  fromBlockHeight: number,
  toBlockHeight?: number,
  throttleMs: number = 50, // Default throttle delay set to 1000ms (1 second)
): Promise<{ start: number; headers: string }> {
  if (toBlockHeight === undefined) {
    toBlockHeight = await getBlockHeight();
  }
  if (toBlockHeight < fromBlockHeight) {
    throw new Error(
      `toBlockHeight: ${toBlockHeight} less than fromBlockHeight: ${fromBlockHeight}`,
    );
  }

  const iterateOverBlocks = toBlockHeight - fromBlockHeight;
  const blockHeights: number[] = Array.from(
    { length: iterateOverBlocks + 1 },
    (_, i) => fromBlockHeight + i,
  );

  let concatHeaders = "";

  for (const height of blockHeights) {
    const blockHeader = await getHeaderFromHeight(height);
    concatHeaders += blockHeader;

    // Throttle the requests
    await delay(throttleMs);
  }

  return {
    start: fromBlockHeight,
    headers: concatHeaders,
  };
}

export function getExpectedTarget(block: Block) {
  return "0x" + block.bits.slice(3).padEnd(45, "0").padStart(64, "0");
}
