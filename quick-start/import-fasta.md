# Import assembly and gene models

{% method %}
The first step in adding new data to a GenomeHubs Ensembl site is to import the assembled genome sequence and gene models from FASTA and GFF files into an Ensembl MySQL database using an EasyImport Docker container.

Parameters for the import scripts within the EasyImport container are controlled in assembly-specific configuration files. These offer a wide range of options to set passwords and assembly-specific metadata as well as accommodating the diversity of real-world GFF files and allowing the files to be imported from any location on the local filesystem or accessible via http/ftp. In practice, only a small number of these parameters need to be altered for a given assembly import so many of the parameters can be set in a default configuration file that remains unchanged across all imported assemblies.

The complexity of running this step is largely determined by the validity of the input files - there are many ways in which GFF3 files in particular can differ from published standards and there are configuration options to accommodate much of the diversity of real-world GFF files (see [easy-import.readme.io](http://easy-import.readme.io)). If you prefer to ensure the validity of your files using external tools then, apart from accommodating conflicting definitions of phase, the default import settings should be sufficient.

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
$ cd ~/genomehubs/v1/import/conf/
$ cp default.ini default.ini.original
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
Each imported assembly must be stored in a uniquely named database. GenomeHubs follows the Ensembl naming conventions with the addition of an assembly name to allow alternate assemblies for a single species to be hosted in a single site. Database names should be all lower case with no special characters other than letters, numbers and underscores. A subspecies/strain can optionally be included. For Ensembl release 32/85 (which is currently the version supported by GenomeHubs) the database name for _Operophtera brumata_ assembly Obru1 would be:

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
$ cd ~/genomehubs/v1/import/conf/
$ cp genus_species_assembly_core_32_85_1.ini operophtera_brumata_obru1_core_32_85_1.ini
$ nano operophtera_brumata_obru1_core_32_85_1.ini
# update values to match your species/assembly name and other details
[DATABASE_CORE]
        NAME = operophtera_brumata_obru1_core_32_85_1
[META]
        SPECIES.PRODUCTION_NAME = operophtera_brumata_obru1
        SPECIES.SCIENTIFIC_NAME = Operophtera brumata
        SPECIES.COMMON_NAME = Winter moth 
        SPECIES.DISPLAY_NAME = Operophtera brumata
        SPECIES.DIVISION = EnsemblMetazoa
        SPECIES.URL = Operophtera_brumata_obru1
        SPECIES.TAXONOMY_ID = 104452
        SPECIES.ALIAS = [ ]                   
        ASSEMBLY.NAME = Obru1
        ASSEMBLY.DATE = 2015-08-11
        ASSEMBLY.ACCESSION = 
        ASSEMBLY.DEFAULT = Obru1
        PROVIDER.NAME = Wageningen University
        PROVIDER.URL = http://www.bioinformatics.nl/wintermoth/portal/  
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


## Run the import

{% method %}
Run an EasyImport Docker container with flags to import sequences (`-s`), prepare (`-p`), import (`-g`) gff and verify (`-v`) the imported sequences using the provided protein FASTA file:
* verification compares imported gene models against an expected protein FASTA sequence, if you do not have a file with predicted protein sequences you may wish to export sequences from the database (replacing the `-v` flag with `-e`) to check the translations manually

{% common %}
```
$ docker run --rm \
             -u $UID:$GROUPS \
             --name easy-import-operophtera_brumata_v1_core_32_85_1 \
             --link genomehubs-mysql \
             -v ~/genomehubs/v1/import/conf:/import/conf \
             -v ~/genomehubs/v1/import/data:/import/data \
             -e DATABASE=operophtera_brumata_obru1_core_32_85_1 \
             -e FLAGS="-s -p -g -v" \
             genomehubs/easy-import:latest
```
{% endmethod %}

## Check the import

{% method %}
Check the import and verification log files for errors:
* local files for each assembly will be written to a `<database name>` directory 
* there are likely to be a number of warnings, which can be ignored
* if there are errors, update the configuration files and rerun the step above

{% common %}
```
$ ls ~/genomehubs/import/data/operophtera_brumata_obru1_core_32_85_1

$ ls ~/genomehubs/import/data/operophtera_brumata_obru1_core_32_85_1/logs

$ ls ~/genomehubs/import/data/operophtera_brumata_obru1_core_32_85_1/summary

```
{% endmethod %}

## Process exceptions

If it is not possible to process all features in a GFF3 file with the current settings (e.g. if some features lack `Name` attributes), features not written to the prepared gff will be written to a `.exception.gff` file for processing in a second pass.  See [easy-import.readme.io](https://easy-import.readme.io/docs/processing-exceptions) for details.






