#Understanding the GFF parser

The EasyImport GFF parser within GenomeHubs is designed to accommodate the diversity of real-world GFF files. This adds some complexity to the configuration of a gene model import but allows the parser to read values into an Ensembl database from the varied locations in which gene names and descriptions can be specified in a valid GFF file and to repair many of the problems that can render a GFF invalid. 

A full description of the GFF parser and other import options is available at [easy-import.readme.io](http://easy-import.readme.io)

## Parsing valid GFF

### STABLE_IDS
An Ensembl database stores the primary name for each gene, transcript and translation in a `stable_id` field. This should be a stable identifier that will continue to be used if the same gene is subsequently imported from an updated assembly/annotation. 


{% method %}
The first step in importing gene models is to identify the features/attributes to use as a sources of stable IDs, these are typically the values of the `ID` or `Name` attributes from the corresponding feature (`Gene`, `mRNA` or `CDS`):
- the syntax follows the general pattern `feature->attribute`
- the `/(.+)/` is a per regular expression to match the entire value of the selected attribute

{% common %}

```
$ nano ~/genomehubs/v1/ensembl/conf/database.ini
[GENE_STABLE_IDS]
    GFF = [ gene->ID /(.+)/ ]
[TRANSCRIPT_STABLE_IDS]
    GFF = [ mRNA->ID /(.+)/ ]
[TRANSLATION_STABLE_IDS]
    GFF = [ CDS->ID /(.+)/ ]
```
{% endmethod %}












