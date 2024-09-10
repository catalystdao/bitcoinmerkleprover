import "dotenv/config";
import mempoolJS from "@catalabs/mempool.js";

const TESTNET = process.env.TESTNET;
const {
  bitcoin: { transactions, blocks },
} = mempoolJS({
  hostname: "mempool.space",
});

import type { Block, Proof } from "./types";

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

export async function generateProof(
  txid: string,
): Promise<{ blockHeader: string; proof: Proof; rawTx: string }> {
  const tx = await transactions.getTx({ txid });

  const merkleProof = await transactions.getTxMerkleProof({ txid });
  // TODO: serialisation version 1.
  const rawTx = await transactions.getTxHex({ txid });

  const blockHash = await blocks.getBlockHeight({
    height: merkleProof.block_height,
  });
  console.log(rawTx);
  // const block = await blocks.getBlock({ hash: blockHash });

  // const blockHeader = generateBlockHeader(block);
  const blockHeader = await blocks.getBlockHeader({ hash: blockHash });

  return {
    blockHeader,
    proof: {
      txId: txid,
      txIndex: merkleProof.pos,
      sibling: merkleProof.merkle,
      concatedSiblings: merkleProof.merkle.reduce(
        (accumulator, currentValue) => accumulator + currentValue,
      ),
    },
    rawTx,
  };
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

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function generateBlockHeaders(
  fromBlockHeight: number,
  toBlockHeight?: number,
  throttleMs: number = 50, // Default throttle delay set to 1000ms (1 second)
): Promise<{ start: number; headers: string }> {
  if (toBlockHeight === undefined) {
    toBlockHeight = await blocks.getBlocksTipHeight();
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
    const hash = await blocks.getBlockHeight({ height });
    const blockHeader = await blocks.getBlockHeader({ hash });
    concatHeaders += blockHeader;

    // Throttle the requests
    await delay(throttleMs);
  }

  return {
    start: fromBlockHeight,
    headers: concatHeaders,
  };
}

// TODO: fix
export function getExpectedTarget(block: Block) {
  return "0x" + block.bits.slice(3).padEnd(45, "0").padStart(64, "0");
}
