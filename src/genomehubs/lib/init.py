#!/usr/bin/env python3

"""
Initialise a GenomeHub.

Usage:
    genomehubs init [--directory PATH] [--insdc]
              [--taxonomy-taxdump DIR] [--taxonomy-root TAXID...] [--configfile YAML...]
              [--es-container STRING] [--es-host HOSTNAME] [--es-image STRING]
              [--es-port PORT] [--es-repository STRING] [--es-startup-timeout STRING] [--use-docker]
              [--reset] [--force-reset]

Options:
    --directory PATH          Root directory for new GenomeHub.
    --insdc                   Flag to index Public INSDC assemblies.
    --taxonomy-taxdump DIR    NCBI taxonomy taxdump directory.
    --taxonomy-root INT       Root taxid for taxonomy index.
    --configfile YAML         YAML configuration file.
    --es-container STRING     Elasticseach Docker container name.
    --es-host HOSTNAME        Elasticseach hostname/URL.
    --es-image STRING         Elasticseach Docker image name.
    --es-port PORT            Elasticseach port number.
    --es-repository STRING    Elasticseach Docker repository name.
    --es-startup-timeout INT  Time in seconds to wait for Elasticseach Docker container to start.
    --use-docker              Flag to use Docker to run Elasticsearch.
    --reset                   Flag to reset GenomeHub if already exists.
    --force-reset             Flag to force reset GenomeHub if already exists.
    -h, --help                Show this
    -v, --version             Show version number

Examples:
    # 1. New GenomeHub with default settings
    ./genomehubs init

    # 2. New GenomeHub in specified directory, populated with Lepidoptera assemblies from INSDC
    ./genomehubs init --directory /path/to/GenomeHub --taxonomy-root 7088 --insdc
"""

import sys

from docopt import docopt
from tolkein import tolog

from .config import config
from .version import __version__

LOGGER = tolog.logger(__name__)


def main(args):
    """Initialise genomehubs."""
    LOGGER.info("Loading configuration options")
    options = config("init", **args)
    LOGGER.info(options)


def cli():
    """Entry point."""
    if len(sys.argv) == sys.argv.index("init") + 1:
        args = docopt(__doc__, argv=[])
    else:
        args = docopt(__doc__, version=__version__)
    main(args)


if __name__ == "__main__":
    cli()
