#Files and containers

GenomeHubs tools and services are designed to run in separate containers. While the overall system can be described in terms of the links between containers through shared files and the Ensembl databases, it is important to understand the interaction between the containers and the underlying filesystem.

The Docker containers used by GenomeHubs are ephemeral - if any container is stopped or removed, it can be replaced by another container of the same type without loss of data. The actual data are stored in directories on the host machine that mounted onto the containers while they are running. This approach means that GenomeHubs data files can always be accessed directly for further analyses or hosting in an alternative tool, and greatly simplifies versioning and backup.

{% method %}
The standard pattern is for each container to mount two directories, one containing configuration files that are specific to the software inside the container and one containing data to be imported/analysed/hosted:

{% common %}
```
container
├── conf
└── data
```

{% endmethod %}


{% method %}
The folders for each container can be nested inside a directory for the version that they relate to:
- the MySQL data folder can be kept outside of the versioned directory to allow databases to be shared between versions
- analysis containers are wrappers around specific bioinformatics software so they typically mount `download/data` subdirectories (see [Run Analyses](//quick-start/run-analyses.md) for details) to simplify the process of hosting the input and output files for bulk downloads

{% common %}
```
genomehubs
├── v1
│   ├── blast      # SequenceServer container
│   │   ├── conf
│   │   └── data
│   ├── download   # h5ai container
│   │   ├── conf
│   │   └── data
│   ├── ensembl    # EasyMirror container
│   │   ├── conf
│   │   └── data
│   ├── import     # EasyImport container
│   │   ├── conf
│   │   └── data
└── mysql          # MySQL container
    └── data

```

{% endmethod %}


{% method %}
An example of this directory structure with default configuration files is avalaible in the [genomehubs/template](https:github.com/genomehubs/template) github repository:
- this template is used in the Quick Start guide, which contains more details of the roles of the individual configuration files


{% common %}
```
template
├── blast
│   ├── conf
│   │   ├── custom.css
│   │   ├── links.rb
│   │   ├── Masthead.html
│   │   └── img
│   │       ├── download-icon.png
│   │       ├── genomehubs-icon.png
│   │       ├── help-icon.png
│   │       └── tools-icon.png
│   └── data
├── download
│   ├── conf
│   │   ├── _h5ai.headers.html
│   │   ├── custom.css
│   │   ├── Masthead.html
│   │   └── img
│   │       ├── genomehubs-icon.png
│   │       ├── help-icon.png
│   │       └── tools-icon.png
│   └── data
├── ensembl
│   ├── conf
│   │   ├── database.ini
│   │   └── setup.ini
│   └── data
└── import
    ├── conf
    │   ├── default.ini
    │   ├── genus_species_asm_core_32_85_1.ini
    │   └── setup.ini
    └── data
```

{% endmethod %}





 

