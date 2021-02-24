#!/usr/bin/env python3

"""
Parse a local or remote data source.

Usage:
    genomehubs parse [--btk] [--btk-root STRING...]
                     [--wikidata PATH] [--wikidata-root STRING...] [--wikidata-xref STRING...]
                     [--gbif] [--gbif-root STRING...] [--gbif-xref STRING...]
                     [--ncbi-datasets-genome PATH] [--outfile PATH]
                     [--refseq-mitochondria] [--refseq-organelles]
                     [--refseq-plastids] [--refseq-root NAME]
                     [-h|--help] [-v|--version]

Options:
    --btk                        Parse assemblies in BlobToolKit
    --btk-root STRING            Scientific name of root taxon
    --gbif                       Parse taxa in GBIF
    --gbif-root STRING           GBIF taxon ID of root taxon
    --gbif-xref STRING           Include link to external reference from GBIF (e.g. NBN, BOLD)
    --wikidata PATH              Parse taxa in WikiData dump
    --wikidata-root STRING       WikiData taxon ID of root taxon
    --wikidata-xref STRING       Include link to external reference from WikiData (e.g. NBN, BOLD)
    --ncbi-datasets-genome PATH  Parse NCBI Datasets genome directory
    --outfile PATH               Save parsed output to file
    --refseq-mitochondria        Parse mitochondrial genomes from the NCBI RefSeq
                                 organelle collection
    --refseq-organelles          Parse all genomes from the NCBI RefSeq organelle
                                 collection
    --refseq-plastids            Parse plastid genomes from the NCBI RefSeq organelle
                                 collection
    --refseq-root NAME           Name (not taxId) of root taxon
    -h, --help                   Show this
    -v, --version                Show version number
"""

import re
import sys
from pathlib import Path

from docopt import docopt
from tolkein import tofile
from tolkein import tolog

from .btk import btk_parser
from .config import config
from .gbif import gbif_parser
from .hub import load_types
from .hub import order_parsed_fields
from .ncbi import ncbi_genome_parser
from .ncbi import refseq_organelle_parser
from .version import __version__
from .wikidata import wikidata_parser

LOGGER = tolog.logger(__name__)

PARSERS = {
    "btk": {"func": btk_parser, "params": None, "types": "btk"},
    "gbif": {"func": gbif_parser, "params": None, "types": "xref"},
    "ncbi-datasets-genome": {
        "func": ncbi_genome_parser,
        "params": None,
        "types": "assembly",
    },
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
    "wikidata": {"func": wikidata_parser, "params": None, "types": "xref"},
}


def main(args):
    """Parse data sources."""
    options = config("parse", **args)

    for option in options["parse"]:
        if option in PARSERS:
            params = PARSERS[option]["params"]
            if params is None:
                params = options["parse"][option]
            LOGGER.info("Parsing %s" % option)
            parsed = PARSERS[option]["func"](params, options["parse"])
            files = []
            if isinstance(parsed, tuple):
                parsed, files = parsed
            types = load_types(PARSERS[option]["types"])
            names = load_types(PARSERS[option]["types"], part="names")
            data = order_parsed_fields(parsed, types, names)
            tofile.write_file(options["parse"]["outfile"], data)
            filepath = Path(options["parse"]["outfile"])
            types["file"]["name"] = filepath.name
            outdir = filepath.parent
            suff = re.compile(r"\.[^\.]+$")
            if filepath.name.endswith(".gz"):
                stem = re.sub(suff, "", filepath.stem)
            else:
                stem = filepath.stem
            tofile.write_file("%s/%s.types.yaml" % (outdir, stem), types)
            if names:
                names["file"]["name"] = filepath.name
                tofile.write_file("%s/%s.names.yaml" % (outdir, stem), names)
            if files:
                tofile.write_file("%s/%s.files.yaml" % (outdir, stem), files)


def cli():
    """Entry point."""
    if len(sys.argv) == sys.argv.index("parse") + 1:
        args = docopt(__doc__, argv=[])
    else:
        args = docopt(__doc__, version=__version__)
    main(args)


if __name__ == "__main__":
    cli()
