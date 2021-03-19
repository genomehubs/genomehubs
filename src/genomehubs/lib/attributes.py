#!/usr/bin/env python3

"""Taxon methods."""

from tolkein import tolog

from .es_functions import index_stream
from .es_functions import load_mapping
from .es_functions import stream_template_search_results
from .hub import index_templator

LOGGER = tolog.logger(__name__)


def index_template(opts, *, index_type="attribute"):
    """Index template (includes name, mapping and types)."""
    parts = ["%ss" % index_type, opts["hub-name"], opts["hub-version"]]
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


def index_types(es, types_name, types, opts):
    """Index types into Elasticsearch."""
    if "attributes" in types:
        if "defaults" in types and "attributes" in types["defaults"]:
            for key, value in types["attributes"].items():
                value = {**types["defaults"]["attributes"], **value}
                types["attributes"][key] = value
        template, stream = index(
            es, types_name, types["attributes"], opts, index_type="attribute"
        )
        load_mapping(es, template["name"], template["mapping"])
        index_stream(es, template["index_name"], stream)
    if "taxon_names" in types:
        if "defaults" in types and "taxon_names" in types["defaults"]:
            for key, value in types["names"].items():
                value = {
                    **types["defaults"]["taxon_names"],
                    **value,
                }
                types["taxon_names"][key] = value
        template, stream = index(
            es, types_name, types["taxon_names"], opts, index_type="identifier"
        )
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
