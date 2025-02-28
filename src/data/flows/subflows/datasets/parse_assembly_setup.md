# Run pipeline on subsets of taxa

Useful for debugging and running in parallel. Subsequent runs can reuse the output file so should be much faster.

```
cd ~/goat-data/sources/assembly-data-aves/
conda activate prefect
python ../../pipelines/assembly/parse_ncbi_assemblies.py -r 8782 -f ncbi_datasets_eukaryota

cd ~/goat-data/sources/assembly-data-mammalia/
conda activate prefect
python ../../pipelines/assembly/parse_ncbi_assemblies.py -r 40674 -f ncbi_datasets_eukaryota

cd ~/goat-data/sources/assembly-data-viridiplantae/
conda activate prefect
python ../../pipelines/assembly/parse_ncbi_assemblies.py -r 33090 -f ncbi_datasets_eukaryota

cd ~/goat-data/sources/assembly-data-basidiomycota/
conda activate prefect
python ../../pipelines/assembly/parse_ncbi_assemblies.py -r 5204 -f ncbi_datasets_eukaryota

cd ~/goat-data/sources/assembly-data-arthropoda/
conda activate prefect
python ../../pipelines/assembly/parse_ncbi_assemblies.py -r 6656 -f ncbi_datasets_eukaryota

cd ~/goat-data/sources/assembly-data-saccharomycotina/
conda activate prefect
python ../../pipelines/assembly/parse_ncbi_assemblies.py -r 147537 -f ncbi_datasets_eukaryota

cd ~/goat-data/sources/assembly-data-eurotiomycetes/
conda activate prefect
python ../../pipelines/assembly/parse_ncbi_assemblies.py -r 147545 -f ncbi_datasets_eukaryota

cd ~/goat-data/sources/assembly-data-sordariomyceta/
conda activate prefect
python ../../pipelines/assembly/parse_ncbi_assemblies.py -r 715989 -f ncbi_datasets_eukaryota

cd ~/goat-data/sources/assembly-data-fungi/
conda activate prefect
python ../../pipelines/assembly/parse_ncbi_assemblies.py -r 4751 -f ncbi_datasets_eukaryota

cp -r ~/goat-data/sources/assembly-data ~/goat-data/sources/assembly-data-actinopteri
cd ~/goat-data/sources/assembly-data-actinopteri/
conda activate prefect
python ../../pipelines/assembly/parse_ncbi_assemblies.py -r 186623 -f ncbi_datasets_eukaryota

cp -r ~/goat-data/sources/assembly-data ~/goat-data/sources/assembly-data-chordata
cd ~/goat-data/sources/assembly-data-chordata/
cat ../assembly-data-aves/ncbi_datasets_eukaryota.tsv.gz \
 ../assembly-data-mammalia/ncbi_datasets_eukaryota.tsv.gz \
 ../assembly-data-actinopteri/ncbi_datasets_eukaryota.tsv.gz \
 > ncbi_datasets_eukaryota.tsv.gz
conda activate prefect
python ../../pipelines/assembly/parse_ncbi_assemblies.py -r 7711 -f ncbi_datasets_eukaryota

cp -r ~/goat-data/sources/assembly-data ~/goat-data/sources/assembly-data-all
cd ~/goat-data/sources/assembly-data-all/
cat ../assembly-data-chordata/ncbi_datasets_eukaryota.tsv.gz \
 ../assembly-data-viridiplantae/ncbi_datasets_eukaryota.tsv.gz \
 ../assembly-data-arthropoda/ncbi_datasets_eukaryota.tsv.gz \
 ../assembly-data-fungi/ncbi_datasets_eukaryota.tsv.gz \
 > ncbi_datasets_eukaryota.tsv.gz
conda activate prefect
python ../../pipelines/assembly/parse_ncbi_assemblies.py -r 2759 -f ncbi_datasets_eukaryota

```

## Log errors for assemblies that time out

These will need to be revisited

