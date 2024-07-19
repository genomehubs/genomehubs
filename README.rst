==========
GenomeHubs
==========

.. start-badges

|version| |commits-since|
|license|


.. |version| image:: https://img.shields.io/pypi/v/genomehubs.svg?style=flat-square
    :alt: PyPI Package latest release
    :target: https://pypi.org/project/genomehubs

.. |supported-versions| image:: https://img.shields.io/pypi/pyversions/genomehubs.svg
    :alt: Supported versions
    :target: https://pypi.org/project/genomehubs

.. |conda| image:: https://anaconda.org/tolkit/genomehubs/badges/installer/conda.svg
    :alt: Install with Conda
    :target: https://anaconda.org/tolkit/genomehubs

.. |platforms| image:: https://anaconda.org/tolkit/genomehubs/badges/platforms.svg
    :alt: Conda platforms
    :target: https://anaconda.org/tolkit/genomehubs

.. |commits-since| image:: https://img.shields.io/github/commits-since/genomehubs/genomehubs/2.8.20.svg
    :alt: Commits since latest release
    :target: https://github.com/genomehubs/genomehubs/compare/2.8.20...main

.. |license| image:: https://anaconda.org/tolkit/genomehubs/badges/license.svg
    :alt: MIT License
    :target: https://anaconda.org/tolkit/genomehubs

.. end-badges


About
=====

GenomeHubs comprises a set of tools to parse index and search and display genomic metadata, assembly features and sequencing status for projects under the `Earth BioGenome Project <https://www.earthbiogenome.org>`_ umbrella that aim to sequence all described eukaryotic species over a period of 10 years.

Genomehubs builds on legacy code that supported taxon-oriented databases of butterflies & moths (`lepbase.org <https://lepbase.org>`_), molluscs (`molluscdb.org <https://molluscdb.org>`_), mealybugs (`mealybug.org <https://mealybug.org>`_) and more. Genomehubs is now search-oriented and positioned to scale to the challenges of mining data across almost 2 million species.

The first output from the new search-oriented GenomeHubs is Genomes on a Tree (GoaT, `goat.genomehubs.org <https://goat.genomehubs.org>`_), which has been opublised in: Challis *et al*. 2023, **Genomes on a Tree (GoaT): A versatile, scalable search engine for genomic and sequencing project metadata across the eukaryotic tree of life**. Wellcome Open Research, **8**:24 doi:`10.12688/wellcomeopenres.18658.1 <https://doi.org/10.12688/wellcomeopenres.18658.1>`_

The goat.genomehubs.org website is freely available with no logins or restrictions, and is being widely used by the academic community and especially by the Earth BioGenome Project to plan and coordinate efforts to sequence all described eukaryotic species.

The core GoaT/Genomehubs components are available as a set of Docker containers:

GoaT UI |goat-docker|
---------------------

A bundled web server to run a GoaT-specific instance of the GenomeHubs UI, as used at `goat.genomehubs.org <https://goat.genomehubs.org>`_.

Usage
^^^^^
.. code-block:: bash

    docker pull genomehubs/goat:latest
    
    docker run -d --restart always \
        --net net-es -p 8880:8880 \
        --user $UID:$GROUPS \
        -e GH_CLIENT_PORT=8880 \
        -e GH_API_URL=https://goat.genomehubs.org/api/v2 \
        -e GH_SUGGESTED_TERM=Canidae \
        --name goat-ui \
        genomehubs/goat:latest

.. |goat-docker| image:: https://img.shields.io/docker/v/genomehubs/goat/latest?label=docker%20hub&style=flat-square
    :alt: Docker image
    :target: https://hub.docker.com/r/genomehubs/goat


Genomehubs UI |ui-docker|
-------------------------

A bundled web server to run an instance of the GenomeHubs UI, such as `goat.genomehubs.org <https://goat.genomehubs.org>`_.

Usage
^^^^^
.. code-block:: bash

    docker pull genomehubs/genomehubs-ui:latest
    
    docker run -d --restart always \
        --net net-es -p 8880:8880 \
        --user $UID:$GROUPS \
        -e GH_CLIENT_PORT=8880 \
        -e GH_API_URL=https://goat.genomehubs.org/api/v2 \
        -e GH_SUGGESTED_TERM=Canidae \
        --name gh-ui \
        genomehubs/genomehubs-ui:latest


.. |ui-docker| image:: https://img.shields.io/docker/v/genomehubs/genomehubs-ui/latest?label=docker%20hub&style=flat-square
    :alt: Docker image
    :target: https://hub.docker.com/r/genomehubs/genomehubs-ui


Genomehubs API |api-docker|
---------------------------

A bundled web server to run an instance of the GenomeHubs API. The GenomeHubs API underpins all search functionality for Genomes on a Tree (GoaT) `goat.genomehubs.org <https://goat.genomehubs.org>`_. OpenAPI documentation for the GenomeHubs API instance used by GoaT is available at `goat.genomehubs.org/api-docs <https://goat.genomehubs.org/api-docs>`_.


