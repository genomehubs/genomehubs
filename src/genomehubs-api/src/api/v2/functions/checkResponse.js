export const checkResponse = ({ body }) => {
  let status = { hits: 0, success: true };
  if (!body) {
    status.success = false;
    status.error = "Unable to connect to ElasticSearch";
    return status;
  }
  if (body.error) {
    status.success = false;
    status.error = body.error.type;
    return status;
  }
  status.took = body.took;
  if (body.timed_out) {
    status.success = false;
    status.error = "Timed out";
    return status;
  }
  if (body._shards.successful < body._shards.total) {
    status.success = false;
    if (body._shards.successful == 0) {
      status.error = "Query execution failed";
      return status;
    } else {
      status.error = "Some shards failed";
    }
  }
  status.hits = body.hits.total;
  return status;
};
