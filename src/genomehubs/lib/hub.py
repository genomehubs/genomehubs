#!/usr/bin/env python3
"""Hub functions."""


import contextlib
import csv
import os
import re
import shutil
import sys
from collections import defaultdict
from copy import deepcopy
from operator import add
from operator import mod
from operator import mul
from operator import pow
from operator import sub
from operator import truediv
from pathlib import Path

from tolkein import tofile
from tolkein import tolog

from .es_functions import query_flexible_template

LOGGER = tolog.logger(__name__)
MIN_INTEGER = -(2 ** 31)
MAX_INTEGER = 2 ** 31 - 1
DATE = re.compile(r"^[12]\d{3}-[01]\d-[0123]\d$")


def setup(opts):
    """Set up directory for this GenomeHubs instance and handle reset."""
    Path(opts["hub-path"]).mkdir(parents=True, exist_ok=True)
    return True


def dep(arg):
    """Dependency resolver."""
    # from https://code.activestate.com/recipes/576570-dependency-resolver/
    # © 2008 Louis Riviere (MIT)
    d = dict((k, set(arg[k])) for k in arg)
    r = []
    c = 0
    while d and c < 10:
        # values not in keys (items without dep)
        t = set(i for v in d.values() for i in v) - set(d.keys())
        # and keys without value (items without dep)
        t.update(k for k, v in d.items() if not v)
        # can be done right away
        r.append(t)
        # and cleaned up
        d = dict(((k, v - t) for k, v in d.items() if v))
        c += 1
    if d:
        LOGGER.error("Unable to resolve dependency tree")
        sys.exit(1)
    return r


def list_files(dir_path, pattern):
    """List files and sort by dependencies."""
    LOGGER.info("Finding files in %s matching %s", dir_path, pattern)
    deps = {}
    file_list = []
    yaml_files = sorted(Path(dir_path).glob(pattern))
    for yaml_file in yaml_files:
        yaml_dir = yaml_file.parent
        yaml_file = str(yaml_file)
        data = tofile.load_yaml(yaml_file)
        if "file" in data and "needs" in data["file"]:
            needs = data["file"]["needs"]
            if not isinstance(needs, list):
                needs = [needs]
            deps[yaml_file] = [f"{yaml_dir}/{needed}" for needed in needs]
        else:
            deps[yaml_file] = []
    file_list = [item for sublist in dep(deps) for item in sublist]
    return file_list


def copy_types(name, directory):
    """Copy a types file from the templates directory."""
    script_dir = os.path.dirname(os.path.dirname(os.path.realpath(__file__)))
    with contextlib.suppress(Exception):
        types_file = os.path.join(script_dir, "templates", name)
        if not os.path.exists(f"directory/{name}"):
            shutil.copy(types_file, directory)


def load_types(name, *, part="types"):
    """Read a types file from the templates directory."""
    script_dir = os.path.dirname(os.path.dirname(os.path.realpath(__file__)))
    types = None
    with contextlib.suppress(Exception):
        types_file = os.path.join(script_dir, "templates", f"{name}.{part}.yaml")
        types = tofile.load_yaml(types_file)
        # TODO: check if this code is redundant
        with contextlib.suppress(AttributeError):
            for key, value in types.items():
                with contextlib.suppress(KeyError):
                    enum = {
                        str(option).lower() for option in value["constraint"]["enum"]
                    }
                    value["constraint"]["enum"] = enum
    if types and "file" in types:
        for key, value in types["file"].items():
            if "attributes" in types:
                for attr in types["attributes"].values():
                    if (
                        isinstance(attr, (dict, list))
                        and key
                        not in ("exclusions", "format", "header", "name", "needs")
                        and key not in attr
                    ):
                        attr[key] = value
            if "taxon_names" in types:
                for attr in types["taxon_names"].values():
                    if (
                        key not in ("exclusions", "format", "header", "name")
                        and key not in attr
                    ):
                        attr[key] = value
    return types


def index_templator(parts, opts):
    """Index template helper function."""
    script_dir = os.path.dirname(os.path.dirname(os.path.realpath(__file__)))
    mapping_file = os.path.join(script_dir, "templates", f"{parts[0]}.json")
    types = load_types(parts[0])
    names = load_types(parts[0], part="names")
    return {
        "name": parts[0],
        "index_name": opts["hub-separator"].join(parts),
        "mapping": tofile.load_yaml(mapping_file),
        "types": types,
        "names": names,
    }


