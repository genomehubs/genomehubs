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

echo "=== Starting API server ==="
echo "GH_NODE: $GH_NODE"
echo "GH_HUBNAME: $GH_HUBNAME"
echo "GH_RELEASE: $GH_RELEASE"

# Check Elasticsearch connectivity
echo ""
echo "=== Testing Elasticsearch connection ==="
if curl -s "$GH_NODE" > /dev/null 2>&1; then
  echo "✓ Elasticsearch is reachable at $GH_NODE"
  curl -s "$GH_NODE" | head -5
else
  echo "✗ Cannot reach Elasticsearch at $GH_NODE"
  exit 1
fi

echo ""
echo "=== Starting API server in background ==="
cd /genomehubs/genomehubs-api && node --no-deprecation build/bundle.cjs > /tmp/api.log 2>&1 &
API_PID=$!

echo "API PID: $API_PID"

# Wait for API to be ready (up to 30 seconds)
echo "Waiting for API to start..."
for i in {1..30}; do
  if curl -s http://localhost:3000/api/v2/taxonomies > /dev/null 2>&1; then
    echo "✓ API is ready after $i seconds"
    break
  fi
  if [ $i -eq 30 ]; then
    echo "✗ API failed to start after 30 seconds"
    echo ""
    echo "=== API logs ==="
    cat /tmp/api.log
    exit 1
  fi
  echo "  Attempt $i/30..."
  sleep 1
done

echo ""
echo "=== API health check ==="
curl -s http://localhost:3000/api/v2/taxonomies | head -10

echo ""
echo "=== Running tests ==="

genomehubs test \
    --config-file /tmp/config.yaml \
    --base-url http://localhost:3000/api/v2 \
    --json-test-dir /genomehubs/tests

code=$?

kill $API_PID

exit $code