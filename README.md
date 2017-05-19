# GenomeHubs

[GenomeHubs](http://genomehubs.org)[1] provide a straightforward way to create a collection of web services to make annotated genome assemblies accessible to a wide community of users. GenomeHubs use [Docker](https://www.docker.com/) containers to package each of the component tools and their dependencies, simplifying the process of setting up and importing data from FASTA and GFF files into:

* a custom [Ensembl](http://ensembl.org) genome browser

* a [SequenceServer](http://sequenceserver.com) BLAST server

* an [h5ai](https://larsjung.de/h5ai/) powered downloads server

[1] Challis RJ, Kumar S, Stevens L & Blaxter M (2017) GenomeHubs: simple containerized setup of a custom Ensembl database and web server for any species. Database, 2017, bax039 for a full description [doi:10.1093/database/bax039](https://doi.org/10.1093/database/bax039).

![](/assets/GenomeHubs schematic overview.png)

GenomeHubs Docker containers are shown in rounded boxes with a double outline and the hosted sites are shown in plain boxes. 

GenomeHubs containers are linked by use of common file formats or through a MySQL container via the Ensembl API (arrows show the flow of information) so it is relatively straightforward to expand the feature set by creating new containers to host additional services.

The full set of GenomeHubs Docker containers also includes tools to export data from Ensembl databases into standard file formats, and containers to run analyses on these files that can be imported back into Ensembl database format for display alongside the sequences and gene model data:

* Blastp against Swissprot to add functional annotations

* InterProScan to annotate protein domains

* RepeatMasker to identify repetitive elements

* Cegma and Busco genome completeness assessments



