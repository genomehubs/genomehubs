#!/usr/bin/env python3
"""Hub functions."""

import sys
from pathlib import Path

from tolkein import tofile
from tolkein import tolog

from .attributes import fetch_types
from .hub import process_names_file

LOGGER = tolog.logger(__name__)


def validate_types_file(types_file, dir_path, es, types_name, opts):
    """Validate types file."""
    LOGGER.info("Validating YAML file %s", types_file)
    try:
        types = tofile.load_yaml(str(types_file.resolve()))
    except Exception:
        LOGGER.error("Unable to open types file %s", str(types_file.resolve()))
        sys.exit(1)
    if "attributes" in types:
        try:
            attributes = fetch_types(es, types_name, opts)
        except Exception:
            attributes = {}
        for key, entry in types["attributes"].items():
            if key in attributes:
                entry = {**attributes[key], **entry}
            enum = entry.get("constraint", {}).get("enum", [])
            if enum:
                entry["constraint"]["enum"] = [value.lower() for value in enum]

    names = None
    data = None
    if "file" in types:
        if "name" in types["file"]:
            if "taxonomy" not in types:
                LOGGER.error("Types file contains no taxonomy information")
                sys.exit(1)
            datafile = Path(dir_path) / types["file"]["name"]
            data = tofile.open_file_handle(datafile)
            if data is None:
                LOGGER.error("Data file '%s' could not de opened for reading", datafile)
                sys.exit(1)
        defaults = {"attributes": {}, "metadata": {}}
        for key, value in types["file"].items():
            if key.startswith("display") or key.startswith("taxon"):
                defaults["attributes"].update({key: value})
            elif key.startswith("source"):
                defaults["attributes"].update({key: value})
                defaults["metadata"].update({key: value})
        types.update({"defaults": defaults})
        if "name" in types["file"]:
            names = process_names_file(
                types, Path(dir_path) / "names" / types["file"]["name"]
            )
    return types, data, names
