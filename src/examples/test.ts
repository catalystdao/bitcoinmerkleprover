import {
  generateProof,
  getBtcBlockHash,
  getBtcBlock,
  generateBlockHeader,
} from "../getProof";

const txid = "3836352218be851ebb4685d7f3a22dde70a66b52a965e62c2a0bfa0988cdd0ba";

generateProof(txid).then((val) => console.log(val));

// getBtcBlockHash(717696).then((blockhash) =>
//   getBtcBlock(blockhash).then((block) =>
//     console.log(generateBlockHeader(block)),
//   ),
// );

// getBtcBlockHash(717697).then((blockhash) =>
//   getBtcBlock(blockhash).then((block) =>
//     console.log(generateBlockHeader(block)),
//   ),
// );
