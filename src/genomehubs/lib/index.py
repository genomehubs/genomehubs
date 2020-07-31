#!/usr/bin/env python3

"""
Index a file.

Usage:
    genomehubs index [--assembly_id ID...] [--insdc]
               [--busco TSV...] [--fasta FASTA...] [--gff3 GFF3...]
               [--interproscan TSV...]
               [--taxonomy] [--taxonomy-taxdump DIR] [--taxonomy-root INT...]
               [--species-tree NWK...] [--gene-trees DIR...]
               [--configfile YAML...] [--skip-validation]
               [--unique-name STRING] [--es-host HOSTNAME] [--es-port PORT]

Options:
    --assembly_id ID        An assembly ID can be provided here or parsed from input filenames.
    --busco TSV             BUSCO full_table.tsv output file.
    --fasta FASTA           FASTA sequence file.
    --gff3 GFF3             GFF3 file.
    --insdc                 Flag to index public INSDC assemblies.
    --interproscan TSV      InterProScan output file.
    --taxonomy              Flag to index taxonomy.
    --taxonomy-taxdump DIR  NCBI taxonomy taxdump directory.
    --taxonomy-root INT     Root taxid for taxonomy index.
    --species-tree NWK      Newick or NHX format species tree file.
    --gene-trees DIR        Directory containing Newick or NHX format gene tree files.
    --configfile YAML       YAML configuration file.
    --skip-validation       Don't validate input files.
    --unique-name STRING    Unique name to use in Elasticseach index.
    --es-host HOSTNAME      Elasticseach hostname/URL.
    --es-port PORT          Elasticseach port number.
    -h, --help              Show this
    -v, --version           Show version number

Examples:
    # 1. Index NCBI taxdump
    ./genomehubs index --taxonomy-taxdump /path/to/taxdump

    # 2. Index a GFF3 file
    ./genomehubs index --gff3 Assembly_name.gff3

"""

import sys

from docopt import docopt

from .version import __version__


def cli():
    """Entry point."""
    if len(sys.argv) == sys.argv.index("index") + 1:
        args = docopt(__doc__, argv=[])
    else:
        args = docopt(__doc__, version=__version__)
    print(args)


if __name__ == "__main__":
    cli()
