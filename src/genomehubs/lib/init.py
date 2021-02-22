#!/usr/bin/env python3

"""
Initialise a GenomeHubs instance.

Usage:
    genomehubs init [--hub-name STRING] [--hub-path PATH] [--hub-version PATH]
                    [--config-file PATH...] [--config-save PATH]
                    [--es-host URL...] [--es-url URL]
                    [--insdc-metadata] [--insdc-root INT...] [--restore-indices]
                    [--taxonomy-path PATH] [--taxonomy-ncbi-root INT]
                    [--taxonomy-ncbi-url URL] [--taxon-preload]
                    [--docker-contain STRING...] [--docker-network STRING]
                    [--docker-timeout INT] [--docker-es-container STRING]
                    [--docker-es-image URL]
                    [--reset] [--force-reset]
                    [-h|--help] [-v|--version]

Options:
    --hub-name STRING             GenomeHubs instance name.
    --hub-path PATH               GenomeHubs instance root directory path.
    --hub-version STR             GenomeHubs instance version string.
    --config-file PATH            Path to YAML file containing configuration options.
    --config-save PATH            Path to write configuration options to YAML file.
    --es-host URL                 ElasticSearch hostname/URL and port.
    --es-url URL                  Remote URL to fetch ElasticSearch code.
    --insdc-metadata              Flag to index metadata for public INSDC assemblies.
    --insdc-root INT              Root taxid when indexing public INSDC assemblies.
    --restore-indices             Flag to restore taxon and assembly indices.
    --taxonomy-path DIR           Path to directory containing raw taxonomies.
    --taxonomy-ncbi-root INT      Root taxid for NCBI taxonomy index.
    --taxonomy-ncbi-url URL       Remote URL to fetch NCBI taxonomy.
    --taxon-preload               Flag to preload all taxa in taxonomy into taxon index.
    --docker-contain STRING       GenomeHubs component to run in Docker.
    --docker-network STRING       Docker network name.
    --docker-timeout STRING       Time in seconds to wait for a component to start in
                                  Docker.
    --docker-es-container STRING  ElasticSearch Docker container name.
    --docker-es-image STRING      ElasticSearch Docker image name.
    --reset                       Flag to reset GenomeHubs instance if already exists.
    --force-reset                 Flag to force reset GenomeHubs instance if already
                                  exists.
    -h, --help                    Show this
    -v, --version                 Show version number

Examples:
    # 1. New GenomeHub with default settings
    ./genomehubs init

    # 2. New GenomeHub in specified directory, populated with Lepidoptera assembly
    #    metadata from INSDC
    ./genomehubs init --hub-path /path/to/GenomeHub --insdc-root 7088 --insdc-meta
"""

import sys

from docopt import docopt
from tolkein import tolog

from ..lib import analysis
from ..lib import assembly
from ..lib import es_functions
from ..lib import files
from ..lib import hub
from ..lib import taxon
from ..lib import taxonomy
from .config import config
from .version import __version__

LOGGER = tolog.logger(__name__)


def main(args):
    """Initialise genomehubs."""
    options = config("init", **args)

    # setup GenomeHubs directory
    hub.setup(options["init"])

    # Start Elasticsearch
    es = es_functions.launch_es(options["init"])

    # Post search scripts
    hub.post_search_scripts(es)

    # Index taxonomies
    if "taxonomy-source" in options["init"]:
        for taxonomy_name in options["init"]["taxonomy-source"]:
            template, stream = taxonomy.index(taxonomy_name, options["init"])
            if "taxonomy-%s-root" % taxonomy_name in options["init"]:
                es_functions.load_mapping(es, template["name"], template["mapping"])
                es_functions.index_stream(es, template["index_name"], stream)

            # Prepare taxon index
            taxon_template = taxon.index_template(taxonomy_name, options["init"])
            es_functions.load_mapping(
                es, taxon_template["name"], taxon_template["mapping"]
            )
            # attributes.index_types(
            #     es, taxon_template["name"], taxon_template["types"], options["init"]
            # )
            es_functions.index_create(es, taxon_template["index_name"])
            if options["init"].get("taxon-preload", False):
                LOGGER.info("Loading all taxa from taxonomy into taxon index")
                body = {
                    "source": {"index": template["index_name"]},
                    "dest": {"index": taxon_template["index_name"]},
                }
                es.reindex(body=body)

            # Prepare assembly index
            assembly_template = assembly.index_template(taxonomy_name, options["init"])
            es_functions.load_mapping(
                es, assembly_template["name"], assembly_template["mapping"]
            )
            es_functions.index_create(es, assembly_template["index_name"])
            # attributes.index_types(
            #     es, assembly_template["name"], assembly_template["types"], options["init"]
            # )

            # if "insdc-metadata" in options["init"]:
            #     assembly_metadata.index(
            #         es, options["init"], metadata_name="insdc", taxonomy_name=taxonomy_name
            #     )
            # Prepare analysis index
            analysis_template = analysis.index_template(taxonomy_name, options["init"])
            es_functions.load_mapping(
                es, analysis_template["name"], analysis_template["mapping"]
            )
            es_functions.index_create(es, analysis_template["index_name"])

            # Prepare file index
            file_template = files.index_template(taxonomy_name, options["init"])
            es_functions.load_mapping(
                es, file_template["name"], file_template["mapping"]
            )
            es_functions.index_create(es, file_template["index_name"])


def cli():
    """Entry point."""
    if len(sys.argv) == sys.argv.index(__name__.split(".")[-1]) + 1:
        args = docopt(__doc__, argv=[])
    else:
        args = docopt(__doc__, version=__version__)
    main(args)


if __name__ == "__main__":
    cli()
