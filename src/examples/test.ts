import { generateBlockHeaders, generateProof } from "../getProof";

generateProof(
  "dbf25501225cbf5d7cbff3be5da158982c4cda87bc917c0678885f07cde51caf",
).then((result) => console.log(result));
