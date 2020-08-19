#!/usr/bin/env python3
"""Hub functions."""

import numbers
import os
import re
from pathlib import Path

from tolkein import tofile
from tolkein import tolog

LOGGER = tolog.logger(__name__)
MIN_INTEGER = -(2 ** 31)
MAX_INTEGER = 2 ** 31 - 1


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


def post_search_scripts(es):
    """POST ElasticSearch search scripts."""
    script_dir = os.path.dirname(os.path.dirname(os.path.realpath(__file__)))
    search_script_dir = os.path.join(script_dir, "templates", "scripts")
    directory = os.fsencode(search_script_dir)
    for script_file in os.listdir(directory):
        filename = os.fsdecode(script_file)
        if filename.endswith(".json"):
            body = tofile.load_yaml(os.path.join(search_script_dir, filename))
            script_id = filename.replace(".json", "")
            es.put_script(id=script_id, body=body)


def byte_type_constraint(value):
    """Test byte_type constraint."""
    if value >= -128 and value <= 128:
        return True
    return False


def integer_type_constraint(value):
    """Test integer_type constraint."""
    if value >= MIN_INTEGER and value <= MAX_INTEGER:
        return True
    return False


def short_type_constraint(value):
    """Test short_type constraint."""
    if value >= -32768 and value <= 32767:
        return True
    return False


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
        "byte": byte_type_constraint,
        "integer": integer_type_constraint,
        "short": short_type_constraint,
        "min": min_value_constraint,
        "max": max_value_constraint,
        "enum": enum_constraint,
    }
    for key in constraint:
        if key in constraints:
            if not constraints[key](value, constraint[key]):
                return False
    return True


def convert_lat_lon(location):
    """Convert lat and lon to array notation."""
    if isinstance(location, list):
        return ",".join(location)
    if location.endswith(("E", "W")):
        sign = {"N": "", "E": "", "S": "-", "W": "-"}
        parts = re.split(r"\s*([NESW])\s*", location)
        string = "%s%s,%s%s" % (sign[parts[1]], parts[0], sign[parts[3]], parts[2])
        return string
    if location:
        return None
    return ""


def convert_to_type(key, value, to_type):
    """Convert values to type."""
    if to_type in {"byte", "integer", "long", "short"}:
        try:
            value = int(value)
        except ValueError:
            value = None
    elif to_type in {
        "double",
        "float",
        "half_float",
        "1dp",
        "2dp",
        "3dp",
        "4dp",
    }:
        try:
            value = float(value)
        except ValueError:
            value = None
    elif to_type == "geo_point":
        value = convert_lat_lon(value)
    else:
        value = str(value)
    if value is None:
        LOGGER.warning(
            "%s value %s is not a valid %s", key, str(value), to_type,
        )
    return value


def add_attributes(entry, types, *, attributes=None, source=None):
    """Add attributes to a document."""
    if attributes is None:
        attributes = []
    for key, value in entry.items():
        if key in types:
            key_type = types[key]["type"]
            value = convert_to_type(key, value, key_type)
            if value is None:
                continue
            if isinstance(value, str):
                if not value:
                    continue
                try:
                    value = types[key]["translate"][value]
                except KeyError:
                    pass
            try:
                valid = test_constraint(value, key_type)
                if valid:
                    valid = test_constraint(value, types[key]["constraint"])
            except KeyError:
                valid = True
            if valid:
                attribute = {"key": key, "%s_value" % key_type: value}
                if source is not None:
                    attribute.update({"source": source})
                attributes.append(attribute)
            elif value:
                LOGGER.warning("%s is not a valid %s value", str(value), key)
    return attributes