def add_names_to_types(names, types):
    """Add names field meta to type field meta."""
    sources = 0
    if types is not None:
        types = deepcopy(types)
        sources += 1
    elif names is not None:
        types = deepcopy(names)
        sources += 1
    if sources == 2:
        for group, entries in names.items():
            if group not in types:
                types[group] = deepcopy(entries)
            else:
                for field, attrs in entries.items():
                    if isinstance(attrs, dict):
                        if field not in types[group]:
                            types[group][field] = deepcopy(attrs)
                        elif types[group][field]["header"] != attrs["header"]:
                            types[group][f"names_{field}"] = deepcopy(attrs)
    return types


def order_parsed_fields(parsed, types, names=None):
    """Order parsed fields using a template file."""
    columns = {}
    fields = {}
    ctr = 0
    types = add_names_to_types(names, types)
    for group, entries in types.items():
        for field, attrs in entries.items():
            header = False
            with contextlib.suppress(AttributeError):
                for key, value in attrs.items():
                    if key == "header":
                        header = value
                    elif key == "index":
                        if value not in columns:
                            columns[value] = field
                            fields[field] = value
                if header:
                    if not isinstance(header, list):
                        header = [header]
                    for head in header:
                        if head not in fields:
                            columns[ctr] = head
                            fields[head] = ctr
                            ctr += 1
    order = [x[0] for x in sorted(fields.items(), key=lambda x: x[1])]
    data = [order]
    for entry in parsed:
        row = [entry.get(field, "None") for field in order]
        data.append(row)
    return data


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
            with tolog.DisableLogger():
                es.put_script(id=script_id, body=body)


def byte_type_constraint(value):
    """Test byte_type constraint."""
    return value >= -128 and value <= 128


def integer_type_constraint(value):
    """Test integer_type constraint."""
    return value >= MIN_INTEGER and value <= MAX_INTEGER


def short_type_constraint(value):
    """Test short_type constraint."""
    return value >= -32768 and value <= 32767


def min_value_constraint(value, limit):
    """Test minimum value constraint."""
    return value >= limit


def max_value_constraint(value, limit):
    """Test maximum value constraint."""
    return value <= limit


def enum_constraint(value, enum):
    """Test value in predefined set constraint."""
    return str(value).lower() in enum


def date_constraint(value, enum):
    """Test date constraint."""
    return DATE.match(value)


def test_constraint(value, constraint):
    """Test value against constraint."""
    constraints = {
        "byte": byte_type_constraint,
        "integer": integer_type_constraint,
        "short": short_type_constraint,
        "min": min_value_constraint,
        "max": max_value_constraint,
        "enum": enum_constraint,
        "date": date_constraint,
    }
    return not any(
        key in constraints and not constraints[key](value, constraint[key])
        for key in constraint
    )


def convert_lat_lon(location):
    """Convert lat and lon to array notation."""
    if isinstance(location, list):
        return ",".join(location)
    if location.endswith(("E", "W")):
        sign = {"N": "", "E": "", "S": "-", "W": "-"}
        parts = re.split(r"\s*([NESW])\s*", location)
        return f"{sign[parts[1]]}{parts[0]},{sign[parts[3]]}{parts[2]}"
    if re.match(r"-*\d+\.*\d*,-*\d+\.*\d*", location):
        return location
    return None if location else ""


def convert_to_type(key, raw_value, to_type, *, translate=None):
    """Convert values to type."""
    if to_type in {"byte", "integer", "long", "short"}:
        try:
            value = int(raw_value)
        except ValueError:
            if translate and raw_value in translate:
                value = convert_to_type(key, translate[raw_value], to_type)
            else:
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
            value = float(raw_value)
        except ValueError:
            if translate and raw_value in translate:
                value = convert_to_type(key, translate[raw_value], to_type)
            else:
                value = None
        except TypeError:
            LOGGER.warn("Unable to import %s", key)
            value = None
    elif to_type == "geo_point":
        value = convert_lat_lon(raw_value)
    else:
        value = str(raw_value)
    if value is None:
        LOGGER.warning(
            "%s value %s is not a valid %s",
            key,
            str(raw_value),
            to_type,
        )
    return value


