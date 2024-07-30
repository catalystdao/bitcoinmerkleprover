import {
  generateProof,
  getBtcBlockHash,
  getBtcBlock,
  generateBlockHeader,
} from "../getProof";

const txid = "f2abcea74b697724fd5578302716d2ea30d61f807d377de87cea53529f00f045";

generateProof(txid).then((val) => console.log(val));

getBtcBlockHash(717696).then((blockhash) =>
  getBtcBlock(blockhash).then((block) =>
    console.log(generateBlockHeader(block)),
  ),
);

getBtcBlockHash(717697).then((blockhash) =>
  getBtcBlock(blockhash).then((block) =>
    console.log(generateBlockHeader(block)),
  ),
);
