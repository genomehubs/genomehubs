#!/usr/bin/env python3
"""Window functions."""

import os

from tolkein import tofile
from tolkein import tolog

from .hub import deep_replace

LOGGER = tolog.logger(__name__)


def parse_config(config):
    """Parse values from config file."""
    revision = config.get("revision", 0)
    blobtoolkit_id = config["assembly"]["prefix"]
    if revision:
        blobtoolkit_id += f".{revision}"
    lineages = config.get("busco", {}).get("lineages", [])
    libraries = config.get("reads", {}).get("paired", []) + config.get("reads", {}).get(
        "single", []
    )
    replacements = [
        ("<<accession>>", config["assembly"]["accession"]),
        ("<<blobtoolkit_id>>", blobtoolkit_id),
        ("<<taxon_id>>", config["taxon"]["taxid"]),
        ("<<level>>", config["assembly"]["level"]),
        ("<<span>>", config["assembly"]["span"]),
        ("<<lineage>>", lineages[0]),
    ]
    return replacements, libraries


def fill_window_template(config_file, types, size=None):
    """Replace template values in window types file."""
    config = tofile.load_yaml(config_file)
    replacements, libraries = parse_config(config)
    if size is not None:
        replacements.append(("<<window>>", size))
    types = deep_replace(types, replacements)
    if libraries:
        prefix = libraries[0]["prefix"]
        types["attributes"]["coverage"] = {
            "header": f"{prefix}_cov",
            "function": "{} + 0.01",
        }
    return types


def window_parser(params, opts, *, types=None, names=None):
    """Parse window_stats files."""
    config_file = (
        opts.get("window", False) or opts.get("window-full", False)
    ) + "/config.yaml"
    if os.path.exists(config_file):
        new_types = fill_window_template(
            config_file, types, opts.get("window-size", [None])[0]
        )
    for key, value in new_types.items():
        types[key] = value
    return None