def calculate(string):
    """Recursively apply operations to a string."""
    operators = {
        "+": add,
        "-": sub,
        "%": mod,
        "*": mul,
        "/": truediv,
        "**": pow,
    }
    string = string.replace(" ", "")
    with contextlib.suppress(ValueError):
        return float(string)
    parts = re.split(r"(\(.+\))", string)
    if len(parts) > 1:
        for index, part in enumerate(parts):
            if part.startswith("("):
                part = part[1:-1]
                parts[index] = str(calculate(part))
        string = "".join(parts)
    for function in operators.keys():
        left, operator, right = string.partition(function)
        if operator in operators:
            try:
                return operators[operator](calculate(left), calculate(right))
            except TypeError:
                return None


def lookup_attribute_value(identifier, attribute, shared_values):
    """Lookup an indexed attribute value."""
    value_type = shared_values["_types"]["attributes"][attribute]["type"]
    opts = {
        "id_field": f'{shared_values["_index_type"]}_id',
        "primary_id": identifier,
        "attribute": attribute,
        "value_type": value_type,
    }
    res = query_flexible_template(
        shared_values["_es"],
        "attribute_value_by_primary_id",
        shared_values["_index"],
        opts,
    )
    hits = res["hits"]["hits"]
    try:
        if len(hits) == 1:
            inner_hits = hits[0]["inner_hits"][f"{attribute}_values"]["hits"]["hits"]
            if len(inner_hits) == 1:
                field_values = inner_hits[0]["fields"][f"attributes.{value_type}_value"]
                if len(field_values) == 1:
                    shared_values[identifier][attribute] = field_values[0]
                    return field_values[0]
    except KeyError:
        print(inner_hits)
        sys.exit(1)
    return None


def apply_template(value, operation, row_values, shared_values):
    """Apply template to a function description."""
    parts = re.split(r"(\{.*?\})", operation)
    for index, part in enumerate(parts):
        if part.startswith("{"):
            part = part[1:-1]
            if not part:
                parts[index] = value
            elif part in row_values:
                parts[index] = str(row_values[part])
            elif part.startswith("."):
                part = part[1:]
                if value in shared_values and part in shared_values[value]:
                    parts[index] = str(shared_values[value][part])
                else:
                    parts[index] = str(
                        lookup_attribute_value(value, part, shared_values)
                    )
                if parts[index] is None:
                    LOGGER.error("%s has no value for attribute %s", value, part)
                    sys.exit()
            else:
                LOGGER.error("function template '%s' is not supported", operation)
                sys.exit(1)
    return "".join(parts)


def calculator(value, operation, row_values, shared_values, template_type):
    """Template-based calculator."""
    # print(dict(shared_values))
    operation = apply_template(value, operation, row_values, shared_values)
    return operation if template_type == "template" else calculate(operation)


def validate_values(values, key, types, row_values, shared_values, blanks):
    """Validate values."""
    validated = []
    if isinstance(types[key], str) or "type" not in types[key]:
        types[key]["type"] = "keyword"
    key_type = types[key]["type"]
    for value in values:
        if value in blanks:
            continue
        if "function" in types[key] or "template" in types[key]:
            if re.match(r"^\d+\.\d+e[\+-]\d+$", value):
                value = str(float(value))
            try:
                template_type = "function" if "function" in types[key] else "template"
                value = calculator(
                    value,
                    types[key][template_type],
                    row_values,
                    shared_values,
                    template_type,
                )
            except ValueError:
                continue
        value = convert_to_type(
            key, value, key_type, translate=types[key].get("translate", None)
        )
        if isinstance(types[key], str):
            validated.append(value)
            continue
        if value is None:
            continue
        if isinstance(value, str):
            if not value:
                continue
            with contextlib.suppress(KeyError):
                # print(types[key]["translate"])
                value = types[key]["translate"][value.lower()]
        if not isinstance(value, list):
            value = [value]
        for v in value:
            if v in blanks:
                continue
            try:
                valid = test_constraint(v, key_type)
                if valid:
                    valid = test_constraint(v, types[key]["constraint"])
            except KeyError:
                valid = True
            if valid:
                validated.append(v)
            elif v:
                LOGGER.warning("%s is not a valid %s value", str(v), key)
    return validated


