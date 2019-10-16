# Run comparative analyses

A powerful Ensembl feature supported by GenomeHubs is the ability to incorporate orthology information in the Compara database schema, which can be displayed in gene trees on the web site. GenomeHubs does not use the Ensembl Compara pipeline but provides an analysis containers and import scripts to populate a Compara database using an [OrthoFinder](https://github.com/davidemms/OrthoFinder)-based approach.

**_The configuration has not yet been fully tested so following the formatting of the examples below as closely as possible is recommended. It is intended to support more flexibility when running OrthoFinder, but currently only the described methods have been tested._**

{% method %}
Create a config file with the same name as your Compara database in the `import/conf` directory. This will have the form `sitename_compara_40_93.ini`. The examples below are based on [mealybug.org](https://ensembl.mealybug.org) so substitute `mealybug` for your site name. The initial sections in this file are similar to the assembly config files described elsewhere:

{% common %}
```
nano ~/genomehubs/v1/import/conf/mealybug-compara_40_93.ini
```

```
[ENSEMBL]
        LOCAL = /ensembl
[DATABASE_COMPARA]
        NAME = mealybug_compara_40_93
        HOST = genomehubs-mysql
        PORT = 3306
        RW_USER = importer
        RW_PASS = importpassword
        RO_USER = anonymous
        RO_PASS =
[DATABASE_TEMPLATE]
        NAME = ensembl_compara_metazoa_40_93
        URL = ftp://ftp.ensemblgenomes.org/pub/release-40/metazoa/mysql/
[DATABASE_CORE]
        HOST = genomehubs-mysql
        PORT = 3306
        RO_USER = anonymous
        RO_PASS =
```

{% endmethod %}

{% method %}

The `[SETUP]` section contains some paths to define where files will be written relative to the container filesystem. `FASTA_DIR` will contain sequence files exported from the core databases ready for analysis, `TMP_DIR` is needed to retain untrimmed alignments that would otherwise be discarded by OrthoFinder, `ORTHOFINDER_DIR` will contain the OrthoFinder results and `ORTHOGROUP_DIR` is used for processed orthogroup files ready for import into the Compara database. `REMOVE` is probably not needed but is listed here in case it is still used somewhere.

{% common %}
```
[SETUP]
        FASTA_DIR = /import/data/mealybug_compara_40_93/exported
        TMP_DIR = /import/data/tmp
        ORTHOFINDER_DIR = /import/data/mealybug_compara_40_93/OrthoFinder/Results_v1
        ORTHOGROUP_DIR = /import/data/mealybug_compara_40_93/orthogroups
        REMOVE = [ ]

```

{% endmethod %}

{% method %}

The `[TAXA]` section contains a mapping between the assembly database names to be used in the analysis and a set of short names for use in files. There may be some constraints on these names so it is probably best to use six upper case letters to represent each assembly.

The `[SPECIES_SET]` section defines a name for the species set (in this case `HEMIPTERA` - currently only one species set is supported) and the assemblies that should be included in the set. The `TREE_FILE` needs to be the same file used by OrthoFinder. OrthoFinder supports a user specified tree, but currently the only supported option is to use the species tree inferred by OrthoFinder, which will be located at a path similar to the example. The `Tree_Label` should match one of the ranks in the NCBI taxonomy-based classification of the assemblies in your GenomeHub.

{% common %}
```
[TAXA]
        ACYPIS = acyrthosiphon_pisum_core_40_93_2
        BEMTAB = bemisia_tabaci_meam1v1x1_core_40_93_1
        MYZPER = myzus_persicae_cloneg006v2_core_40_93_1
        PLACIT = planococcus_citri_pcitriv1_core_40_93_1
        PLAFIC = planococcus_ficus_pficusv0_core_40_93_1
        PSELON = pseudococcus_longispinus_plongv1_core_40_93_1
        RHOPRO = rhodnius_prolixus_core_40_93_3
[SPECIES_SET]
        HEMIPTERA = [ ACYPIS BEMTAB MYZPER PLACIT PLAFIC PSELON RHOPRO ]
        TREE_FILE = /import/data/mealybug_compara_40_93/OrthoFinder/Results_v1/Species_Tree/SpeciesTree_rooted_node_labels.txt
        TREE_LABEL = Hemiptera

```

{% endmethod %}

{% method %}

The `[ORTHOGROUP]` section defines a set of file types and suffixes to use when preparing files for import in the `ORTHOGROUP_DIR`. Most of these should not need to be altered but the `PREFIX` should be changed to math your sit name. The example `PREFIX` is for MealyBug Gene Tree, version 01.

{% common %}
```
[ORTHOGROUP]
        PREFIX = MBGT01
        PROTEIN = .faa
        PROTEIN_ALIGN = [ .maaft.faa Mafft ]
        PROTEIN_TRIMMED = .maaft.trimmed.faa
        FNAFILE = .fna
        BOUNDEDFILE = .fba
        TREE = .raxml-ng.nhx
        HOMOLOG = .homologs.txt

```

{% endmethod %}

{% method %}

A number of fields need to be defined in the `[METHOD_LINK]` section. This probably doesn't belong here but it is needed to populate a table in the Compara database and should be copied and pasted directly into your configuration file.

{% common %}
```
[METHOD_LINK]
;       Names and classes of methods used with the main table in which results are stored
;       Method class must be one of DNA-DNA_ALIGNMENT, GENOMIC_SYNTENY, PROTEIN_HOMOLOGY, PROTEIN_FAMILY or PROTEIN-NCRNA_TREE
;       KEY = [ METHOD_CLASS DATABASE_TABLE.DATA_TYPE ]
        BLASTZ_NET = [ DNA-DNA_ALIGNMENT GenomicAlignBlock.pairwise_alignment ]
        TRANSLATED_BLAT = [ DNA-DNA_ALIGNMENT GenomicAlignBlock.pairwise_alignment ]
        TRANSLATED_BLAT_NET = [ DNA-DNA_ALIGNMENT GenomicAlignBlock.pairwise_alignment ]
        PECAN = [ DNA-DNA_ALIGNMENT GenomicAlignBlock.multiple_alignment ]
        ORTHEUS = [ DNA-DNA_ALIGNMENT GenomicAlignTree.tree_alignment ]
        LASTZ_NET = [ DNA-DNA_ALIGNMENT GenomicAlignBlock.pairwise_alignment ]
        ATAC = [ DNA-DNA_ALIGNMENT GenomicAlignBlock.pairwise_alignment ]
        SYNTENY = [ GENOMIC_SYNTENY SyntenyRegion.synteny ]
        ENSEMBL_ORTHOLOGUES = [ PROTEIN_HOMOLOGY Homology.homology ]
        ENSEMBL_PARALOGUES = [ PROTEIN_HOMOLOGY Homology.homology ]
        ENSEMBL_PROJECTIONS = [ PROTEIN_HOMOLOGY Homology.homology ]
        ENSEMBL_HOMOEOLOGUES = [ PROTEIN_HOMOLOGY Homology.homology ]
        FAMILY = [ PROTEIN_FAMILY Family.family ]
        PROTEIN_TREES = [ PROTEIN-NCRNA_TREE ProteinTree.protein_tree_node ]
        GERP_CONSTRAINED_ELEMENT = [ PROTEIN-NCRNA_TREE GenomicAlignBlock.constrained_element ]

```

{% endmethod %}

{% method %}

The remaining steps can all be run in a single step using the `genomehubs/compara` container, however it may be useful to run the individual steps separately to debug any problems with the configuration. The steps to run are controlled by the `FLAGS`:
- `-e` - Export sequence files from the core databases listed in the `[TAXA]` section. Three files are written for each assembly, representing a single, canonical transcript per gene in files of protein sequence, protein sequence showing exon boundaries and CDS sequence.
- `-o` - Run OrthoFinder. The command to OrthoFinder is of the form `orthofinder -f $FASTA_DIR -M msa -S diamond -A mafft_and_trim -T raxml-ng -o $ORTHOFINDER_DIR -n $VERSION -t $THREADS`. `$VERSION` is determined based on the version number at the end of the `ORTHOFINDER_DIR` parameter. The handler scripts are not yet sophisticated to allow OrthoFinder to be resumed so the analysis needs to be run in a single step.
- `-m` - Make orthogroup files. Processes the OrthoFinder output to generate a set of files per orthogroup fready for import into the Compara database.
- `-s` - Setup database. Creates a new/replaces and existing compara database and populates some tables in preparation fo importing the orthogroup files.
- `-i` - Import orthogroup files. Files are imported for each orthogroup in turn.

{% common %}
```
docker run --rm \
           -u $UID:$GROUPS \
           --name compara-import \
           --network genomehubs-network
           -v ~/genomehubs/v1/import/conf:/import/conf \
           -v ~/genomehubs/v1/import/data:/import/data \
           -e FLAGS="-e -o -m -s -i" \
           -e DATABASE=mealybug_compara_40_93 \
           -e THREADS=16 \
           genomehubs/compara:19.05
```

{% endmethod %}


{% method %}

Orthofinder can be configured further by setting environment variables to determine the similarity search (`SEARCH`), multiple sequence alignment (`ALIGN`) and tree reconstruction (`TREE`) options to use.

{% common %}
running with default settings is equivalent to specifying
```
  -e SEARCH=diamond
  -e ALIGN=mafft_and_trim
  -e TREE=fasttree
```

{% common %}
alternate options can be selected from the default `config.json` file:
```
{

    "muscle":{
      "program_type": "msa",
      "cmd_line": "muscle -in INPUT -out OUTPUT"
    },

    "raxml":{
      "program_type": "tree",
      "cmd_line": "raxmlHPC-AVX -m PROTGAMMALG -p 12345 -s INPUT -n IDENTIFIER -w PATH > /dev/null",
      "ouput_filename": "PATH/RAxML_bestTree.IDENTIFIER"
    },

    "raxml-ng":{
      "program_type": "tree",
      "cmd_line": "raxml-ng --msa INPUT --model LG+G4 --seed 12345 --threads 1 --blopt nr_safe",
      "ouput_filename": "INPUT.raxml.bestTree"
    },

    "iqtree":{
      "program_type": "tree",
      "cmd_line": "iqtree -s INPUT -pre PATH/IDENTIFIER > /dev/null",
      "ouput_filename": "PATH/IDENTIFIER.treefile"
    },

    "fasttree_lg_gamma":{
      "program_type": "tree",
      "cmd_line": "fasttree -lg -gamma < INPUT > OUTPUT"
    },

    "diamond":{
      "program_type": "search",
      "db_cmd": "diamond makedb --in INPUT -d OUTPUT",
      "search_cmd": "diamond blastp -d DATABASE -q INPUT -o OUTPUT --more-sensitive -p 1 --quiet -e 0.001 --compress 1"
    },

    "blast_gz":{
      "program_type": "search",
      "db_cmd": "makeblastdb -dbtype prot -in INPUT -out OUTPUT",
      "search_cmd": "blastp -outfmt 6 -evalue 0.001 -query INPUT -db DATABASE | gzip > OUTPUT.gz"
    },

    "mmseqs":{
      "program_type": "search",
      "db_cmd": "mmseqs createdb INPUT OUTPUT.fa ; mmseqs createindex OUTPUT.fa /tmp",
      "search_cmd": "mmseqs search PATH/mmseqsDBBASENAME DATABASE.fa OUTPUT.db /tmp/tmpBASEOUTNAME  --threads 1 ; mmseqs convertalis PATH/mmseqsDBBASENAME DATABASE.fa OUTPUT.db OUTPUT"
    },

    "mafft_and_trim":{
       "program_type": "msa",
       "cmd_line": "mafft --auto --anysymbol INPUT > /import/data/tmp/BASENAME_pre_trim 2> /dev/null; trimal -in /import/data/tmp/BASENAME_pre_trim -out OUTPUT -gappyout "
    }

}
```


{% endmethod %}


{% method %}

To load the Compara analyses into your Ensembl site, add your database name to the Ensembl `setup.ini` file then remove and restart your Ensembl container.

{% common %}
```
nano ~/genomehubs/v1/ensembl/conf/setup.ini

...
COMPARA_DBS = [ mealybug_compara_40_93 ensembl_compara_metazoa_40_93 ]

docker rm -f genomehubs-ensembl

docker run -d \
             --name genomehubs-ensembl \
             -v ~/genomehubs/v1/ensembl/conf:/conf:ro \
             --network genomehubs-network \
             -p 8881:8080 \
             genomehubs/easy-mirror:19.05

```

{% endmethod %}
