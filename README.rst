==========
GenomeHubs
==========

.. start-badges

|version| |commits-since|
|license|


.. |version| image:: https://img.shields.io/pypi/v/genomehubs.svg
    :alt: PyPI Package latest release
    :target: https://pypi.org/project/genomehubs

.. |supported-versions| image:: https://img.shields.io/pypi/pyversions/genomehubs.svg
    :alt: Supported versions
    :target: https://pypi.org/project/genomehubs

.. |platforms| image:: https://anaconda.org/tolkit/genomehubs/badges/platforms.svg
    :alt: Conda platforms
    :target: https://anaconda.org/tolkit/genomehubs

.. |commits-since| image:: https://img.shields.io/github/commits-since/genomehubs/genomehubs/2.6.8.svg
    :alt: Commits since latest release
    :target: https://github.com/genomehubs/genomehubs/compare/2.6.8...main

.. |license| image:: https://anaconda.org/tolkit/genomehubs/badges/license.svg
    :alt: MIT License
    :target: https://anaconda.org/tolkit/genomehubs

.. end-badges


About
=====

GenomeHubs comprises a set of tools to parse index and search and display genomic metadata, assembly features and sequencing status for projects under the [Earth BioGenome Project](https://www.earthbiogenome.org) umbrella that aim to sequence all described eukaryotic species over a period of 10 years.

Genomehubs builds on legacy code that supported taxon-oriented databases of butterflies & moths ([lepbase.org](https://lepbase.org)), molluscs ([molluscdb.org](https://molluscdb.org)), mealybugs ([mealybug.org](https://mealybug.org)) and more. Genomehubs is now search-oriented and positioned to scale to the challenges of mining data across almost 2 million species.

The first output from the new search-oriented GenomeHubs is Genomes on a Tree (GoaT, [goat.genomehubs.org](https://goat.genomehubs.org)), which has been opublised in: Challis *et al*. 2023, **Genomes on a Tree (GoaT): A versatile, scalable search engine for genomic and sequencing project metadata across the eukaryotic tree of life**. Wellcome Open Research, **8**:24 doi:[10.12688/wellcomeopenres.18658.1](https://doi.org/10.12688/wellcomeopenres.18658.1)

The goat.genomehubs.org website is freely available with no logins or restrictions, and is being widely used by the academic community and especially by the Earth BioGenome Project to plan and coordinate efforts to sequence all described eukaryotic species.

The core GoaT/Genomehubs components are available as a set of Docker containers:

- [GoaT UI](https://hub.docker.com/repository/docker/genomehubs/goat) 
- [Genomehubs API](https://hub.docker.com/repository/docker/genomehubs/genomehubs-api) 
- [Genomehubs CLI](https://hub.docker.com/repository/docker/genomehubs/genomehubs) 
