import { Client } from "@elastic/elasticsearch";
import { config } from "./config.js";

const client = new Client({
  node: config.node,
});

export { client };

// console.log(client);

// export const client = {
//   test: "exports",
//   cat: {
//     indices: () => {
//       console.log("testing");
//     },
//   },
// };

// console.log(client);

// export default client;
