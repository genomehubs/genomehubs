# Import assembly and gene models

{% method %}
The first step in adding new data to a GenomeHubs Ensembl site is to import the assembled genome sequence and gene models from FASTA and GFF files into an Ensembl MySQL database using an EasyImport Docker container.

Parameters for the import scripts within the EasyImport container are controlled in assembly-specific configuration files. These offer a wide range of options to set passwords and assembly-specific metadata as well as accommodating the diversity of real-world GFF files and allowing the files to be imported from any location on the local filesystem or accessible via http/ftp. In practice, only a small number of these parameters need to be altered for a given assembly import so many of the parameters can be set in a default configuration file that remains unchanged across all imported assemblies.

{% common %}
![](/assets/GenomeHubs import.png)
{% endmethod %}

## Set general import parameters

{% method %}
Create and edit a `default.ini` file to set database connection parameters that are likely to remain constant across all assembly imports: 

* if the databases are hosted in a MySQL Docker container hosted on the same machine as the import will run then the `HOST` should be the name of the container, otherwise it should be the name/ip address of the host
* values in this file can be overwritten by entries in an assembly-specific configuration file described below
* this file also includes default GFF parsing parameters that are unlikely to need changing

{% common %}
```
$ cd ~/genomehubs/import/conf/
$ cp default.ini default.ini
$ nano default.ini
# update values to match your database connection details
[DATABASE_CORE]
	HOST = genomehubs-mysql
	PORT = 3306
	RO_USER = anonymous
[DATABASE_SEARCH]
	NAME = genomehubs_search_32_85
	HOST = genomehubs-mysql
	PORT = 3306
	RO_USER = anonymous
	RO_PASS =
[DATABASE_TAXONOMY]
	NAME = ncbi_taxonomy
	HOST = genomehubs-mysql
	PORT = 3306
	RO_USER = anonymous
[DATABASE_TEMPLATE]
	NAME = melitaea_cinxia_core_32_85_1
	HOST = genomehubs-mysql
	PORT = 3306
	RO_USER = anonymous
```
{% endmethod %}

{% method %}
Update the passwords in `overwrite.ini`:

* values in this file will overwrite entries in `default.ini` and the assembly-specific file so it is a convenient way to keep passwords separate from the remaining configuration details 

{% common %}
```
$ cp overwrite.ini overwrite.ini
$ nano overwrite.ini
# update values to match your database connection details
[DATABASE_CORE]
        RW_USER = importer
        RW_PASS = CHANGEME
[DATABASE_SEARCH]
        RW_USER = importer
        RW_PASS = CHANGEME
```
{% endmethod %}


## Choose a name for your new assembly database

{% method %}
Each imported assembly must be stored in a uniquely named database. GenomeHubs follows the Ensembl naming conventions with the addition of an assembly name to allow alternate assemblies for a single species to be hosted in a single site. Database names should be all lower case with no special characters other than letters, numbers and underscores. A subspecies/strain can optionally be included. For Ensembl release 32/85 (which is currently the version supported by GenomeHubs) the dtaabase name for _Operophtera brumata_ assembly Obru1 would be:

{% common %}
```
operophtera_brumata_obru1_core_32_85_1
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
$ cp genus_species_assembly_core_32_85_1.ini operophtera_brumata_obru1_core_32_85_1.ini
$ nano operophtera_brumata_obru1_core_32_85_1.ini
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

## Set assembly-specific file locations and gff parameters

{% method %}
Edit `<database name>.ini` to set paths to files to import, locations of identifiers in the files and settings to control the wat the gff file is processed:

* files can be in any location accessible on the local filesystem or via ftp/http
* names are provided in the gff file so stable IDs can be set using this attribute, commonly only ID is available and this would be used as the source of the stable IDs (see full documentation at [easy-import.readme.io](http://easy-import.readme.io))
* this guide assumes you will be importing valid gff3, full details of the syntax to repair invalid gff files during import is available at [easy-import.readme.io](http://easy-import.readme.io)

{% common %}
```
$ nano operophtera_brumata_obru1_core_32_85_1.ini
[FILES]
	SCAFFOLD = [ fa http://download.lepbase.org/v4/provider/Obru1.fsa.gz ]
	GFF = [ gff3 http://download.lepbase.org/v4/provider/Obru_genes.gff.gz ]
	PROTEIN = [ fa http://download.lepbase.org/v4/provider/ObruPep.fasta.gz ]
[GENE_STABLE_IDS]
	GFF = [ gene->Name /(.+)/ ]
[TRANSCRIPT_STABLE_IDS]
	GFF = [ SELF->Name /(.+)/ ]
[TRANSLATION_STABLE_IDS]
	GFF = [ SELF->Name /(.+)/ /-RA/-PA/ ]
[MODIFY]
	OVERWRITE_DB = 1
	TRUNCATE_SEQUENCE_TABLES = 1
	TRUNCATE_GENE_TABLES = 1
```
{% endmethod %}


## Import assembly and gene models

{% method %}


{% common %}
```

```
{% endmethod %}
















