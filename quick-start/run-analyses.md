# 5. Run analyses

GenomeHubs supports importing the results of analyses such as InterProScan into Ensembl databases to add functional annotations to imported assemblies. Docker container images are provided to allow these analyses to be run with the correct settings, but the analyses can also be run in whichever way is best suited to your compute infrastructure, provided the output files have the required format.

![](../.gitbook/assets/GenomeHubs%20analysis.png)

## Blastp against SwissProt

_**Hits to sequences in the SwissProt database can be imported into a GenomeHubs Ensembl database to provide functional annotation.**_

Download and unzip the latest SwissProt database:

```text
$ mkdir -p ~/genomehubs/external_files && cd ~/genomehubs/external_files
$ wget ftp://ftp.uniprot.org/pub/databases/uniprot/current_release/knowledgebase/complete/uniprot_sprot.fasta.gz
$ gunzip uniprot_sprot.fasta.gz
```

Format the SwissProt BLAST database:

```text
$ docker run --rm \
             -u $UID:$GROUPS \
             --name uniprot_sprot-makeblastdb \
             -v ~/genomehubs/external_files:/in \
             -v ~/genomehubs/external_files:/out \
             genomehubs/ncbi-blast:19.05 \
             makeblastdb -dbtype prot -in /in/uniprot_sprot.fasta -out /out/uniprot_sprot.fasta -parse_seqids -hash_index
```

Run blastp:

```text
$ mkdir -p ~/genomehubs/v1/download/data/Operophtera_brumata_Obru1/blastp
$ docker run --rm \
             -u $UID:$GROUPS \
             --name Operophtera_brumata_Obru1-blastp \
             -v ~/genomehubs/v1/download/data/Operophtera_brumata_Obru1/fasta/pep:/query \
             -v ~/genomehubs/v1/download/data/Operophtera_brumata_Obru1/blastp:/out \
             -v ~/genomehubs/external_files:/db \
             genomehubs/ncbi-blast:19.05 \
             blastp -query /query/Operophtera_brumata_Obru1.proteins.fa.gz \
                    -db /db/uniprot_sprot.fasta \
                    -evalue 1e-10 \
                    -num_threads 16 \
                    -outfmt '6 std qlen slen stitle btop' \
                    -out /out/Operophtera_brumata_Obru1.proteins.fa.blastp.uniprot_sprot.1e-10.tsv
```

## Run InterProScan

_**InterProScan provides functional domain annotations that can be displayed in a GenomeHubs Ensembl browser.**_

_**N.B. The InterProScan container has not been updated to the latest version, however result files should be compatible with all versions of GenomeHubs.**_

Modify InterProScan configuration to suit your system:

* Edit interproscan.properties and change the `maxnumber.of.embedded.workers` values to match your number of threads \(eg: 16\)

```text
$ mkdir -p ~/genomehubs/external_files && cd ~/genomehubs/external_files
$ wget https://raw.githubusercontent.com/blaxterlab/interproscan-docker/master/interproscan.properties
$ nano interproscan.properties
number.of.embedded.workers=1
maxnumber.of.embedded.workers=16
```

Run InterProScan:

```text
$ mkdir -p ~/genomehubs/v1/download/data/Operophtera_brumata_Obru1/interproscan
$ docker run --rm \
           -u $UID:$GROUPS \
           --name Operophtera_brumata_Obru1-interproscan \
           -v ~/genomehubs/v1/download/data/Operophtera_brumata_Obru1/interproscan:/dir \
           -v ~/genomehubs/v1/download/data/Operophtera_brumata_Obru1/fasta/pep:/in \
           -v ~/genomehubs/external_files/interproscan.properties:/interproscan-5.22-61.0/interproscan.properties \
           genomehubs/interproscan:18.10 \
           interproscan.sh -i /in/Operophtera_brumata_Obru1.proteins.fa.gz \
                           -d /dir \
                           -appl PFAM,SignalP_EUK \
                           -goterms \
                           -dp \
                           -pa \
                           -f TSV
```

## Run RepeatMasker

_**N.B. Running RepeatMasker with RepBase Libraries Requires a RepBase subscription. See below for an alternative repeat masking approach using Repeat Detector and redmask.**_

_**The latest version of RepeatMasker are compatible with the open source DFAM libraries, but DFAM currently has limited taxonomic scope and we are yet to get this version running reliably in a docker container. Results from the version described below should be compatible with all versions of GenomeHubs.**_

