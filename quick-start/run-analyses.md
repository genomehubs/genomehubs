# Run analyses

{% method %}
GenomeHubs supports importing the results of analyses such as InterProScan into Ensembl databases to add functional annotations to imported assemblies. Docker container images are provided to allow these analyses to be run with the correct settings, but the analyses can also be run in whichever way is best suited to your compute infrastructure, provided the output files have the required format.

{% common %}
![](/assets/GenomeHubs analysis.png)
{% endmethod %}


## Blastp against SwissProt

{% method %}
Download and unzip the latest SwissProt database:

{% common %}
```
$ mkdir -p ~/genomehubs/external_files && cd ~/genomehubs/external_files
$ wget ftp://ftp.uniprot.org/pub/databases/uniprot/current_release/knowledgebase/complete/uniprot_sprot.fasta.gz
$ gunzip uniprot_sprot.fasta.gz
```
{% endmethod %}


{% method %}
Format the SwissProt BLAST database:

{% common %}
```
$ docker run --rm \
             -u $UID:$GROUPS \
             --name uniprot_sprot-makeblastdb \
             -v ~/genomehubs/external_files:/in \
             -v ~/genomehubs/external_files:/out \
             genomehubs/ncbi-blast:19.05 \
             makeblastdb -dbtype prot -in /in/uniprot_sprot.fasta -out /out/uniprot_sprot.fasta -parse_seqids -hash_index
```
{% endmethod %}

{% method %}
Run blastp:

{% common %}
```
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
{% endmethod %}


## Run InterProScan

{% method %}
Modify InterProScan configuration to suit your system:

* Edit interproscan.properties and change the `maxnumber.of.embedded.workers` values to match your number of threads (eg: 16)

{% common %}
```
$ mkdir -p ~/genomehubs/external_files && cd ~/genomehubs/external_files
$ wget https://raw.githubusercontent.com/blaxterlab/interproscan-docker/master/interproscan.properties
$ nano interproscan.properties
number.of.embedded.workers=1
maxnumber.of.embedded.workers=16
```
{% endmethod %}


{% method %}
Run InterProScan:

{% common %}
```
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
{% endmethod %}


## Run RepeatMasker


{% method %}
Clone the GenomeHubs RepeatMasker Docker repository:

{% common %}
```
$ mkdir -p ~/genomehubs/external_files && cd ~/genomehubs/external_files
git clone https://github.com/genomehubs/repeatmasker-docker.git
cd repeatmasker-docker
```
{% endmethod %}


{% method %}
Download a copy of the latest RepeatMasker libraries from RepBase:

{% common %}
```
$ wget --user your_username \
       --password 12345 \
       -O repeatmaskerlibraries.tar.gz \
       http://www.girinst.org/server/RepBase/protected/repeatmaskerlibraries/RepBaseRepeatMaskerEdition-20170127.tar.gz
```
{% endmethod %}

{% method %}
Build the Docker image:

{% common %}
```
$ docker build -t repeatmasker .
```
{% endmethod %}


{% method %}
Run RepeatMasker:

{% common %}
```
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
{% endmethod %}


# Run RepeatMasker with DFAM libraries

{% method %}
Run RepeatMasker:

{% common %}
```
$ mkdir -p ~/genomehubs/v1/download/data/Operophtera_brumata_Obru1/repeatmasker
$ docker run --rm \
           -u $UID:$GROUPS \
           --name Operophtera_brumata_Obru1-repeatmasker \
           -v ~/genomehubs/v1/download/data/Operophtera_brumata_Obru1/fasta/dna:/in \
           -v ~/genomehubs/v1/download/data/Operophtera_brumata_Obru1/repeatmasker:/out \
           -e ASSEMBLY=Operophtera_brumata_Obru1.scaffolds.fa.gz \
           -e NSLOTS=16 \
           -e SPECIES=fly \
           genomehubs/repeatmasker-dfam:19.05
```
{% endmethod %}





# Run CEGMA

{% method %}
Run CEGMA:

{% common %}
```
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
{% endmethod %}

# Run BUSCO

{% method %}
Clone the GenomeHubs BUSCO Docker repository:

{% common %}
```
$ mkdir -p ~/genomehubs/external_files && cd ~/genomehubs/external_files
$ git clone https://github.com/genomehubs/busco-docker.git
$ cd busco-docker
```
{% endmethod %}


{% method %}
Fetch BUSCO lineages:

{% common %}
```
$ wget http://busco.ezlab.org/v2/datasets/eukaryota_odb9.tar.gz
```
{% endmethod %}


{% method %}
Build the Docker image:

{% common %}
```
$ docker build -t busco .
```
{% endmethod %}


{% method %}
Run BUSCO:

{% common %}
```
$ mkdir -p ~/genomehubs/v1/download/data/Operophtera_brumata_Obru1/busco
$ docker run --rm \
           -u $UID:$GROUPS \
           --name Operophtera_brumata_Obru1-busco \
           -v ~/genomehubs/v1/download/data/Operophtera_brumata_Obru1/fasta/dna:/in \
           -v ~/genomehubs/v1/download/data/Operophtera_brumata_Obru1/busco:/out \
           -e ASSEMBLY=Operophtera_brumata_Obru1.scaffolds.fa.gz \
           busco -l eukaryota_odb9 -m genome -c 16 -sp fly
```
{% endmethod %}



