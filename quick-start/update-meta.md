# 7. Update meta

Values in the `[META]` section of each `<database name>.ini` file are written to the `meta` table of the corresponding Ensembl database when it is created during the initial [assembly import](import-fasta.md) step. Often it is convenient to add to or amend these entries after the initial import, for example to set suggested search terms after importing blastp or InterProScan results, but note that values such as production name, species url and assembly name cannot be changed in this way after the initial import.

If a single value is present in the database for a given key, it will be replaced. If multiple values are present, an additional value will be added.

![](../.gitbook/assets/GenomeHubs%20meta.png)

## Add/replace metadata values

Add suggested search terms:

{% tabs %}
{% tab title="e93" %}
```text
$ nano ~/genomehubs/v1/import/conf/operophtera_brumata_obru1_core_40_93_1.ini
```
{% endtab %}

{% tab title="e89" %}
```text
$ nano ~/genomehubs/v1/import/conf/operophtera_brumata_obru1_core_36_89_1.ini
```
{% endtab %}

{% tab title="e85" %}
```text
$ nano ~/genomehubs/v1/import/conf/operophtera_brumata_obru1_core_32_85_1.ini
```
{% endtab %}
{% endtabs %}

```text
# existing entries not shown
[META]
        SAMPLE.LOCATION_PARAM    = OBRU01_Sc00001:57580-69243
        SAMPLE.LOCATION_TEXT     = OBRU01_Sc00001:57580-69243
        SAMPLE.GENE_PARAM        = OBRU01_00004
        SAMPLE.GENE_TEXT         = OBRU01_00004
        SAMPLE.TRANSCRIPT_PARAM  = OBRU01_00004-RA
        SAMPLE.TRANSCRIPT_TEXT   = OBRU01_00004-RA
        SAMPLE.SEARCH_TEXT       = OBRU01_00015-RA
```

Run an EasyImport Docker container with `-u` flag to update metadata:

{% tabs %}
{% tab title="e93" %}
```text
$ docker run --rm \
             -u $UID:$GROUPS \
             --name easy-import-operophtera_brumata_v1_core_40_93_1 \
             --network genomehubs-network \
             -v ~/genomehubs/v1/import/conf:/import/conf \
             -v ~/genomehubs/v1/import/data:/import/data \
             -e DATABASE=operophtera_brumata_obru1_core_40_93_1 \
             -e FLAGS="-u" \
             genomehubs/easy-import:19.05
```
{% endtab %}

{% tab title="e89" %}
```text
$ docker run --rm \
             -u $UID:$GROUPS \
             --name easy-import-operophtera_brumata_v1_core_36_89_1 \
             --link genomehubs-mysql \
             -v ~/genomehubs/v1/import/conf:/import/conf \
             -v ~/genomehubs/v1/import/data:/import/data \
             -e DATABASE=operophtera_brumata_obru1_core_36_89_1 \
             -e FLAGS="-u" \
             genomehubs/easy-import:17.06
```
{% endtab %}

{% tab title="e85" %}
```text
$ docker run --rm \
             -u $UID:$GROUPS \
             --name easy-import-operophtera_brumata_v1_core_32_85_1 \
             --link genomehubs-mysql \
             -v ~/genomehubs/v1/import/conf:/import/conf \
             -v ~/genomehubs/v1/import/data:/import/data \
             -e DATABASE=operophtera_brumata_obru1_core_32_85_1 \
             -e FLAGS="-u" \
             genomehubs/easy-import:17.03
```
{% endtab %}
{% endtabs %}

