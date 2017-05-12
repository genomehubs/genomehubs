# GenomeHubs

[GenomeHubs](http://genomehubs.org) provide a straightforward way to create a collection of web services to make annotated genome assemblies accessible to a wide community of users. GenomeHubs use [Docker](https://www.docker.com/) containers to package each of the component tools and their dependencies to simplify the process of setting up and importing data from FASTA and GFF files into:

* a custom [Ensembl](http://ensembl.org) genome browser

* a [SequenceServer](http://sequenceserver.com) BLAST server

* an [h5ai](https://larsjung.de/h5ai/) powered downloads server

The full set of GenomeHubs Docker containers also includes tools to export data from Ensembl databases into standard file formats, and containers to run analyses on these files that can be imported back into Ensembl database format for display alongside the sequences and gene model data:

* Blastp against Swissprot to add functional annotations

* InterProScan to annotate protein domains

* RepeatMasker to identify repetitive elements

* Cegma and Busco genome completeness assessment

GenomeHubs containers are linked by use of common file formats or through the Ensembl API so it is relatively straightforward to expand the feature set by creating new containers to host additional services.

![](/assets/GenomeHubs schematic overview.png)