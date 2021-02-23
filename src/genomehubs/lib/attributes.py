#!/usr/bin/env python3

"""Taxon methods."""

from tolkein import tolog

from .es_functions import index_stream
from .es_functions import load_mapping
from .es_functions import stream_template_search_results
from .hub import index_templator

LOGGER = tolog.logger(__name__)


def index_template(opts):
    """Index template (includes name, mapping and types)."""
    parts = ["attributes", opts["hub-name"], opts["hub-version"]]
    template = index_templator(parts, opts)
    return template


def stream_attributes(group, attributes):
    """Stream attributes for indexing."""
    for name, obj in attributes.items():
        ret = {"group": group, "name": name}
        for prop, value in obj.items():
            if not prop.startswith("taxon_"):
                ret.update({prop: value})
        yield "attribute-%s-%s" % (group, name), ret


def index(es, group, attributes, opts):
    """Index a set of attributes."""
    LOGGER.info("Indexing attributes")
    template = index_template(opts)
    stream = stream_attributes(group, attributes)
    return template, stream


def index_types(es, types_name, types, opts):
    """Index types into Elasticsearch."""
    if "attributes" not in types:
        return
    if "defaults" in types:
        for key, value in types["attributes"].items():
            value = {**types["defaults"]["attributes"], **value}
            types["attributes"][key] = value
    template, stream = index(es, types_name, types["attributes"], opts)
    load_mapping(es, template["name"], template["mapping"])
    index_stream(es, template["index_name"], stream)


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
