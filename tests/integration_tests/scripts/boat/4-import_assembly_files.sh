#!/bin/bash

FILE_PATH=tests/integration_tests/data/boat/assembly
CONFIG=tests/integration_tests/config/boat.yaml
ROOT_TAXID=85604

# Delete existing indices
curl -X DELETE "http://localhost:9201/*"

# Run genomehubs init
genomehubs init \
    --taxonomy-source ncbi \
    --config-file $CONFIG \
    --taxonomy-ncbi-root $ROOT_TAXID \
    --taxon-preload

# curl -s -X PUT "localhost:9201/assembly--ncbi--boat--2021.10.15/_settings" \
#           -H 'Content-Type: application/json' \
#           -d '{ "index.mapping.nested_objects.limit" : 100000 }'

# Run genomehubs index assembly-insdc
genomehubs index \
    --taxonomy-source ncbi \
    --config-file $CONFIG \
    --assembly-dir $FILE_PATH-insdc

curl -s -X PUT "localhost:9201/taxon--ncbi--boat--2021.10.15/_settings" \
          -H 'Content-Type: application/json' \
          -d '{ "index.mapping.nested_objects.limit" : 100000 }'

# Run genomehubs index assembly-btk
genomehubs index \
    --taxonomy-source ncbi \
    --config-file $CONFIG \
    --assembly-dir $FILE_PATH-btk ||

curl -s -X PUT "localhost:9201/taxon--ncbi--boat--2021.10.15/_settings" \
    -H 'Content-Type: application/json' \
    -d '{ "index.mapping.nested_objects.limit" : 100000 }' &&

genomehubs index \
    --taxonomy-source ncbi \
    --config-file $CONFIG \
    --assembly-dir $FILE_PATH-btk ||

exit 1


genomehubs fill \
    --config-file $CONFIG \
    --taxonomy-source ncbi \
    --traverse-root $ROOT_TAXID \
    --traverse-infer-both