def apply_value_template(prop, value, attribute, *, taxon_types, has_taxon_data):
    """Set value using template."""
    template = re.compile(r"^(.*?\{\{)(.+)(\}\}.*)$")
    new_prop = prop.replace("taxon_", "")
    if match := template.match(str(value)):
        groups = match.groups()
        if groups[1] and groups[1] in attribute:
            has_taxon_data = True
            new_value = attribute[groups[1]]
            if groups[0] != "{{":
                new_value = "%s%s" % (
                    groups[0].replace("{{", ""),
                    str(new_value),
                )
            if groups[2] != "}}":
                new_value = "%s%s" % (
                    str(new_value),
                    groups[2].replace("}}", ""),
                )
            update_taxon_types(taxon_types, new_prop, new_value, prop)
    else:
        has_taxon_data = True
        update_taxon_types(taxon_types, new_prop, value, prop)
    return has_taxon_data


def update_taxon_types(taxon_types, new_prop, value, prop):
    """Set taxon attribute property."""
    taxon_types.update({new_prop: value, "group": "taxon"})
    if prop in taxon_types:
        del taxon_types[prop]


def add_attributes(
    entry,
    types,
    *,
    attributes=None,
    source=None,
    attr_type="attributes",
    meta=None,
    shared_values=None,
    row_values=None,
    blanks=None,
):
    """Add attributes to a document."""
    (
        attributes,
        meta,
        row_values,
        taxon_attributes,
        taxon_types,
        attribute_values,
    ) = set_add_attributes_defaults(attributes, meta, row_values)
    for key, values in entry.items():
        if key in types:
            if not isinstance(values, list):
                values = [values]
            if attr_type == "taxon_names":
                validated = values
            else:
                validated = validate_values(
                    values, key, types, row_values, shared_values, blanks
                )
            # TODO: handle invalid values
            if validated:
                if len(validated) == 1:
                    validated = validated[0]
                row_values[key] = validated
                if attr_type == "attributes":
                    attribute = {"key": key, f'{types[key]["type"]}_value': validated}
                    attribute_values[key] = attribute
                elif attr_type == "taxon_names":
                    attribute = {"name": validated, "class": key}
                else:
                    attribute = {"identifier": validated, "class": key}
                if "source" in types[key]:
                    attribute.update(meta)
                    attribute.update(
                        {
                            k: v
                            for k, v in types[key].items()
                            if k.startswith("source") and k not in attribute
                        }
                    )
                else:
                    attribute.update(meta)
                    if "source" not in attribute and source is not None:
                        attribute.update({"source": source})
                attributes.append(attribute)
    if attribute_values:
        for attribute in attributes:
            has_taxon_data = False
            taxon_attribute = {**attribute, "source_index": "assembly"}
            taxon_attribute_types = {**types[attribute["key"]]}
            # taxon_props = []
            for prop, value in types[attribute["key"]].items():
                if prop.startswith("taxon_"):
                    has_taxon_data = apply_value_template(
                        prop,
                        value,
                        attribute,
                        taxon_types=taxon_attribute_types,
                        has_taxon_data=has_taxon_data,
                    )
                    # taxon_props.append(prop)
            # for prop in taxon_props:
            #     del types[attribute["key"]][prop]
            if has_taxon_data:
                if "name" not in taxon_attribute_types:
                    taxon_attribute_types["name"] = attribute["key"]
                taxon_attribute["key"] = taxon_attribute_types["name"]
                # taxon_attribute.update({"name": taxon_attribute_types["key"]})
                taxon_attributes.append(taxon_attribute)
                taxon_types[taxon_attribute_types["name"]] = taxon_attribute_types
    return attributes, taxon_attributes, taxon_types


def set_add_attributes_defaults(attributes, meta, row_values):
    """Set default values for add_attributes."""
    if attributes is None:
        attributes = []
    taxon_attributes = []
    taxon_types = {}
    if meta is None:
        meta = {}
    attribute_values = {}
    if row_values is None:
        row_values = {}
    return attributes, meta, row_values, taxon_attributes, taxon_types, attribute_values


