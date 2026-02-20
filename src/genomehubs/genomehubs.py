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

from __future__ import annotations

import sys
import warnings
from datetime import datetime

from docopt import DocoptExit
from docopt import docopt

from genomehubs.vendor.tolkein import tolog

try:
    from importlib.metadata import entry_points
except ImportError:
    # Python < 3.8 fallback
    from importlib_metadata import entry_points

from .lib.version import __version__

LOGGER = tolog.logger(__name__)


# Python EOL dates from https://devguide.python.org/versions/
PYTHON_EOL_DATES = {
    (3, 9): datetime(2025, 10, 5),
    (3, 10): datetime(2026, 10, 4),
    (3, 11): datetime(2027, 10, 24),
    (3, 12): datetime(2028, 10, 2),
    (3, 13): datetime(2029, 10, 1),
}

# Minimum supported Python version
MIN_PYTHON_VERSION = (3, 10)


def check_python_version():
    """Check for deprecated or EOL Python versions and warn users."""
    current_version = (sys.version_info.major, sys.version_info.minor)
    current_date = datetime.now()

    # Check if running on unsupported version
    if current_version < MIN_PYTHON_VERSION:
        warnings.warn(
            f"Python {current_version[0]}.{current_version[1]} is no longer supported by GenomeHubs. "
            f"Please upgrade to Python {MIN_PYTHON_VERSION[0]}.{MIN_PYTHON_VERSION[1]} or later.",
            DeprecationWarning,
            stacklevel=3,
        )
        return

    # Check if running on version approaching EOL
    if current_version in PYTHON_EOL_DATES:
        eol_date = PYTHON_EOL_DATES[current_version]
        days_until_eol = (eol_date - current_date).days

        if days_until_eol < 0:
            # Already past EOL
            warnings.warn(
                f"Python {current_version[0]}.{current_version[1]} reached end-of-life on {eol_date.strftime('%Y-%m-%d')}. "
                "GenomeHubs support will be removed in a future release. "
                f"Please upgrade to Python {MIN_PYTHON_VERSION[0]}.{MIN_PYTHON_VERSION[1]} or later for continued support and security updates.",
                DeprecationWarning,
                stacklevel=3,
            )
        elif days_until_eol < 180:  # Warn 6 months before EOL
            warnings.warn(
                f"Python {current_version[0]}.{current_version[1]} will reach end-of-life on {eol_date.strftime('%Y-%m-%d')} "
                f"({days_until_eol} days). "
                f"Please plan to upgrade to Python {MIN_PYTHON_VERSION[0]}.{MIN_PYTHON_VERSION[1]} or later.",
                FutureWarning,
                stacklevel=3,
            )


def cli():
    """Entry point."""
    check_python_version()
    if len(sys.argv) > 1:
        try:
            args = docopt(__doc__, help=False, version=__version__)
        except DocoptExit:
            args = {"<command>": sys.argv[1]}
        if args["<command>"]:
            # load <command> from entry_points
            eps = entry_points()
            # Handle both old and new entry_points() API
            if hasattr(eps, "select"):
                # New API (Python 3.10+)
                subcommand_eps = eps.select(group="genomehubs.subcmd")
            else:
                # Old API (Python 3.8-3.9)
                subcommand_eps = eps.get("genomehubs.subcmd", [])

            for entry_point in subcommand_eps:
                if entry_point.name == args["<command>"]:
                    subcommand = entry_point.load()
                    sys.exit(subcommand())
            LOGGER.error("'genomehubs %s' is not a valid command", args["<command>"])
            sys.exit(1)
    print(__doc__)
    raise DocoptExit
