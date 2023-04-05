const { Client } = require("@elastic/elasticsearch");

const client = new Client({
  node: "http://localhost:9200",
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
