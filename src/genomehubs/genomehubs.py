#!/usr/bin/env python3
"""
GenomeHubs.

Usage: genomehubs [<command>] [<args>...] [-h|--help] [--version]

Commands:
    index           index a file
    init            initialise a new genomehub
    launch          launch a web service
    parse           parse a local or remote data source
    remove          remove one or more indices from a genomehub
    run             run an analysis
    search          search indexed files
    -h, --help      show this
    -v, --version   show version number
See 'genomehubs <command> --help' for more information on a specific command.
"""

import sys

from docopt import DocoptExit
from docopt import docopt
from pkg_resources import working_set
from tolkein import tolog

from .lib.version import __version__

LOGGER = tolog.logger(__name__)


def cli():
    """Entry point."""
    if len(sys.argv) > 1:
        try:
            args = docopt(__doc__, help=False, version=__version__)
        except DocoptExit:
            args = {"<command>": sys.argv[1]}
        if args["<command>"]:
            # load <command> from entry_points
            for entry_point in working_set.iter_entry_points("genomehubs.subcmd"):
                if entry_point.name == args["<command>"]:
                    subcommand = entry_point.load()
                    sys.exit(subcommand())
            LOGGER.error("'genomehubs %s' is not a valid command", args["<command>"])
            sys.exit(1)
    print(__doc__)
    raise DocoptExit
