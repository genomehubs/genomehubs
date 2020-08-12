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
    types_file = os.path.join(script_dir, "templates", parts[0] + ".types.yaml")
    types = tofile.load_yaml(types_file)
    try:
        for key, value in types.items():
            try:
                enum = set(value["constraint"]["enum"])
                value["constraint"]["enum"] = enum
            except KeyError:
                pass
    except AttributeError:
        pass
    template = {
        "name": parts[0],
        "index_name": opts["hub-separator"].join(parts),
        "mapping": tofile.load_yaml(mapping_file),
        "types": types,
    }
    return template


def min_value_constraint(value, limit):
    """Test minimum value constraint."""
    if value >= limit:
        return True
    return False


def max_value_constraint(value, limit):
    """Test maximum value constraint."""
    if value <= limit:
        return True
    return False


def enum_constraint(value, enum):
    """Test value in predefined set constraint."""
    if value in enum:
        return True
    return False


def test_constraint(value, constraint):
    """Test value against constraint."""
    constraints = {
        "min": min_value_constraint,
        "max": max_value_constraint,
        "enum": enum_constraint,
    }
    for key in constraint:
        if key in constraints:
            if not constraints[key](value, constraint[key]):
                return False
    return True


def add_attributes(entry, types, *, attributes=None):
    """Add attributes to a document."""
    if attributes is None:
        attributes = []
    for key, value in entry.items():
        if key in types:
            key_type = types[key]["type"]
            if key_type == "integer":
                value = int(value)
            elif key_type == "float":
                value = float(value)
            else:
                value = str(value)
                try:
                    value = types[key]["translate"][value]
                except KeyError:
                    pass
            try:
                valid = test_constraint(value, types[key]["constraint"])
            except KeyError:
                valid = True
            if valid:
                attribute = {"key": key, "%s_value" % key_type: value}
                attributes.append(attribute)
    return attributes
