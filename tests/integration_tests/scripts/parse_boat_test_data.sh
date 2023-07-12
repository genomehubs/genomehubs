#!/bin/bash

# TODO:
# - Index assemblies
# 
# - Use https://ftp.ensembl.org/pub/rapid-release/species_metadata.json
#   to set ensembl production name as identifier for linkout to ens rapid

DIR=../lepbase-data/sources/raw_features
BTK_ID=$1
ACCESSION=$(yq -r '.assembly.accession' ${DIR}/${BTK_ID}/config.yaml)

OUTDIR=/Users/rchallis/projects/genomehubs/genomehubs/tests/integration_tests/data/boat/latest

WINDOW_FLAG=
SIZE_FLAG=

btk pipeline window-stats \
    --min-window-length 1000 \
    --min-window-count 5 \
    --in ${DIR}/${BTK_ID}/${BTK_ID}.chunk_stats.tsv.gz \
    --out ${OUTDIR}/${ACCESSION}.window_stats.tmp.tsv

join -t$'\t' -e "None" ${OUTDIR}/${ACCESSION}.window_stats.tmp.tsv <(datasets summary genome accession ${ACCESSION} --report sequence --as-json-lines | \
while read JSON; do
    echo $JSON | jq -r '[.genbank_accession, .chr_name] | @tsv' | sed 's/Un/None/';
done | cat <(echo -e "sequence\tassigned_name") -) > ${OUTDIR}/${ACCESSION}.window_stats.tsv

genomehubs parse \
    --window-full ${DIR}/${BTK_ID} \
    --outfile ${OUTDIR}/${ACCESSION}.window_stats.tsv

echo Parsing window files
for WINDOW in 1000000 0.1; do
  WINDOW_FLAG="${WINDOW_FLAG} --window ${WINDOW}"
  genomehubs parse \
    --window ${DIR}/${BTK_ID} \
    --window-size $WINDOW \
    --outfile ${OUTDIR}/${ACCESSION}.window_stats.tsv
done

echo Generating window files
btk pipeline window-stats ${WINDOW_FLAG} \
    --min-window-length 1000 \
    --min-window-count 5 \
    --in ${DIR}/${BTK_ID}/${BTK_ID}.chunk_stats.tsv.gz \
    --out ${OUTDIR}/${ACCESSION}.window_stats.tsv

echo "Parsing BUSCO tables"
LINEAGES=$(yq -r '.busco.lineages[] | sub("_odb10$"; "")' ${DIR}/${BTK_ID}/config.yaml)
while read -r LINEAGE; do
    genomehubs parse \
        --config ${DIR}/${BTK_ID}/config.yaml \
        --busco-feature ${DIR}/${BTK_ID}/${BTK_ID}.busco.${LINEAGE}_odb10/${BTK_ID}.busco.${LINEAGE}_odb10/full_table.tsv.gz \
        --outfile ${OUTDIR}/${ACCESSION}.busco.${LINEAGE}.tsv
done <<< "$LINEAGES"
