#!/bin/bash

cp /genomehubs/config/config.yaml /tmp/config.yaml

if [ -z "$GH_RELEASE" ]; then
  export GH_RELEASE=2021.10.15
fi

if [ -z "$GH_HUBNAME" ]; then
  export GH_HUBNAME="genomehubs"
fi

if [ -z "$GH_NODE" ]; then
  export GH_NODE="http://localhost:9200"
fi

if [ -z "$GH_RESOURCES" ]; then
  export GH_RESOURCES="/genomehubs/resources"
fi

yq eval '.test.hub.version = "'$GH_RELEASE'"' -i /tmp/config.yaml
yq eval '.test.hub.name = "'$GH_HUBNAME'"' -i /tmp/config.yaml

cd /genomehubs/genomehubs-api && node --no-deprecation bundle.cjs &
API_PID=$!

sleep 5

genomehubs test \
    --config-file /tmp/config.yaml \
    --base-url http://localhost:3000/api/v2 \
    --json-test-dir /genomehubs/tests

code=$?

kill $API_PID

exit $code