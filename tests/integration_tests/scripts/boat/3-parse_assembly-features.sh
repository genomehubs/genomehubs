#!/bin/bash

RAW_DIR=/tmp
ASSEMBLY_DIR=$HOME/projects/genomehubs/genomehubs/tests/integration_tests/data/boat/assembly-data
GROUP=lepidoptera

function set_header() {

  local DIR=$1
  local FILE=$2
  local ROW="taxon_id\taccession"

  for COL in $(gunzip -c $DIR/chunk_stats.tsv.gz | head -n 1); do
    if [[ "$COL" == *odb*_count ]]; then
      LINEAGE=${COL%_count}  # remove suffix
      HEADER+=( $LINEAGE )
      ROW+="\t${LINEAGE}_complete\t${LINEAGE}_duplicated\t${LINEAGE}_single\t${LINEAGE}_fragmented\t${LINEAGE}_missing"
    fi
  done

  if [[ ! -z $HEADER ]]; then
    printf "$ROW\n" > $FILE
    return 0
  fi

  return 1

}

function join_by { local IFS="$1"; shift; echo "$*"; }

function extract_busco_genes() {
  local FULL_TABLE=$1
  COMPLETE=()
  local DUPLICATED=()
  local SINGLE=()
  local FRAGMENTED=()
  local MISSING=()
  local ENTRY=()

  if [ ! -f $FULL_TABLE ]; then
    echo "\tNone\tNone\tNone\tNone\tNone"
    return
  fi
  CTR=0
  while read ID STATUS REST; do
    [[ "$ID" == "#" ]] && continue
    if [[ "$STATUS" == Complete ]]; then
      COMPLETE+=( $ID )
      SINGLE+=( $ID )
    elif [[ "$STATUS" == Duplicated ]]; then
      if [[ ! " ${DUPLICATED[*]} " =~ " ${ID} " ]]; then
        DUPLICATED+=( $ID )
      fi
      if [[ ! " ${COMPLETE[*]} " =~ " ${ID} " ]]; then
        COMPLETE+=( $ID )
      fi
    elif [[ "$STATUS" == Fragmented ]]; then
      if [[ ! " ${FRAGMENTED[*]} " =~ " ${ID} " ]]; then
        FRAGMENTED+=( $ID )
      fi
    elif [[ "$STATUS" == Missing ]]; then
      MISSING+=( $ID )
    fi
  done < <(gunzip -c $FULL_TABLE)
  if [[ -z $COMPLETE ]]; then
    printf "\tNone"
  else
      printf "\t$(join_by "," "${COMPLETE[@]}")"
  fi
  if [[ -z $DUPLICATED ]]; then
    printf "\tNone"
  else
      printf "\t$(join_by "," "${DUPLICATED[@]}")"
  fi
  if [[ -z $SINGLE ]]; then
    printf "\tNone"
  else
      printf "\t$(join_by "," "${SINGLE[@]}")"
  fi
  if [[ -z $FRAGMENTED ]]; then
    printf "\tNone"
  else
      printf "\t$(join_by "," "${FRAGMENTED[@]}")"
  fi
  if [[ -z $MISSING ]]; then
    printf "\tNone"
  else
      printf "\t$(join_by "," "${MISSING[@]}")"
  fi
}

function generate_yaml() {

  local TSVFILE=$1

  echo "defaults:
  attributes:
    display_group: busco
    display_level: 2
    separator: \",\"
    source: BlobToolKit
    source_url_stub: https://blobtoolkit.genomehubs.org
    taxon_display_level: 2
    taxon_summary: ordered_list
    taxon_traverse: ordered_list
    taxon_traverse_direction: up
    type: keyword
    summary: list
    return_type: length
file:
  format: tsv
  header: true
  name: $(basename $TSVFILE)
identifiers:
  assembly_id:
    constraint:
      len: 32
    header: accession
    type: keyword
taxonomy:
  taxon_id:
    header: taxon_id
attributes:"

    for LINEAGE in "${HEADER[@]}"; do

      TAXON=${LINEAGE%_odb*}

      for LEVEL in complete fragmented missing; do
        echo "  ${LINEAGE}_${LEVEL}:
    display_name: BUSCO ${LINEAGE} ${LEVEL}
    header: ${LINEAGE}_${LEVEL}
    list_key: ${LINEAGE}_${LEVEL}
    order:
      - ${LINEAGE}_complete
      - ${LINEAGE}_fragmented
      - ${LINEAGE}_missing
    taxon_traverse_limit: ${TAXON}"
      done

      for LEVEL in duplicated single; do
        echo "  ${LINEAGE}_${LEVEL}:
    display_name: BUSCO ${LINEAGE} ${LEVEL}
    header: ${LINEAGE}_${LEVEL}
    list_key: ${LINEAGE}_${LEVEL}
    order:
      - ${LINEAGE}_duplicated
      - ${LINEAGE}_single
    taxon_traverse_limit: ${TAXON}"
      done

    done
}

function loop_dirs() {

  local DIR=$1
  local OUTDIR=$2

  mkdir -p $OUTDIR

  local OUTFILE=$OUTDIR/$GROUP.busco.tsv
  local YAMLFILE=$OUTDIR/$GROUP.busco.types.yaml

  local HEADER=()
  
  for SUBDIR in $DIR/*/; do
    if [ -d "$SUBDIR" ]; then
      # Set assembly accession
      ACCESSION=$(basename $SUBDIR)
      [[ "$ACCESSION" != GCA_* ]] && continue
      if [[ -z $HEADER ]]; then
        set_header $SUBDIR $OUTFILE
        if [[ "$?" == "1" ]]; then
          continue
        fi
        generate_yaml $OUTFILE > $YAMLFILE
      fi
      TAXID=$(yq -r '.taxon.taxon_id' $SUBDIR/config.yaml)
      ROW="$TAXID\t$ACCESSION"
      for LINEAGE in "${HEADER[@]}"; do
        ROW+=$(extract_busco_genes $SUBDIR/$LINEAGE.full_table.tsv.gz)
      done
      printf "$ROW\n" >> $OUTFILE
    fi

  done

}

# loop through directories in RAW_DIR
loop_dirs $RAW_DIR $ASSEMBLY_DIR