#!/bin/bash

curl -X DELETE 'localhost:9200/*--*'
genomehubs parse \
    --ncbi-datasets-sample tests/integration_tests/data/assembly-data-sample/eukaryota \
    --outfile tests/integration_tests/data/assembly-data-sample/ncbi_datasets.tsv
genomehubs init \
    --config-file tests/integration_tests/config/goat.yaml \
    --taxonomy-source ncbi \
    --taxonomy-root 2759 \
    --taxonomy-jsonl tests/integration_tests/ena-taxonomy.extra.jsonl \
    --taxon-preload &&
genomehubs index \
    --config-file tests/integration_tests/config/goat.yaml \
    --taxonomy-source ncbi \
    --assembly-dir tests/integration_tests/data/assembly-data &&
genomehubs index \
    --config-file tests/integration_tests/config/goat.yaml \
    --taxonomy-source ncbi \
    --taxon-dir tests/integration_tests/data/ott3.3 &&
genomehubs index \
    --config-file tests/integration_tests/config/goat.yaml \
    --taxonomy-source ncbi \
    --taxon-dir tests/integration_tests/data/tolids \
    --taxon-lookup any \
    --taxon-spellcheck &&
genomehubs index \
    --config-file tests/integration_tests/config/goat.yaml \
    --taxonomy-source ncbi \
    --taxon-dir tests/integration_tests/data/genomesize_karyotype \
    --taxon-lookup any \
    --taxon-spellcheck &&
genomehubs index \
    --config-file tests/integration_tests/config/goat.yaml \
    --taxonomy-source ncbi \
    --taxon-dir tests/integration_tests/data/regional_lists \
    --taxon-lookup any \
    --taxon-spellcheck &&
genomehubs index \
    --config-file tests/integration_tests/config/goat.yaml \
    --taxonomy-source ncbi \
    --taxon-dir tests/integration_tests/data/uk_legislation \
    --taxon-lookup any \
    --taxon-spellcheck &&
genomehubs index \
    --config-file tests/integration_tests/config/goat.yaml \
    --taxonomy-source ncbi \
    --assembly-dir tests/integration_tests/data/btk &&
genomehubs index \
    --config-file tests/integration_tests/config/goat.yaml \
    --taxonomy-source ncbi \
    --taxon-dir tests/integration_tests/data/status_lists \
    --taxon-lookup any \
    --taxon-spellcheck &&
genomehubs index \
    --config-file tests/integration_tests/config/goat.yaml \
    --taxonomy-source ncbi \
    --taxon-dir tests/integration_tests/data/assembly-data-taxon &&
genomehubs index \
    --config-file tests/integration_tests/config/goat.yaml \
    --taxonomy-source ncbi \
    --sample-dir tests/integration_tests/data/assembly-data-sample &&
genomehubs index \
    --config-file tests/integration_tests/config/goat.yaml \
    --taxonomy-source ncbi \
    --taxon-dir tests/integration_tests/data/lineages &&
genomehubs fill \
    --config-file tests/integration_tests/config/goat.yaml \
    --taxonomy-source ncbi \
    --traverse-root 2759 \
    --traverse-infer-both &&
# genomehubs index \
#     --config-file tests/integration_tests/config/goat.yaml \
#     --taxonomy-source ncbi \
#     --feature-dir tests/integration_tests/data/features
genomehubs index \
    --config-file tests/integration_tests/config/goat.yaml \
    --taxonomy-source ncbi \
    --file-metadata tests/integration_tests/data/btk/btk.files.yaml &&
genomehubs test \
    --config-file tests/integration_tests/config/goat.yaml \
    --base-url http://localhost:3000/api/v2 \
    --json-test-dir tests/integration_tests/templates/api/json &&
python run_ui_tests.py &&
echo done ||
echo failed