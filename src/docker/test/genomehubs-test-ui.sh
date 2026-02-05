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

echo "=== Starting API and UI servers ==="
echo "GH_NODE: $GH_NODE"
echo "GH_HUBNAME: $GH_HUBNAME"
echo "GH_RELEASE: $GH_RELEASE"
echo "GH_API_URL: $GH_API_URL"
echo "PORT: $PORT"

# Check Elasticsearch connectivity
echo ""
echo "=== Testing Elasticsearch connection ==="
if curl -s "$GH_NODE" > /dev/null 2>&1; then
  echo "✓ Elasticsearch is reachable at $GH_NODE"
else
  echo "✗ Cannot reach Elasticsearch at $GH_NODE"
  exit 1
fi

echo ""
echo "=== Checking UI files ==="
ls -la /genomehubs/genomehubs-ui/ || echo "No genomehubs-ui directory"
ls -la /genomehubs/genomehubs-ui/dist/ 2>/dev/null | head -5 || echo "No dist directory"
ls -la /genomehubs/genomehubs-ui/src/server/ 2>/dev/null | head -5 || echo "No server directory"
ls -la /genomehubs/genomehubs-ui/node_modules/ 2>/dev/null | head -5 || echo "No node_modules"

echo ""
echo "=== Starting API server ==="
cd /genomehubs/genomehubs-api && GH_NODE=$GH_NODE GH_HUBNAME=$GH_HUBNAME GH_RELEASE=$GH_RELEASE node --no-deprecation build/bundle.cjs > /tmp/api.log 2>&1 &
API_PID=$!
echo "API PID: $API_PID"

echo ""
echo "=== Starting UI server ==="
cd /genomehubs/genomehubs-ui && \
  GH_API_URL=$GH_API_URL \
  GH_HUBNAME=$GH_HUBNAME \
  GH_BASENAME=$GH_BASENAME \
  PORT=$PORT \
  NODE_ENV=production \
  node --no-deprecation src/server/index.js > /tmp/ui.log 2>&1 &
UI_PID=$!
echo "UI PID: $UI_PID"

echo ""
echo "Waiting for API/UI to start..."
for i in {1..30}; do
  api_ready=false
  ui_ready=false
  
  if curl -s http://localhost:3000/api/v2/taxonomies > /dev/null 2>&1; then
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
    echo ""
    echo "=== API logs ==="
    cat /tmp/api.log 2>/dev/null || echo "No API logs"
    echo ""
    echo "=== UI logs ==="
    cat /tmp/ui.log 2>/dev/null || echo "No UI logs"
    echo ""
    echo "=== Process status ==="
    ps aux | grep -E "node|PID" || echo "No node processes"
    exit 1
  fi
  
  echo "  Attempt $i/30 (API: $api_ready, UI: $ui_ready)..."
  sleep 1
done

echo ""
echo "=== API health ==="
curl -s http://localhost:3000/api/v2/taxonomies | head -20

echo ""
echo "=== UI health ==="
curl -s http://localhost:${PORT} | head -20

echo ""
echo "=== First 50 lines of API log ==="
head -50 /tmp/api.log 2>/dev/null || echo "No API logs yet"

echo ""
echo "=== First 50 lines of UI log ==="
head -50 /tmp/ui.log 2>/dev/null || echo "No UI logs yet"

echo ""
echo "=== Running UI tests ==="

node /genomehubs/test-ui.mjs /genomehubs/tests /genomehubs/tests-out


code=$?

kill $API_PID
kill $UI_PID

exit $code