# Import variation data

Variants can imported using a wrapper around the Ensembl [Import VCF Script](http://www.ensembl.org/info/genome/variation/import_vcf.html), which exposes a subset of the full functionality. 

{% method %}
The input must be a bgzipped vcf file:
{% common %}

```
$ bgzip variants.vcf
```
{% endmethod %}


{% method %}
Create and edit a panel file to associate samples with populations:

- this file has 2, tab-separated columns
- sample names must match the sample names in the vcf file
- only samples listed in this file will be imported

{% common %}

```
$ nano nano /path/to/data/panel.tsv
sample_1           population 1
sample_2           population 1
sample_3           population 2
sample_4           population 2
...
```
{% endmethod %}


{% method %}
Create and edit a description file to add a description for each sample:

- this file has 2, tab-separated columns
- sample names must match the sample names in the vcf file
- html markup is supported and can be used to add a link to related SRA accession, if available

{% common %}

```
$ nano nano /path/to/data/panel.tsv
sample_1           description of sample 1
sample_2           description of sample 2
sample_3           description of sample 3
sample_4           description of sample 4
...
```
{% endmethod %}


{% method %}
Create and edit a configuration file to set database and variant details:
- as with the core database import, common settings can be specified in a `default.ini` file and passwords can be set in an `overwrite.ini` file
- if database connection settings are not set in a `[DATABASE_VARIATION]` section, values from `[DATABASE_CORE]` will be reused
- The variation database name must match the corresponding core database name with "variation" in place of "core"
- when importing local files, specify the path to the file as mounted in the container
- the `FILTER` will be passed to the bcftools view command with the `-i` flag, this is not needed if your SNP data are already filtered

{% common %}

```
$ nano nano /path/to/conf/example_variants.ini
[DATABASE_CORE]
    NAME = heliconius_erato_demophoon_v1_core_32_85_1
    HOST = genomehubs-mysql
    PORT = 3306
    RW_USER = importer
    RW_PASS = CHANGEME
    RO_USER = anonymous
[DATABASE_VARIATION]
    NAME = genus_species_assembly_variation_32_85_1
[META]
    SPECIES.PRODUCTION_NAME = genus_species_assembly
    SPECIES.SCIENTIFIC_NAME = Genus species
[FILES]
    VCF = [ vcf /import/data/variants.vcf.gz ]
    PANEL = [ tsv /import/data/panel.tsv ]
[STUDY]
    SOURCE = Anonymous 2017
[BCFTOOLS]
    FILTER = QUAL>=30 & FMT/DP>=10 & FMT/DP<=100 & SUM(FMT/DP)<=N_SAMPLES*100 & FMT/SB<200 & MIN(FMT/GQ)>=30
```
{% endmethod %}


{% method %}
Run the GenomeHubs variation container:
- depending on the number of SNPs in your VCF file after filtering, is likely to take several hours to run

{% common %}
```
docker run --rm \
           -d \
           --name genomehubs-variation \
           -u $UID:$GROUPS \
           -v /path/to/conf:/import/conf \
           -v /path/to/data:/import/data \
           -e FLAGS="-i" \
           -e VARIANTS=example_variants \
           genomehubs/variation
```
{% endmethod %}

{% method %}
Modify the EasyMirror configuration to load variation databases:

- EasyMirror will attempt to load database types listed in `SPECIES_DB_AUTOEXPAND` so this can be used to load funcgen, etc databases mirrored from Ensembl

{% common %}
```
$ nano ~/genomehubs/v1/ensembl/conf/setup.ini
[DATA_SOURCE]
  SPECIES_DB_AUTOEXPAND = [ variation ]
```
{% endmethod %}

{% method %}
Restart your Ensembl site to load the newly created variation database:

{% common %}
```
$ docker rm -f genomehubs-ensembl
$ docker run -d \
             --name genomehubs-ensembl \
             -v ~/genomehubs/v1/ensembl/conf:/ensembl/conf:ro \
             --link genomehubs-mysql \
             -p 8081:8080 \
             genomehubs/easy-mirror:latest
```

{% endmethod %}















