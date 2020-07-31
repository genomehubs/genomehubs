#!/usr/bin/env python3

"""
Search for entries.

Usage:
    genomehubs search [--assembly STRING...] [--feature STRING...]
                [--meta STRING...] [--overlap STRING...]
                [--return STRING...] [--taxon STRING...]
                [--gene-tree-node STRING...]
                [--species-tree-node STRING...]
                [--configfile YAML...] [--taxonomy-root INT]
                [--es-host HOSTNAME] [--es-port PORT]

Options:
    --assembly STRING           Assembly name or accession.
    --feature STRING            Feature value to search.
    --meta STRING               Metadata value to search.
    --overlap STRING            Feature to overlap.
    --return STRING             Formats to return
    --taxon STRING              Taxon or clade name or taxid.
    --gene-tree-node STRING     Gene tree node name or ID.
    --species-tree-node STRING  Tree name or ID.
    --configfile YAML           YAML configuration file.
    --taxonomy-root INT         Root taxid for taxonomy index.
    --es-host HOSTNAME          Elasticseach hostname/URL.
    --es-port PORT              Elasticseach port number.
    -h, --help                  Show this
    -v, --version               Show version number

Examples:
    # 1. All data for a clade
        ./genomehubs search \
            --taxon Nymphalidae \
            --target RAW

    # 2. All butterfly genomes above contig N50 1M
        ./genomehubs search \
            --taxon Lepidoptera \
            --meta 'assembly.contig_n50>1M' \
            --return FASTA,GFF3

    # 3. All genes with a given interpro domain
        ./genomehubs search \
            --assembly Hmel2.5 \
            --feature interpro_accession=IPR123456 \
            --overlap gene \
            --return GFF3

    # 4. All genes in a clade which are single copy busco genes"
        ./genomehubs search \
            --taxon Lepidoptera \
            --feature busco_status=Complete|Fragmented \
            --overlap gene \
            --return protein.FASTA
"""


import sys

from docopt import docopt

from .version import __version__


def cli():
    """Entry point."""
    if len(sys.argv) == sys.argv.index("search") + 1:
        args = docopt(__doc__, argv=[])
    else:
        args = docopt(__doc__, version=__version__)
    print(args)


if __name__ == "__main__":
    cli()