```

ERROR: Timeout fetching sequence report for GCA_910574605.1
ERROR: Timeout fetching sequence report for GCA_013487665.1
ERROR: Timeout fetching sequence report for GCA_013677265.1
ERROR: Timeout fetching sequence report for GCA_013467495.1
ERROR: Timeout fetching sequence report for GCA_013677255.1
ERROR: Timeout fetching sequence report for GCA_013677235.1
ERROR: Timeout fetching sequence report for GCA_013511315.1
ERROR: Timeout fetching sequence report for GCA_013467485.1
ERROR: Timeout fetching sequence report for GCA_013677275.1
ERROR: Timeout fetching sequence report for GCA_903970725.1
ERROR: Timeout fetching sequence report for GCA_903994185.1
ERROR: Timeout fetching sequence report for GCA_014338645.1

ERROR: Timeout fetching sequence report for GCA_028533215.1
ERROR: Timeout fetching sequence report for GCA_028627265.1
ERROR: Timeout fetching sequence report for GCA_028627265.1
ERROR: Timeout fetching sequence report for GCA_028534165.1
ERROR: Timeout fetching sequence report for GCA_028643805.1
ERROR: Timeout fetching sequence report for GCA_028533375.1
ERROR: Timeout fetching sequence report for GCA_028627145.1
ERROR: Timeout fetching sequence report for GCA_028534055.1
ERROR: Timeout fetching sequence report for GCA_028646425.1
ERROR: Timeout fetching sequence report for GCA_028533245.1
ERROR: Timeout fetching sequence report for GCA_000252825.1
ERROR: Timeout fetching sequence report for GCA_022833125.2
ERROR: Timeout fetching sequence report for GCA_028533205.1
ERROR: Timeout fetching sequence report for GCA_028534125.1
ERROR: Timeout fetching sequence report for GCA_028583105.1
ERROR: Timeout fetching sequence report for GCA_028627215.1
ERROR: Timeout fetching sequence report for GCA_028551445.1
ERROR: Timeout fetching sequence report for GCA_028533875.1
ERROR: Timeout fetching sequence report for GCA_000002165.1
ERROR: Timeout fetching sequence report for GCA_000772465.1
ERROR: Timeout fetching sequence report for GCA_028533885.1
ERROR: Timeout fetching sequence report for GCA_028658305.1
ERROR: Timeout fetching sequence report for GCA_028533385.1
ERROR: Timeout fetching sequence report for GCA_028645565.1
ERROR: Timeout fetching sequence report for GCA_028646595.1
ERROR: Timeout fetching sequence report for GCA_028551515.1
ERROR: Timeout fetching sequence report for GCA_028658325.1
ERROR: Timeout fetching sequence report for GCA_028534135.1
ERROR: Timeout fetching sequence report for GCA_028551425.1
ERROR: Timeout fetching sequence report for GCA_028646535.1
ERROR: Timeout fetching sequence report for GCA_028646575.1
ERROR: Timeout fetching sequence report for GCA_028646515.1
ERROR: Timeout fetching sequence report for GCA_028627135.1
ERROR: Timeout fetching sequence report for GCA_028533765.1
ERROR: Timeout fetching sequence report for GCA_000002265.1
ERROR: Timeout fetching sequence report for GCA_028533395.1
ERROR: Timeout fetching sequence report for GCA_028643795.1
ERROR: Timeout fetching sequence report for GCA_015711505.1
ERROR: Timeout fetching sequence report for GCA_028642525.1
ERROR: Timeout fetching sequence report for GCA_028533255.1
ERROR: Timeout fetching sequence report for GCA_028533065.1
ERROR: Timeout fetching sequence report for GCA_028551405.1
ERROR: Timeout fetching sequence report for GCA_028533085.1
ERROR: Timeout fetching sequence report for GCA_028626985.1
ERROR: Timeout fetching sequence report for GCA_028644305.1

ERROR: Timeout fetching sequence report for GCA_022985145.1
ERROR: Timeout fetching sequence report for GCA_000233375.4

ERROR: Timeout fetching sequence report for GCA_004010195.1
```

## Notes

Had to remove prefect decorators as pipeine was much too slow and memory hungry with prefect overhead. Need to revisit and either use `quote()` or set tasks at a higher level.
