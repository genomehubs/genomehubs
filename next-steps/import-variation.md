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
$ nano nano /path/to/conf/example_variants.ini
sample_1           population 1
sample_2           population 1
sample_3           population 2
sample_4           population 2
...
```
{% endmethod %}


{% method %}
Create and edit a configuration file to set database and variant details:

{% common %}

```
$ nano nano /path/to/conf/example_variants.ini
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

