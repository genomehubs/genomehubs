# Import analysis results

{% method %}
The results of common analyses can be imported into an Ensembl database to provide functional annotations. 

Running the file export after this stage will add additional information to the exported FASTA headers and json files. Updating the index (with the `-i` flag) will index the descriptions imported from blastp, protein domains, etc.

{% common %}
![](/assets/GenomeHubs import-2.png)
{% endmethod %}


{% method %}
Run the import script:
* `-b` will import blastp and InterProScan results
* `-r` will import repeatmasker results
* `-c` will import CEGMA and BUSCO results

{% sample lang="e85" %}
```
$ docker run --rm \
             -u $UID:$GROUPS \
             --name easy-import-operophtera_brumata_v1_core_32_85_1 \
             --link genomehubs-mysql \
             -v ~/genomehubs/v1/import/conf:/import/conf \
             -v ~/genomehubs/v1/import/data:/import/data \
             -v ~/genomehubs/v1/download/data:/download/data \
             -e DATABASE=operophtera_brumata_obru1_core_32_85_1 \
             -e FLAGS="-b -r -c" \
             genomehubs/easy-import:17.06
```

{% sample lang="e89" %}
```
$ docker run --rm \
             -u $UID:$GROUPS \
             --name easy-import-operophtera_brumata_v1_core_36_89_1 \
             --link genomehubs-mysql \
             -v ~/genomehubs/v1/import/conf:/import/conf \
             -v ~/genomehubs/v1/import/data:/import/data \
             -v ~/genomehubs/v1/download/data:/download/data \
             -e DATABASE=operophtera_brumata_obru1_core_36_89_1 \
             -e FLAGS="-b -r -c" \
             genomehubs/easy-import:17.06
```

{% endmethod %}


