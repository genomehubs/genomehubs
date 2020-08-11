#!/usr/bin/env python3
"""Hub functions."""

import os
from pathlib import Path

from tolkein import tofile
from tolkein import tolog


def setup(opts):
    """Set up directory for this GenomeHubs instance and handle reset."""
    Path(opts["hub-path"]).mkdir(parents=True, exist_ok=True)
    return True


def index_templator(parts, opts):
    """Index template helper function."""
    script_dir = os.path.dirname(os.path.dirname(os.path.realpath(__file__)))
    mapping_file = os.path.join(script_dir, "templates", parts[0] + ".json")
    types_file = os.path.join(script_dir, "templates", parts[0] + ".types.json")
    template = {
        "name": parts[0],
        "index_name": opts["hub-separator"].join(parts),
        "mapping": tofile.load_yaml(mapping_file),
        "types": tofile.load_yaml(types_file),
    }
    return template
