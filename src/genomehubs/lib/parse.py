#!/usr/bin/env python3

"""
Parse a local or remote data source.

Usage:
    genomehubs parse [--refseq-mitochondria FILE] [--refseq-organelles FILE]
                     [--refseq-plastids FILE] [--refseq-root NAME]
                     [-h|--help] [-v|--version]

Options:
    --refseq-mitochondria FILE  Parse mitochondrial genomes from the NCBI RefSeq
                                organelle collection into FILE
    --refseq-organelles FILE    Parse all genomes from the NCBI RefSeq organelle
                                collection into FILE
    --refseq-plastids FILE      Parse plastid genomes from the NCBI RefSeq organelle
                                collection into FILE
    --refseq-root NAME          Name (not taxId) of root taxon
    -h, --help                  Show this
    -v, --version               Show version number
"""

import sys

from docopt import docopt
from tolkein import tofetch
from tolkein import tofile
from tolkein import tolog

from .config import config
from .hub import order_parsed_fields
from .ncbi import refseq_organelle_parser
from .version import __version__

LOGGER = tolog.logger(__name__)

PARSERS = {
    "refseq-mitochondria": {
        "func": refseq_organelle_parser,
        "params": ("mitochondrion"),
        "types": "organelle",
    },
    "refseq-organelles": {
        "func": refseq_organelle_parser,
        "params": ("mitochondrion", "plastid"),
        "types": "organelle",
    },
    "refseq-plastids": {
        "func": refseq_organelle_parser,
        "params": ("plastid"),
        "types": "organelle",
    },
}


def main(args):
    """Parse data sources."""
    options = config("parse", **args)

    for option in options["parse"]:
        if option in PARSERS:
            parsed = PARSERS[option]["func"](
                PARSERS[option]["params"], options["parse"]
            )
            data = order_parsed_fields(parsed, PARSERS[option]["types"])
            tofile.write_file(options["parse"][option], data)


def cli():
    """Entry point."""
    if len(sys.argv) == sys.argv.index("parse") + 1:
        args = docopt(__doc__, argv=[])
    else:
        args = docopt(__doc__, version=__version__)
    main(args)


if __name__ == "__main__":
    cli()