def chunks(arr, n):
    """Yield successive n-sized chunks from arr."""
    for i in range(0, len(arr), n):
        yield arr[i : i + n]


def add_attribute_values(existing, new, *, raw=True):
    """Add attribute values to records."""
    indices = {}
    for index, entry in enumerate(existing):
        indices[entry["key"]] = index
    index = len(existing)
    for group in new:
        if not isinstance(group, list):
            group = [group]
        for entry in group:
            if raw:
                arr = []
                if indices and entry["key"] in indices:
                    try:
                        arr = existing[indices[entry["key"]]]["values"]
                    except KeyError:
                        LOGGER.error(
                            "Unable to import values to an attribute (%s) that has already been filled",
                            entry["key"],
                        )
                        exit(1)
                else:
                    existing.append({"key": entry["key"], "values": arr})
                    indices[entry["key"]] = index
                    index += 1
                del entry["key"]
                arr.append(entry)
            else:
                existing.append(
                    {
                        **entry,
                        "count": 1,
                        # "aggregation_method": "unique",
                        # "aggregation_source": "direct",
                    }
                )


def strip_comments(data, types):
    """Strip comment lines from a file stream."""
    comment_chars = {"#"}
    if "file" in types and "comment" in types["file"]:
        comment_chars.update(set(types["file"]["comment"]))
    for row in data:
        if row[0] in comment_chars:
            continue
        yield row


def process_names_file(types, names_file, *, value_path=None):
    """Process a taxon names file."""
    data = tofile.open_file_handle(names_file)
    names = defaultdict(dict)
    if data is None:
        return names
    delimiters = {"csv": ",", "tsv": "\t"}
    rows = csv.reader(
        strip_comments(data, types),
        delimiter=delimiters[types["file"]["format"]],
        quotechar='"',
    )
    if value_path and isinstance(value_path, dict):
        for row in rows:
            for group, keys in value_path.items():
                if not isinstance(keys, list):
                    keys = [keys]
                for key in keys:
                    if key not in names[group]:
                        names[group][key] = {row[0]: row[1]}
                    else:
                        names[group][key][row[0]] = row[1]
    else:
        next(rows)
        for row in rows:
            name = row[3] if len(row) > 3 else row[1]
            names[row[2]][row[1]] = {"name": name, "taxon_id": row[0]}
    return names


def set_xrefs(taxon_names, types, row, *, meta=None):
    """Set xrefs for taxon_names."""
    if meta is None:
        meta = {}
    names = []
    for taxon in taxon_names:
        if "xref" in types[taxon["class"]] and types[taxon["class"]]["xref"]:
            if "source" in meta:
                taxon.update({"source": meta["source"]})
            if "source_url_stub" in meta:
                taxon.update({"source_url_stub": meta["source_url_stub"]})
        names.append(taxon)
    return names


def set_row_defaults(types, data):
    """Set default values for a row."""
    for key in types["defaults"].keys():
        if key in types:
            for entry in types[key].values():
                if not isinstance(entry, dict):
                    entry = {"default": entry}
                entry = {
                    **types["defaults"][key],
                    **entry,
                }
        elif key == "metadata":
            data["metadata"] = {**types["defaults"]["metadata"]}


def process_row_values(row, types, data):
    """Process row values."""
    for group in data.keys():
        if group in types:
            for key, meta in types[group].items():
                if not isinstance(meta, dict):
                    data[group][key] = meta
                    continue
                if "index" not in meta:
                    if "default" in meta:
                        data[group][key] = meta["default"]
                    continue
                try:
                    if isinstance(meta["index"], list):
                        char = meta.get("join", "")
                        values = [row[i] for i in meta["index"]]
                        if all(values):
                            value = char.join(values)
                        else:
                            continue
                    else:
                        value = row[meta["index"]]
                    if "separator" in meta and any(
                        sep in value for sep in meta["separator"]
                    ):
                        separator = "|".join(
                            [re.escape(sep) for sep in meta["separator"]]
                        )
                        data[group][key] = re.split(rf"\s*{separator}\s*", value)
                        if "limit" in meta:
                            data[group][key] = data[group][key][: meta["limit"]]
                    elif value is not None and value != "None":
                        data[group][key] = value
                except IndexError:
                    LOGGER.warning(f"Missing fields in row '{str(row)}'")
                    return None
                except Exception as err:
                    LOGGER.warning(f"Cannot parse row '{str(row)}'")
                    raise err
    return True


