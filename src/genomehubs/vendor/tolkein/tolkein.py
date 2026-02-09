#!/usr/bin/env python3
"""
Tolkein.

usage: tolkein [<command>] [<args>...] [-h|--help] [--version]

commands:
    -h, --help      show this
    -v, --version   show version number
"""

import sys
from importlib.metadata import entry_points

from docopt import DocoptExit
from docopt import docopt

from .lib.tolog import logger
from .lib.version import __version__

LOGGER = logger(__name__)


def cli():
    """Entry point."""
    if len(sys.argv) > 1:
        try:
            args = docopt(__doc__, help=False, version=__version__)
        except DocoptExit:
            args = {"<command>": sys.argv[1]}
        if args["<command>"]:
            # load <command> from entry_points
            eps = entry_points()
            if hasattr(eps, "select"):
                # Python 3.10+
                group = eps.select(group="tolkein.subcmd")
            else:
                # Python 3.9
                group = eps.get("tolkein.subcmd", [])
            for entry_point in group:
                if entry_point.name == args["<command>"]:
                    subcommand = entry_point.load()
                    sys.exit(subcommand(sys.argv[1:]))
            LOGGER.error("'tolkein %s' is not a valid command", args["<command>"])
            sys.exit(1)
    print(__doc__)
    raise DocoptExit
