# Export files

{% method %}
FASTA and GFF files are required to import data into a GenomeHubs Ensembl, but analyses should be run on files exported from the database to ensure that filenames, headers, etc. are standardised. Additional filetypes can also be exported for use in visualisations, to provide files for bulk download, and to allow submission of an assembly/annotations to ENA.

File export should typically be run twice while setting up a new assembly, initially to export sequences to be used as inputs for analyses and, once the analysis results have been imported, to export a full set of files to provide bulk downloads and for BLAST.

{% common %}
![](/assets/GenomeHubs export.png)
{% endmethod %}


## Export sequences

{% method %}
Run the EasyImport Docker container using the `-e` flag to export sequences:

* run this step before running analyses
* sequence files will be written to `~/genomehubs/v1/download/data/sequence`

{% sample lang="e93" %}
```
$ docker run --rm \
             -u $UID:$GROUPS \
             --name easy-import-operophtera_brumata_obru1_core_40_93_1 \
             --network genomehubs-network \
             -v ~/genomehubs/v1/import/conf:/import/conf \
             -v ~/genomehubs/v1/import/data:/import/data \
             -v ~/genomehubs/v1/download/data:/import/download \
             -v ~/genomehubs/v1/blast/data:/import/blast \
             -e DATABASE=operophtera_brumata_obru1_core_40_93_1 \
             -e FLAGS="-e" \
             genomehubs/easy-import:19.05
```

{% sample lang="e89" %}
```
$ docker run --rm \
             -u $UID:$GROUPS \
             --name easy-import-operophtera_brumata_obru1_core_36_89_1 \
             --link genomehubs-mysql \
             -v ~/genomehubs/v1/import/conf:/import/conf \
             -v ~/genomehubs/v1/import/data:/import/data \
             -v ~/genomehubs/v1/download/data:/import/download \
             -v ~/genomehubs/v1/blast/data:/import/blast \
             -e DATABASE=operophtera_brumata_obru1_core_36_89_1 \
             -e FLAGS="-e" \
             genomehubs/easy-import:17.06
```

{% sample lang="e85" %}
```
$ docker run --rm \
             -u $UID:$GROUPS \
             --name easy-import-operophtera_brumata_obru1_core_32_85_1 \
             --link genomehubs-mysql \
             -v ~/genomehubs/v1/import/conf:/import/conf \
             -v ~/genomehubs/v1/import/data:/import/data \
             -v ~/genomehubs/v1/download/data:/import/download \
             -v ~/genomehubs/v1/blast/data:/import/blast \
             -e DATABASE=operophtera_brumata_obru1_core_32_85_1 \
             -e FLAGS="-e" \
             genomehubs/easy-import:17.03
```

{% endmethod %}

## Export all files

{% method %}
Run the EasyImport Docker container with flags to export sequences (`-e`), gff/embl format features (`-f`) and json format data for visualisations (`-j`):

* run this step after running analyses
* include the `-i` flag to index the database in addition to exporting files
* files will be written to directories under `~/genomehubs/v1/download/data/`
* files ready to format as BLAST databases will be written to `~/genomehubs/v1/blast/data/`
* EMBL format export requires `ASSEMBLY.BIOPROJECT` and `ASSEMBLY.LOCUS_TAG` to be defined in the assembly metadata (see [Update meta](//quick-start/update-meta.md))


{% sample lang="e93" %}
```
$ docker run --rm \
             -u $UID:$GROUPS \
             --name easy-import-operophtera_brumata_v1_core_40_93_1 \
             --network genomehubs-network \
             -v ~/genomehubs/v1/import/conf:/import/conf \
             -v ~/genomehubs/v1/import/data:/import/data \
             -v ~/genomehubs/v1/download/data:/import/download \
             -v ~/genomehubs/v1/blast/data:/import/blast \
             -e DATABASE=operophtera_brumata_obru1_core_40_93_1 \
             -e FLAGS="-e -f -j -i" \
             genomehubs/easy-import:19.05
```
{% sample lang="e89" %}
```
$ docker run --rm \
             -u $UID:$GROUPS \
             --name easy-import-operophtera_brumata_v1_core_36_89_1 \
             --link genomehubs-mysql \
             -v ~/genomehubs/v1/import/conf:/import/conf \
             -v ~/genomehubs/v1/import/data:/import/data \
             -v ~/genomehubs/v1/download/data:/import/download \
             -v ~/genomehubs/v1/blast/data:/import/blast \
             -e DATABASE=operophtera_brumata_obru1_core_36_89_1 \
             -e FLAGS="-e -f -j -i" \
             genomehubs/easy-import:17.06
```
{% sample lang="e85" %}
```
$ docker run --rm \
             -u $UID:$GROUPS \
             --name easy-import-operophtera_brumata_v1_core_32_85_1 \
             --link genomehubs-mysql \
             -v ~/genomehubs/v1/import/conf:/import/conf \
             -v ~/genomehubs/v1/import/data:/import/data \
             -v ~/genomehubs/v1/download/data:/import/download \
             -v ~/genomehubs/v1/blast/data:/import/blast \
             -e DATABASE=operophtera_brumata_obru1_core_32_85_1 \
             -e FLAGS="-e -f -j -i" \
             genomehubs/easy-import:17.03
```
{% endmethod %}



