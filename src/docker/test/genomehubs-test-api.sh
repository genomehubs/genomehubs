#!/bin/bash

cp /genomehubs/config/config.yaml /tmp/config.yaml

if [ ! -z "$GH_RELEASE" ]; then
  cat /tmp/config.yaml | yq -y '.test.hub.version="'$GH_RELEASE'"' > TMP && mv TMP /tmp/config.yaml
fi

if [ ! -z "$GH_HUBNAME" ]; then
  cat /tmp/config.yaml | yq -y '.test.hub.name="'$GH_HUBNAME'"' > TMP && mv TMP /tmp/config.yaml
fi

# if [ -z "$GH_NODE" ]; then
#   cat /tmp/config.yaml | yq -y '.test.es.host=["'$GH_NODE'"]' > TMP && mv TMP /tmp/config.yaml
# fi

cat /tmp/config.yaml

/genomehubs/genomehubs-api &

sleep 5

genomehubs test \
    --config-file /tmp/config.yaml \
    --base-url http://localhost:3000/api/v2 \
    --json-test-dir /genomehubs/tests