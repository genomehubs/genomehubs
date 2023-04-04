const { Client, HttpConnection } = require("@elastic/elasticsearch");
const client = new Client({ node: url.toString(), Connection: HttpConnection });
export { client };
