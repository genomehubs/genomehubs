#Files and containers

GenomeHubs tools and services are designed to run in separate containers. While the overall system can be described in terms of the links between containers through shared files and the Ensembl databases, it is important to understand the interaction between the containers and the underlying filesystem.

The Docker containers used by GenomeHubs are ephemeral - if any container is stopped or removed, it can be replaced by another container of the same type without loss of data. The actual data are stored in directories on the host machine that mounted onto the containers while they are running. This approach means that a GenomeHub's data files can always be accessed directly for further analyses or hosting in an alternative tool, and greatly simplifies versioning and backup.

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
- The MySQL data folder can be kept outside of the versioned directory to allow databases to be shared between versions

{% common %}
```
genomehubs
├── v1
│   ├── blast
│   │   ├── conf
│   │   └── data
│   ├── download
│   │   ├── conf
│   │   └── data
│   ├── ensembl
│   │   ├── conf
│   │   └── data
│   ├── import
│   │   ├── conf
│   │   └── data
└── mysql
    └── data

```

{% endmethod %}


 

Analysis containers are wrappers around specific bioinformatics software so they mount  

