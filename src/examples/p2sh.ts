import {
  generateProof,
  getBtcBlockHash,
  getBtcBlock,
  generateBlockHeader,
} from "../getProof";

const txid = "2f371a0058d502bb36d7baf3fc89abfd9c68265d8b6a749af1352de63d10db7b";

generateProof(txid).then((val) => {console.log(val);});



