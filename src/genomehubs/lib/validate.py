#!/usr/bin/env python3
"""Hub functions."""

import sys
from pathlib import Path

from tolkein import tofile
from tolkein import tolog

from .attributes import fetch_types
from .hub import process_names_file

LOGGER = tolog.logger(__name__)


def validate_types_file(types_file, dir_path, es, types_name, opts, *, attributes=None):
    """Validate types file."""
    LOGGER.info("Validating YAML file %s", types_file)
    try:
        if not isinstance(types_file, str):
            types_file = str(types_file.resolve())
        types = tofile.load_yaml(types_file)
    except Exception:
        LOGGER.error("Unable to open types file %s", types_file)
        sys.exit(1)
    if "attributes" in types:
        if attributes is None:
            attributes = {}
        try:
            stored_attributes = fetch_types(es, types_name, opts)
            attributes = {**stored_attributes, **attributes}
        except Exception:
            pass
        if attributes:
            sequence = max(int(d['sequence']) for d in attributes.values()) + 1
        else:
            sequence = 0
        for key, entry in types["attributes"].items():
            if not isinstance(entry, dict):
                entry = {"default": entry}
            if key in attributes:
                entry = {**attributes[key], **entry}
            if "sequence" not in entry:
                entry["sequence"] = sequence
                sequence += 1
            types["attributes"][key] = entry
            enum = entry.get("constraint", {}).get("enum", [])
            if enum:
                entry["constraint"]["enum"] = [value.lower() for value in enum]
            translate = entry.get("translate", {})
            if translate:
                entry["translate"] = {key.lower(): value for key, value in translate.items()}
    names = None
    exclusions = None
    data = None
    if "file" in types:
        if "name" in types["file"]:
            if (
                "taxonomy" not in types
                and "features" not in types
                and "taxon_id" not in types["features"]
            ):
                LOGGER.error("Types file contains no taxonomy information")
                sys.exit(1)
            datafile = Path(dir_path) / types["file"]["name"]
            data = tofile.open_file_handle(datafile)
            if data is None:
                LOGGER.error("Data file '%s' could not de opened for reading", datafile)
                sys.exit(1)
        defaults = {"attributes": {}, "metadata": {}}
        if "defaults" in types:
            for key, value in types["defaults"]:
                defaults[key] = value
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
            if "exclusions" in types["file"]:
                exclusions = process_names_file(
                    types, Path(dir_path) / "exclusions" / types["file"]["name"], value_path=types["file"]["exclusions"]
                )
    return types, data, names, exclusions
