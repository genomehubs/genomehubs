#!/bin/bash

BTK_DIR=$HOME/projects/genomehubs/lepbase-data/sources/raw_features
OUT_DIR=/tmp

# Output is a directory per accession with chunks and busco file, e.g. 
# $ ls $OUT_DIR/GCA_905147105.1
# archaea_odb10.full_table.tsv.gz
# arthropoda_odb10.full_table.tsv.gz
# bacteria_odb10.full_table.tsv.gz
# chunk_stats.tsv.gz
# endopterygota_odb10.full_table.tsv.gz
# eukaryota_odb10.full_table.tsv.gz
# insecta_odb10.full_table.tsv.gz
# lepidoptera_odb10.full_table.tsv.gz
# metazoa_odb10.full_table.tsv.gz

function loop_busco_dirs() {

  local DIR=$1
  local OUT=$2
  
  for BUSCO_DIR in $DIR/*; do
    if [[ "$BUSCO_DIR" == *busco*.tar ]]; then
      TMP=${BUSCO_DIR#*busco.}   # remove prefix ending in "busco."
      LINEAGE=${TMP%.tar}   # remove suffix starting with ".tar"
      tar xOf $BUSCO_DIR "*/full_table.tsv.gz" > $OUT/$LINEAGE.full_table.tsv.gz
    fi
  done

}

function loop_dirs() {

  local DIR=$1
  
  for SUBDIR in $DIR/*/; do
    if [ -d "$SUBDIR" ]; then
      # Set assembly accession
      if [ -e $SUBDIR/config.yaml ]; then
        ACCESSION=$(yq -r '.assembly.accession' $SUBDIR/config.yaml)
        echo $ACCESSION
        TAXID=$(yq -r '.taxon.taxon_id' $SUBDIR/config.yaml)
      else
        ACCESSION=$(basename $SUBDIR)
        echo $TAXID
      fi
      TAXID=$(curl -Ls "https://goat.genomehubs.org/api/v2/search?taxonomy=ncbi&query=${ACCESSION}&result=assembly&fields=none" | yq -r '.results[0].result.taxon_id')
      

      mkdir -p $OUT_DIR/$ACCESSION
      yq -n --arg accession "$ACCESSION" --arg taxid "$TAXID" \
        '{"assembly": {"accession": $accession}, "taxon": {"taxon_id": $taxid}}' > $OUT_DIR/$ACCESSION/config.yaml
      loop_busco_dirs $SUBDIR $OUT_DIR/$ACCESSION
      echo $SUBDIR
      for CHUNKS in $SUBDIR/*.chunk_stats.tsv.gz; do
      cp "$CHUNKS" "$OUT_DIR/$ACCESSION/chunk_stats.tsv.gz"
      done
    fi

  done

}

# loop through directories in BTK_DIR
loop_dirs $BTK_DIR