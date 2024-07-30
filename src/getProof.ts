import axios from "axios";
import 'dotenv/config'
import { getProof } from "./lib/bitcoin-proof";

const getBlocksURL = "https://go.getblock.io/0630c505482443c28b71859ca001ce14";

async function getBtcBlock(blockhash: string) {
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
    }
  );
  return res.data.result;
}

async function getRawTransaction(txid: string) {
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
    }
  );
  return res.data.result;
}


async function generateProof(txid: string) {
  const rawTx = await getRawTransaction(txid);

  const block = await getBtcBlock(rawTx.blockhash);
  const txIndex = block.tx.indexOf(txid);
  const proof = await getProof(block.tx, txIndex);

  return proof;
}

const txid = "f2abcea74b697724fd5578302716d2ea30d61f807d377de87cea53529f00f045";

generateProof(txid).then(val => console.log(val));
