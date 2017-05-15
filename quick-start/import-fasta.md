# FASTA+GFF import

{% method %}
The first step in adding new data to a GenomeHubs Ensembl site is to import the assembled genome sequence and gene models from FASTA and GFF files into an Ensembl MySQL database using an EasyImport Docker container.

Parameters for the import scripts within the EasyImport container are controlled in assembly-specific configuration files. These offer a wide range of options to set passwords and assembly-specific metadata as well as accommodating the diversity of real-world GFF files and allowing the files to be imported from any location on the local filesystem or accessible via http/ftp. In practice, only a small number of these parameters need to be altered for a given assembly import so many of the parameters can be set in a default configuration file that remains unchanged across all imported assemblies.

{% common %}
![](/assets/GenomeHubs FASTA import.png)
{% endmethod %}


## Set assembly metadata

{% method %}
Create and edit a `<database name>.ini` file in the `import/conf` directory to set assembly-specific metadata:

{% common %}
```
$ nano ~/genomehubs/import/conf/genus_species_assembly_core_32_85_1.ini

```

{% endmethod %}


