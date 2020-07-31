#!/usr/bin/env python3

"""
Initialise a GenomeHubs instance.

Usage:
    genomehubs init [--hub-name STRING] [--hub-path PATH] [--hub-version PATH]
                    [--config-file PATH...] [--config-save PATH]
                    [--es-host URL...] [--es-url URL]
                    [--insdc-meta] [--insdc-root INT...]
                    [--taxonomy-path PATH] [--taxonomy-ncbi-root INT]
                    [--taxonomy-ncbi-url URL]
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
    --insdc-meta                  Flag to index metadata for public INSDC assemblies.
    --insdc-root INT              Root taxid when indexing public INSDC assemblies.
    --taxonomy-path DIR           Path to directory containing raw taxonomies.
    --taxonomy-ncbi-root INT      Root taxid for NCBI taxonomy index.
    --taxonomy-ncbi-url URL       Remote URL to fetch NCBI taxonomy.
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
import tarfile
import urllib.request
from pathlib import Path

from docopt import docopt
from tolkein import tolog

from .config import config
from .version import __version__

LOGGER = tolog.logger(__name__)


def fetch_taxdump(url, path, name=""):
    """Fetch and extract taxdump files."""
    LOGGER.info("Fetching %s taxdump from %s", name, url)
    file_tmp = urllib.request.urlretrieve(url, filename=None)[0]
    tar = tarfile.open(file_tmp)
    LOGGER.info("Extracting taxdump to %s", path)
    tar.extractall(path)
    LOGGER.info("Finished extracting taxdump")


def index_taxonomies(opts):
    """Index all taxonomies in `taxonomy-sources`."""
    taxdump_files = {"nodes.dmp", "names.dmp"}
    for taxonomy_name in opts["taxonomy-sources"]:
        taxonomy_path = Path("%s/%s" % (opts["taxonomy-path"], taxonomy_name))
        if "taxonomy-%s-tree" % taxonomy_name in opts:
            LOGGER.warning(
                "Unable to import %s. Trees are not yet supported as a taxonomy type",
                taxonomy_name,
            )
            continue
        taxonomy_path.mkdir(parents=True, exist_ok=True)
        for file_name in taxdump_files:
            file_path = taxonomy_path / file_name
            if not file_path.exists():
                fetch_taxdump(
                    url=opts["taxonomy-%s-url" % taxonomy_name],
                    path=taxonomy_path,
                    name=taxonomy_name,
                )
                break


def main(args):
    """Initialise genomehubs."""
    LOGGER.info("Loading configuration options")
    options = config("init", **args)

    # Reset an existing hub?
    # if 'reset' in options['init'] and options['init']['reset']:
    #     reset_hub(options)

    # Create GenomeHubs directory
    # setup_directory(options)

    # Start Elasticsearch
    # es = start_elasticsearch(options)

    # Fetch NCBI taxdump
    # fetch_taxdump(options)

    # Index taxonomies
    LOGGER.info("Indexing taxonomies")
    index_taxonomies(options["init"])
    # if "taxonomy-root" in options["init"] and options["init"]["taxonomy-root"]:
    #     print()
    #     LOGGER.info(options["init"]["taxonomy-sources"])
    #     # index_taxonomy(es, options)

    # # Index INSDC
    # if "insdc" in options["init"] and options["init"]["insdc"]:
    #     LOGGER.info(options["init"]["taxonomy-sources"])
    #     # index_insdc(es, options)


def cli():
    """Entry point."""
    if len(sys.argv) == sys.argv.index("init") + 1:
        args = docopt(__doc__, argv=[])
    else:
        args = docopt(__doc__, version=__version__)
    main(args)


if __name__ == "__main__":
    cli()
