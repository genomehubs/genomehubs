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
$ mkdir -p ~/genomehubs/blastdbs && cd ~/genomehubs/blastdbs
$ wget ftp://ftp.uniprot.org/pub/databases/uniprot/current_release/knowledgebase/complete/uniprot_sprot.fasta.gz
$ gunzip uniprot_sprot.fasta.gz
```
{% endmethod %}


{% method %}
Format the SwissProt BLAST database:

{% common %}
```
docker run --rm \
           -u $UID:$GROUPS \
           --name uniprot_sprot-makeblastdb \
           -v ~/genomehubs/blastdbs:/in \
           -v ~/genomehubs/blastdbs:/out \
           blaxterlab/ncbi-blast:latest \
           makeblastdb -dbtype prot -in /in/uniprot_sprot.fasta -out /out/uniprot_sprot.fasta -parse_seqids -hash_index
```

{% endmethod %}

{% method %}
Run blastp:

{% common %}
```
mkdir -p ~/genomehubs/v1/download/data/blastp
docker run --rm \
           -u $UID:$GROUPS \
           --name $USER-$PROTEINS-blastp \
           -v ~/genomehubs/v1/download/data/sequence:/query \
           -v ~/genomehubs/v1/download/data/blastp:/out \
           -v ~/genomehubs/blastdbs:/db \
           blaxterlab/ncbi-blast:latest \
           blastp -query /query/Operophtera_brumata_Obru1.proteins.fa.gz \
                  -db /db/uniprot_sprot.fasta \
                  -evalue 1e-10 \
                  -num_threads 16 \
                  -outfmt '6 std qlen slen stitle btop' \
                  -out /out/Operophtera_brumata_Obru1.proteins.fa.blastp.uniprot_sprot.1e-10.tsv
```

{% endmethod %}


