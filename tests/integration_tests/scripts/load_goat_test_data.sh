#!/bin/bash

# Determine ES host (allow override via GH_NODE when running in compose)
ES_HOST=${GH_NODE:-http://localhost:9200}
ES_HOST=${ES_HOST%/}
export ES_HOST

# If the configured ES host is not resolvable inside the container, fall back
# to host.docker.internal (useful on macOS Docker Desktop).
HOST_ONLY=$(echo "$ES_HOST" | sed -E 's~https?://~~; s%/%%g')
python3 - <<PY
import socket,sys
host="$HOST_ONLY".split(':')[0]
try:
        socket.getaddrinfo(host, None)
except Exception:
        sys.exit(1)
sys.exit(0)
PY
if [ $? -ne 0 ]; then
    ES_HOST="http://host.docker.internal:9200"
    export ES_HOST
    echo "Elasticsearch host '$HOST_ONLY' not resolvable; falling back to $ES_HOST"
fi

echo "Loading test data into Elasticsearch at $ES_HOST for hub ${GH_HUBNAME:-goat} release ${GH_RELEASE:-2021.10.15}"

# Create a temporary config overriding common.es.host so the CLI gets a
# fully-qualified ES URL (some code paths read config before --es-host)
TMP_CONFIG=$(mktemp /tmp/goat_config.XXXX.yaml)
export TMP_CONFIG
python3 - <<PY
import os, yaml, re
orig='tests/integration_tests/config/goat.yaml'
es=os.environ.get('ES_HOST') or ''
tmp=os.environ.get('TMP_CONFIG')
# Strip scheme if present, keep host:port (expected format in code)
es_noscheme = re.sub(r"^https?://", "", es).rstrip('/')
with open(orig) as f:
    cfg = yaml.safe_load(f) or {}
cfg.setdefault('common', {}).setdefault('es', {})['host'] = [es_noscheme]
with open(tmp, 'w') as out:
    yaml.safe_dump(cfg, out)
PY
cat $TMP_CONFIG
trap "rm -f $TMP_CONFIG" EXIT

# Delete all indices for this release (including taxon) and the template
curl -X DELETE "$ES_HOST/*${GH_HUBNAME:-goat}--${GH_RELEASE:-2021.10.15}" 2>/dev/null || true

# Retry wrapper for robust imports (full reload on failure to avoid partial imports)
RETRIES=${RETRIES:-2}
run_all_steps() {
  # Full data load sequence
  genomehubs init --config-file "$TMP_CONFIG" --taxonomy-source ncbi --taxonomy-root 2759 || return 1
  genomehubs index --config-file "$TMP_CONFIG" --taxonomy-source ncbi --assembly-dir tests/integration_tests/data/assembly-data || return 1
  genomehubs index --config-file "$TMP_CONFIG" --taxonomy-source ncbi --taxon-dir tests/integration_tests/data/ott3.3 || return 1
  genomehubs index --config-file "$TMP_CONFIG" --taxonomy-source ncbi --taxon-dir tests/integration_tests/data/tolids --taxon-lookup any --taxon-spellcheck || return 1
  genomehubs index --config-file "$TMP_CONFIG" --taxonomy-source ncbi --taxon-dir tests/integration_tests/data/genomesize_karyotype --taxon-lookup any --taxon-spellcheck || return 1
  genomehubs index --config-file "$TMP_CONFIG" --taxonomy-source ncbi --taxon-dir tests/integration_tests/data/regional_lists --blank "N/A" --blank "None" --taxon-lookup any --taxon-spellcheck || return 1
  genomehubs index --config-file "$TMP_CONFIG" --taxonomy-source ncbi --taxon-dir tests/integration_tests/data/uk_legislation --taxon-lookup any --taxon-spellcheck || return 1
  genomehubs index --config-file "$TMP_CONFIG" --taxonomy-source ncbi --assembly-dir tests/integration_tests/data/btk || return 1
  genomehubs index --config-file "$TMP_CONFIG" --taxonomy-source ncbi --taxon-dir tests/integration_tests/data/status_lists --taxon-lookup any --taxon-spellcheck || return 1
  genomehubs index --config-file "$TMP_CONFIG" --taxonomy-source ncbi --taxon-dir tests/integration_tests/data/assembly-data-taxon || return 1
  genomehubs index --config-file "$TMP_CONFIG" --taxonomy-source ncbi --sample-dir tests/integration_tests/data/assembly-data-sample || return 1
  genomehubs index --config-file "$TMP_CONFIG" --taxonomy-source ncbi --taxon-dir tests/integration_tests/data/lineages || return 1
  genomehubs fill --config-file "$TMP_CONFIG" --taxonomy-source ncbi --traverse-root 2759 --traverse-infer-both || return 1
}

# Retry entire load sequence on transient failures (avoids duplicate imports)
attempt=1
while [ $attempt -le $RETRIES ]; do
  echo "Loading data (attempt $attempt/$RETRIES)"
  run_all_steps && exit 0
  if [ $attempt -lt $RETRIES ]; then
    echo "Load failed, deleting indices and retrying..."
    curl -X DELETE "$ES_HOST/*${GH_HUBNAME:-goat}--${GH_RELEASE:-2021.10.15}" 2>/dev/null || true
    sleep 5
  fi
  attempt=$((attempt+1))
done
echo "Giving up after $RETRIES attempts"
exit 1

echo done

kill $API_PID || true