# Import assembly and gene models

{% method %}
The first step in adding new data to a GenomeHubs Ensembl site is to import the assembled genome sequence and gene models from FASTA and GFF files into an Ensembl MySQL database using an EasyImport Docker container.

Parameters for the import scripts within the EasyImport container are controlled in assembly-specific configuration files. These offer a wide range of options to set passwords and assembly-specific metadata as well as accommodating the diversity of real-world GFF files and allowing the files to be imported from any location on the local filesystem or accessible via http/ftp. In practice, only a small number of these parameters need to be altered for a given assembly import so many of the parameters can be set in a default configuration file that remains unchanged across all imported assemblies.

{% common %}
![](/assets/GenomeHubs import.png)
{% endmethod %}

## Choose a name for your new assembly database

{% method %}
Each imported assembly must be stored in a uniquely named database. GenomeHubs follows the Ensembl naming conventions with the addition of an assembly name to allow alternate assemblies for a single species to be hosted in a single site. Database names should be all lower case with no special characters other than letters, numbers and underscores. A subspecies/strain can optionally be included, so (for Ensembl release 32/85 which is currently supported by GenomeHubs) _Heliconius melpomene rosina_ assembly Hmel2 could be either of:

{% common %}
```
heliconius_melpomene_hmel2_core_32_85_1
heliconius_melpomene_rosina_hmel2_core_32_85_1
```
{% endmethod %}


## Set assembly metadata

{% method %}
Create and edit a `<database name>.ini` file in the `import/conf` directory to set assembly-specific metadata using the `genus_species_asm_core_32_85_1.ini` template file:

* pay attention to the case fo the default values you are replacing and the use of spaces/underscores
* the value for `ASSEMBLY.NAME` should show the assembly name as you would like it to be displayed and may contain dots but any dots should be omitted from the assembly name portion of `SPECIES.PRODUCTION_NAME` and `SPECIES.URL`

{% common %}
```
$ cd ~/genomehubs/import/conf/
$ cp genus_species_assembly_core_32_85_1.ini heliconius_melpomene_hmel2_core_32_85_1.ini
$ nano heliconius_melpomene_hmel2_core_32_85_1.ini
# update values to match your species/assembly name and other details
[DATABASE_CORE]
        NAME = genus_species_asm_core_32_85_1
[META]
        SPECIES.PRODUCTION_NAME = genus_species_asm
        SPECIES.SCIENTIFIC_NAME = Genus species
        SPECIES.COMMON_NAME = Common name
        SPECIES.DISPLAY_NAME = Genus species
        SPECIES.DIVISION = EnsemblMetazoa
        SPECIES.URL = Genus_species_asm
        SPECIES.TAXONOMY_ID = 1
        SPECIES.ALIAS = [ ]                   
        ASSEMBLY.NAME = Assembly.name
        ASSEMBLY.DATE = 2017-05-10
        ASSEMBLY.ACCESSION = 
        ASSEMBLY.DEFAULT = Assembl.name
        PROVIDER.NAME = Provider name
        PROVIDER.URL = http://example.com      
        GENEBUILD.ID = 1
        GENEBUILD.START_DATE = 2017-05
        GENEBUILD.VERSION = 1
        GENEBUILD.METHOD = import

```

{% endmethod %}