def process_taxon_names(data, types, row, names):
    """Process taxon names."""
    if data["taxon_names"]:
        data["taxon_names"] = set_xrefs(
            data["taxon_names"], types["taxon_names"], row, meta=data["metadata"]
        )
    if data["taxonomy"] and names:
        for key in names.keys():
            if key in data["taxonomy"] and data["taxonomy"][key] in names[key]:
                data["taxonomy"]["_taxon_id"] = names[key][data["taxonomy"][key]][
                    "taxon_id"
                ]
                data["taxonomy"][key] = names[key][data["taxonomy"][key]]["name"]


def process_features(data):
    """Move feature properties to top level."""
    if data["features"]:
        for entry in data["features"]:
            data[entry["class"]] = entry["identifier"]
        del data["features"]


def contains_excluded_value(data, exclusions):
    """Check whether row data matches an excluded value."""
    for key in exclusions.keys():
        for subkey in exclusions[key].keys():
            if str(data.get(key, {}).get(subkey, "")) in exclusions[key][subkey]:
                return True


def process_row(
    types, names, row, shared_values, blanks, *, index_type="assembly", exclusions=None
):
    """Process a row of data."""
    data = {
        "attributes": {},
        "features": {},
        "identifiers": {},
        "metadata": {},
        "taxon_names": {},
        "taxonomy": {},
        "taxon_attributes": {},
    }
    set_row_defaults(types, data)
    if process_row_values(row, types, data) is None:
        return None, None, None
    if exclusions is None:
        exclusions = defaultdict(dict)
    if contains_excluded_value(data, exclusions):
        return None, None, None
    taxon_data = {}
    taxon_types = {}
    if "is_primary_value" in data["metadata"]:
        try:
            data["metadata"]["is_primary_value"] = bool(
                int(data["metadata"]["is_primary_value"])
            )
        except ValueError:
            data["metadata"]["is_primary_value"] = False
    row_id = None
    if (
        "identifiers" in data
        and data["identifiers"]
        and f"{index_type}_id" in data["identifiers"]
        and data["identifiers"][f"{index_type}_id"]
    ):
        row_id = data["identifiers"][f"{index_type}_id"]
    row_values = {}
    for attr_type in ["attributes", "features", "identifiers", "taxon_names"]:
        if attr_type in data and data[attr_type]:
            (
                data[attr_type],
                taxon_data[attr_type],
                taxon_types[attr_type],
            ) = add_attributes(
                data[attr_type],
                types[attr_type],
                attr_type=attr_type,
                meta=data["metadata"],
                shared_values=shared_values,
                row_values=row_values,
                blanks=blanks,
            )
        else:
            data[attr_type] = []
    if row_id is not None and "attributes" in taxon_data and taxon_data["attributes"]:
        for attr in taxon_data["attributes"]:
            attr.update(
                {
                    "source_index": index_type,
                    "source_id": row_id,
                }
            )
    process_taxon_names(data, types, row, names)
    process_features(data)
    return data, taxon_data, taxon_types.get("attributes", {})


def find_index_for_header(header, headers, duplicate_headers):
    """Lookup column index for a single header."""
    index = headers.get(header, None)
    if index is not None:
        if header in duplicate_headers:
            LOGGER.error(
                "Duplicate header '%s' in columns %s",
                header,
                " and ".join([str(idx) for idx in duplicate_headers[header]]),
            )
            sys.exit(1)
        return index
    else:
        LOGGER.error("Unable to find %s in file headers", header)
        sys.exit(1)


def set_column_indices(types, header):
    """Use header to set indices for named columns."""
    headers = {}
    duplicate_headers = defaultdict(set)
    for index, title in enumerate(header):
        if title in headers:
            duplicate_headers[title].update([headers[title], index])
        headers[title] = index
    headers = {title: index for index, title in enumerate(header)}
    for entries in types.values():
        for value in entries.values():
            if isinstance(value, dict) and "header" in value:
                if isinstance(value["header"], list):
                    # convert list of headers to list of indices
                    value.update(
                        {
                            "index": [
                                find_index_for_header(head, headers, duplicate_headers)
                                for head in value["header"]
                            ]
                        }
                    )
                else:
                    value.update(
                        {
                            "index": find_index_for_header(
                                value["header"], headers, duplicate_headers
                            )
                        }
                    )


