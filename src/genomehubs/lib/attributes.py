#!/usr/bin/env python3

"""Taxon methods."""

import sys

from tolkein import tolog

from .es_functions import index_stream
from .es_functions import load_mapping
from .es_functions import stream_template_search_results
from .hub import index_templator

# from time import sleep


LOGGER = tolog.logger(__name__)


def index_template(opts, *, index_type="attribute"):
    """Index template (includes name, mapping and types)."""
    taxonomy_source = opts.get("taxonomy-source", None)
    if taxonomy_source is None:
        LOGGER.error("taxonomy-source is not defined")
        sys.exit(1)
    parts = [
        "%ss" % index_type,
        taxonomy_source,
        opts["hub-name"],
        opts["hub-version"],
    ]
    template = index_templator(parts, opts)
    return template


def stream_attributes(group, attributes, *, index_type="attribute"):
    """Stream attributes for indexing."""
    for name, obj in attributes.items():
        ret = {"group": group, "name": name}
        for prop, value in obj.items():
            if not prop.startswith("taxon_"):
                ret.update({prop: value})
        yield "%s-%s-%s" % (index_type, group, name), ret


def index(es, group, attributes, opts, *, index_type="attribute"):
    """Index a set of attributes or names."""
    LOGGER.info("Indexing %s" % index_type)
    template = index_template(opts, index_type=index_type)
    stream = stream_attributes(group, attributes, index_type=index_type)
    return template, stream


# def fetch_types(es, opts):
#     """Fetch all existing types."""
#     template = index_template(opts, index_type="attribute")
#     body = {
#         "id": "attribute_types",
#         "params": {},
#     }
#     entries = stream_template_search_results(
#         es, index=template["index_name"], body=body
#     )
#     return {entry["key"]: entry for entry in entries}


def add_attribute_sources(name, obj, attributes):
    """Generate a list of attribute sources."""
    for key, value in attributes[name].items():
        if key.startswith("source"):
            if key in obj:
                if not isinstance(obj[key], list):
                    obj[key] = [obj[key]]
                if isinstance(value, list):
                    obj[key] += value
                else:
                    obj[key].append(value)
            else:
                obj[key] = value


def index_types(es, types_name, types, opts, *, dry_run=False):
    """Index types into Elasticsearch."""
    # TODO: fetch existing types to allow new sources to add, not overwrite
    try:
        attributes = fetch_types(es, types_name, opts)
    except Exception:
        attributes = {}
    if "attributes" in types:
        new_attributes = {}
        for key, value in types["attributes"].items():
            if "defaults" in types and "attributes" in types["defaults"]:
                value = {**types["defaults"]["attributes"], **value}
            if key in attributes:
                types["attributes"][key] = {
                    **attributes[key],
                    **value,
                }
            else:
                new_attributes[key] = {**value}
                new_attributes[key].pop("header", None)
                new_attributes[key].pop("index", None)
        if new_attributes:
            template, stream = index(
                es, types_name, new_attributes, opts, index_type="attribute"
            )
            load_mapping(es, template["name"], template["mapping"])
            index_stream(es, template["index_name"], stream, dry_run=dry_run)
    if "taxon_names" in types:
        if "defaults" in types and "taxon_names" in types["defaults"]:
            for key, value in types["taxon_names"].items():
                value = {
                    **types["defaults"]["taxon_names"],
                    **value,
                }
                types["taxon_names"][key] = value
        template, stream = index(
            es, types_name, types["taxon_names"], opts, index_type="identifier"
        )
        load_mapping(es, template["name"], template["mapping"])
        index_stream(es, template["index_name"], stream, dry_run=dry_run)
    return types


def fetch_types(es, types_name, opts):
    """Fetch types from Elasticsearch."""
    template = index_template(opts)
    body = {"id": "attribute_types_by_group", "params": {"group": types_name}}
    types = {}
    for result in stream_template_search_results(
        es, index=template["index_name"], body=body, size=50
    ):
        source = result["_source"]
        name = source["name"]
        del source["name"]
        del source["group"]
        types[name] = source
    return types
