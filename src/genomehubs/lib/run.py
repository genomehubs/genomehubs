#!/usr/bin/env python3

"""
Run a tool.

Usage:
    genomehubs run [<args>...] [-h|--help] [-v|--version]

Options:
    -h, --help                Show this
    -v, --version             Show version number
"""

import sys

from docopt import docopt

from .version import __version__


def cli():
    """Entry point."""
    if len(sys.argv) == sys.argv.index("run") + 1:
        args = docopt(__doc__, argv=[])
    else:
        args = docopt(__doc__, version=__version__)
    print(args)


if __name__ == "__main__":
    cli()
