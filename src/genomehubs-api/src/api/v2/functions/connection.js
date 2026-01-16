import { Client } from "@elastic/elasticsearch";
import { config } from "./config.js";

const client = new Client({
  node: config.node,
  // Connection pool settings for better performance over network
  maxRetries: 3,
  requestTimeout: 30000, // 30 seconds
  sniffOnStart: false, // Disable sniffing for remote clusters
  sniffOnConnectionFault: false,
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
