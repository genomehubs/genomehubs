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

export GH_API_URL=${GH_API_URL:-http://localhost:3000/api/v2}
export PORT=${PORT:-8880}

node --no-deprecation /genomehubs/genomehubs-api/build/bundle.cjs &
API_PID=$!
node /genomehubs/genomehubs-ui/src/server/index.js &
UI_PID=$!

echo "Waiting for API/UI to start..."
for i in {1..30}; do
  api_ready=false
  ui_ready=false
  if curl -s http://localhost:3000/api/v2 > /dev/null 2>&1; then
    api_ready=true
  fi
  if curl -s http://localhost:${PORT} > /dev/null 2>&1; then
    ui_ready=true
  fi
  if [ "$api_ready" = true ] && [ "$ui_ready" = true ]; then
    echo "✓ API and UI are ready after $i seconds"
    break
  fi
  if [ $i -eq 30 ]; then
    echo "✗ API/UI failed to start after 30 seconds"
    exit 1
  fi
  echo "  Attempt $i/30..."
  sleep 1
done

node /genomehubs/test-ui.mjs /genomehubs/tests /genomehubs/tests-out


code=$?

kill $API_PID
kill $UI_PID

exit $code