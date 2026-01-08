#!/bin/bash

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

export GH_BASENAME=

node --no-deprecation /genomehubs/genomehubs-api/bundle.cjs &
API_PID=$!
/genomehubs/genomehubs-ui &
UI_PID=$!
sleep 5

node /genomehubs/test-ui.mjs /genomehubs/tests /genomehubs/tests-out


code=$?

kill $API_PID
kill $UI_PID

exit $code