Clone the GenomeHubs RepeatMasker Docker repository:

```text
$ mkdir -p ~/genomehubs/external_files && cd ~/genomehubs/external_files
git clone https://github.com/genomehubs/repeatmasker-docker.git
cd repeatmasker-docker
```

Download a copy of the latest RepeatMasker libraries from RepBase:

```text
$ wget --user your_username \
       --password 12345 \
       -O repeatmaskerlibraries.tar.gz \
       http://www.girinst.org/server/RepBase/protected/repeatmaskerlibraries/RepBaseRepeatMaskerEdition-20170127.tar.gz
```

Build the Docker image:

```text
$ docker build -t repeatmasker .
```

Run RepeatMasker:

```text
$ mkdir -p ~/genomehubs/v1/download/data/Operophtera_brumata_Obru1/repeatmasker
$ docker run --rm \
           -u $UID:$GROUPS \
           --name Operophtera_brumata_Obru1-repeatmasker \
           -v ~/genomehubs/v1/download/data/Operophtera_brumata_Obru1/fasta/dna:/in \
           -v ~/genomehubs/v1/download/data/Operophtera_brumata_Obru1/repeatmasker:/out \
           -e ASSEMBLY=Operophtera_brumata_Obru1.scaffolds.fa.gz \
           -e NSLOTS=16 \
           -e SPECIES=arthropoda \
           repeatmasker
```

## Run Repeat Detector using redmask

_**This is provided as an alternative to RepeatMasker to generate a soft masked genome, but lacks repeat classification.**_

Run redmask:

```text
$ mkdir -p ~/genomehubs/v1/download/data/Operophtera_brumata_Obru1/redmask
$ docker run --rm \
             -u $UID:$GROUPS \
             --name Operophtera_brumata_Obru1-redmask \
             -v ~/genomehubs/v1/download/data/Operophtera_brumata_Obru1/fasta/dna:/in \
             -v ~/genomehubs/v1/download/data/Operophtera_brumata_Obru1/redmask:/out \
             -e ASSEMBLY=Operophtera_brumata_Obru1.scaffolds.fa.gz \
             genomehubs/redmask:19.05
```

## Run CEGMA

_**CEGMA is no longer supported and it's author suggests using BUSCO \(see below\) instead. But the tool still works and it provides an assessment of genome completeness against core eukaryotic genes that can be imported into a GenomeHubs Ensembl database.**_

Run CEGMA:

```text
$ mkdir -p ~/genomehubs/v1/download/data/Operophtera_brumata_Obru1/cegma
$ docker run --rm \
           -u $UID:$GROUPS \
           --name Operophtera_brumata_Obru1-cegma \
           -v ~/genomehubs/v1/download/data/Operophtera_brumata_Obru1/fasta/dna:/in \
           -v ~/genomehubs/v1/download/data/Operophtera_brumata_Obru1/cegma:/out \
           -e ASSEMBLY=Operophtera_brumata_Obru1.scaffolds.fa.gz \
           -e THREADS=16 \
           genomehubs/cegma:19.05
```

## Run BUSCO

_**BUSCO is an actively maintained alternative to CEGMA using sets of single copy orthologues for various taxonomic groups identified in OrthoDB.**_

Clone the GenomeHubs BUSCO Docker repository:

```text
$ mkdir -p ~/genomehubs/external_files && cd ~/genomehubs/external_files
$ git clone https://github.com/genomehubs/busco-docker.git
$ cd busco-docker
```

Fetch BUSCO lineages - choose the lineage\(s\) most appropriate for the taxon you wish to analyse:

```text
$ wget http://busco.ezlab.org/v2/datasets/eukaryota_odb9.tar.gz
```

Build the Docker image:

```text
$ docker build -t busco .
```

Run BUSCO:

```text
$ mkdir -p ~/genomehubs/v1/download/data/Operophtera_brumata_Obru1/busco
$ docker run --rm \
           -u $UID:$GROUPS \
           --name Operophtera_brumata_Obru1-busco \
           -v ~/genomehubs/v1/download/data/Operophtera_brumata_Obru1/fasta/dna:/in \
           -v ~/genomehubs/v1/download/data/Operophtera_brumata_Obru1/busco:/out \
           -e ASSEMBLY=Operophtera_brumata_Obru1.scaffolds.fa.gz \
           busco -l eukaryota_odb9 -m genome -c 16 -sp fly
```