Usage
^^^^^
.. code-block:: bash

    docker pull genomehubs/genomehubs-api:latest
    
    docker run -d \
        --restart always \
        --net net-es -p 3000:3000 \
        --user $UID:$GROUPS \
        -e GH_ORIGINS="https://goat.genomehubs.org null" \
        -e GH_HUBNAME=goat \
        -e GH_HUBPATH="/genomehubs/resources/" \
        -e GH_NODE="http://es1:9200" \
        -e GH_API_URL=https://goat.genomehubs.org/api/v2 \
        -e GH_RELEASE=$RELEASE \
        -e GH_SOURCE=https://github.com/genomehubs/goat-data \
        -e GH_ACCESS_LOG=/genomehubs/logs/access.log \
        -e GH_ERROR_LOG=/genomehubs/logs/error.log \
        -v /volumes/docker/logs/$RELEASE:/genomehubs/logs \
        -v /volumes/docker/resources:/genomehubs/resources \
        --name goat-api \
    genomehubs/genomehubs-api:latest;

.. |api-docker| image:: https://img.shields.io/docker/v/genomehubs/genomehubs-api/latest?label=docker%20hub&style=flat-square
    :alt: Docker image
    :target: https://hub.docker.com/r/genomehubs/genomehubs-api


Genomehubs CLI |genomehubs-docker|
----------------------------------

command line tool to process and index genomic metadata for GenomeHubs. Used to build and update GenomeHubs instances such as Genomes on a Tree `goat.genomehubs.org <https://goat.genomehubs.org>`_.

Usage
^^^^^
.. code-block:: bash

    docker pull genomehubs/genomehubs:latest

Parse [NCBI datasets](https://www.ncbi.nlm.nih.gov/datasets/) genome assembly metadata:

.. code-block:: bash

    docker run --rm --network=host \
        -v `pwd`/sources:/genomehubs/sources \
         genomehubs/genomehubs:latest bash -c \
            "genomehubs parse \
                --ncbi-datasets-genome sources/assembly-data \
                --outfile sources/assembly-data/ncbi_datasets_eukaryota.tsv.gz"


Initialise a set of ElasticSearch indexes with [NCBI taxonomy](https://www.ncbi.nlm.nih.gov/taxonomy/) data for all eukaryotes:

.. code-block:: bash

    docker run --rm --network=host \
        -v `pwd`/sources:/genomehubs/sources \
         genomehubs/genomehubs:latest bash -c \
            "genomehubs init \
                --es-host http://es1:9200 \
                --taxonomy-source ncbi \
                --config-file sources/goat.yaml \
                --taxonomy-jsonl sources/ena-taxonomy/ena-taxonomy.extra.jsonl.gz \
                --taxonomy-ncbi-root 2759 \
                --taxon-preload"

Index assembly metadata:

.. code-block:: bash

    docker run --rm --network=host \
        -v `pwd`/sources:/genomehubs/sources \
         genomehubs/genomehubs:latest bash -c \
            "genomehubs index \
                --es-host http://es1:9200 \
                --taxonomy-source ncbi \
                --config-file sources/goat.yaml \
                --assembly-dir sources/assembly-data"

Fill taxon attribute values across the tree of life:

.. code-block:: bash

    docker run --rm --network=host \
        -v `pwd`/sources:/genomehubs/sources \
         genomehubs/genomehubs:latest bash -c \
            "genomehubs fill \
                --es-host http://es1:9200 \
                --taxonomy-source ncbi \
                --config-file sources/goat.yaml \
                --traverse-root 2759 \
                --traverse-infer-both"


.. |genomehubs-docker| image:: https://img.shields.io/docker/v/genomehubs/genomehubs/latest?label=docker%20hub&style=flat-square
    :alt: Docker image
    :target: https://hub.docker.com/r/genomehubs/genomehubs


Related projects
================

Some GenomeHubs components are hosted in separate open source repositories (all under MIT licenses), including:

BlobToolKit |blobtoolkit-release|
---------------------------------

Interactive quality assessment of genome assemblies.

Explore analysed public assemblies at `blobtoolkit.genomehubs.org/view <https://blobtoolkit.genomehubs.org/view>`_

.. |blobtoolkit-release| image:: https://img.shields.io/github/v/tag/blobtoolkit/blobtoolkit?label=release&sort=semver&style=flat-square
    :alt: GitHub release
    :target: https://github.com/blobtoolkit/blobtoolkit

GoaT CLI  |goat-cli-release|
----------------------------

A command line interface for GoaT.

The GoaT CLI builds URLs to query the Goat API, removing some of the complexity of the `GoaT API <https://goat.genomehubs.org/api-docs>`_. for the end user.

.. |goat-cli-release| image:: https://img.shields.io/github/v/tag/genomehubs/goat-cli?label=release&sort=semver&style=flat-square
    :alt: GitHub release
    :target: https://github.com/genomehubs/goat-cli