def write_imported_rows(rows, opts, *, types, header=None, label="imported"):
    """Write imported rows to processed file."""
    file_key = f'{opts["index"]}-exception'
    dir_key = f'{opts["index"]}-dir'
    if file_key in opts and opts[file_key]:
        outdir = opts[file_key]
    else:
        outdir = f"{opts[dir_key]}/{label}"
    os.makedirs(outdir, exist_ok=True)
    outfile = f'{outdir}/{types["file"]["name"]}'
    data = []
    header_len = 0
    if header is not None:
        data.append(header)
        header_len = 1
    if isinstance(rows, dict):
        for row_set in rows.values():
            data.extend(iter(row_set))
    else:
        data.extend(iter(rows))
    LOGGER.info(
        "Writing %d records to %s file '%s'", len(data) - header_len, label, outfile
    )
    tofile.write_file(outfile, data)


def write_spellchecked_taxa(spellings, opts, *, types):
    """Write spellchecked taxa to file."""
    dir_key = f'{opts["index"]}-dir'
    filepath = Path(types["file"]["name"])
    extensions = "".join(filepath.suffixes)
    file_basename = str(filepath).replace(extensions, "")
    dirs = {
        "spellcheck": "exceptions",
        "synonym": "imported",
    }
    for group in dirs.keys():
        for group in dirs.keys():
            taxa = []
            for name, obj in spellings[group].items():
                taxa.append([obj["taxon_id"], name, obj["rank"]] + obj["matches"])
            if taxa:
                outdir = f"{opts[dir_key]}/{dirs[group]}"
                os.makedirs(outdir, exist_ok=True)
                outfile = f"{outdir}/{file_basename}.spellcheck.tsv"
                LOGGER.info(
                    "Writing %d %s suggestions to spellcheck file '%s'",
                    len(taxa),
                    group,
                    outfile,
                )
                tofile.write_file(
                    outfile, [["taxon_id", "input", "rank", "suggested"]] + taxa
                )


def write_imported_taxa(taxa, opts, *, types):
    """Write imported taxa to file."""
    imported = []
    file_key = f'{opts["index"]}-exception'
    dir_key = f'{opts["index"]}-dir'
    filepath = Path(types["file"]["name"])
    extensions = "".join(filepath.suffixes)
    file_basename = str(filepath).replace(extensions, "")
    for name, arr in taxa.items():
        prefix = "#" if len(arr) > 1 else ""
        for obj in arr:
            if obj.get("additional_taxon", False):
                prefix = "#"
            imported.append([f'{prefix}{str(obj["taxon_id"])}', name, obj["rank"]])
    if imported:
        if file_key in opts and opts[file_key]:
            outdir = opts[file_key]
        else:
            outdir = f"{opts[dir_key]}/imported"
        os.makedirs(outdir, exist_ok=True)
        outfile = f"{outdir}/{file_basename}.taxon_ids.tsv"
        LOGGER.info(
            "Writing %d taxon_ids to imported file '%s'",
            len(imported),
            outfile,
        )
        tofile.write_file(outfile, [["taxon_id", "input", "rank"]] + imported)


def do_replace(item, arr):
    """Recursively replace all instances of query string."""
    if isinstance(item, dict):
        matched_keys = {}
        for key, value in item.items():
            item[key] = do_replace(value, arr)
            matched_keys[key] = do_replace(key, arr)
        for key, new_key in matched_keys.items():
            if new_key != key:
                item[new_key] = item[key]
                del item[key]
    elif isinstance(item, list):
        item = [do_replace(value, arr) for value in item]
    elif isinstance(item, str):
        for (query, replace) in arr:
            new_item = item.replace(query, str(replace))
            if new_item != item:
                item = new_item
    return item


def deep_replace(obj, arr):
    """Replace all instances of each query string in obj."""
    new_obj = deepcopy(obj)
    new_obj = do_replace(new_obj, arr)
    return new_obj
