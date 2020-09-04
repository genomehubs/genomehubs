#!/usr/bin/env python3

"""
Fill attribute values.

Usage:
    genomehubs fill [--hub-name STRING] [--hub-path PATH] [--hub-version PATH]
                    [--config-file PATH...] [--config-save PATH]
                    [--es-host URL...] [--es-url URL]
                    [--traverse-infer-ancestors] [--traverse-infer-descendants]
                    [--traverse-infer-both]
                    [--traverse-root STRING] [--traverse-weight STRING]
                    [-h|--help] [-v|--version]

Options:
    --hub-name STRING             GenomeHubs instance name.
    --hub-path PATH               GenomeHubs instance root directory path.
    --hub-version STR             GenomeHubs instance version string.
    --config-file PATH            Path to YAML file containing configuration options.
    --config-save PATH            Path to write configuration options to YAML file.
    --es-host URL                 ElasticSearch hostname/URL and port.
    --es-url URL                  Remote URL to fetch ElasticSearch code.
    --traverse-infer-ancestors    Flag to enable tree traversal from tips to root.
    --traverse-infer-descendants  Flag to enable tree traversal from root to tips.
    --traverse-infer-both         Flag to enable tree traversal from tips to root and
                                  back to tips.
    --traverse-root ID            Root taxon id for tree traversal.
    --traverse-weight STRING      Weighting scheme for setting values during tree
                                  traversal.
    -h, --help                    Show this
    -v, --version                 Show version number

Examples:
    # 1. Traverse tree up to taxon_id 7088
    ./genomehubs fill --traverse-root 7088
"""

import math
import sys
from collections import defaultdict
from statistics import mean
from statistics import median
from statistics import median_high
from statistics import median_low
from statistics import mode

from docopt import docopt
from tolkein import tolog

from ..lib import es_functions
from ..lib import hub
from ..lib import taxon
from .config import config
from .version import __version__

LOGGER = tolog.logger(__name__)


def get_max_depth(es, *, index):
    """Find max depth of root lineage."""
    body = {
        "id": "max_nested_value",
        "params": {"path": "lineage", "field": "node_depth"},
    }
    res = es.search_template(index=index, body=body)
    max_depth = res["aggregations"]["depths"]["max_depth"]["value"]
    return max_depth


def get_max_depth_by_lineage(es, *, index, root):
    """Find max depth of specified root lineage."""
    body = {
        "id": "max_nested_value_by_key_value",
        "params": {
            "path": "lineage",
            "key": "taxon_id",
            "value": root,
            "field": "node_depth",
        },
    }
    res = es.search_template(index=index, body=body)
    max_depth = res["aggregations"]["depths"]["root"]["max_depth"]["value"]
    return max_depth


def stream_template_search_results(es, *, index, body, size=10):
    """Stream results of a template search."""
    body["params"].update({"size": size})
    res = es.search_template(
        index=index, body=body, rest_total_hits_as_int=True, scroll="1m"
    )
    scroll_id = res["_scroll_id"]
    count = res["hits"]["total"]
    for hit in res["hits"]["hits"]:
        yield hit
    offset = size
    while offset < count:
        res = es.scroll(rest_total_hits_as_int=True, scroll="1m", scroll_id=scroll_id)
        for hit in res["hits"]["hits"]:
            yield hit
        offset += size
    es.clear_scroll(scroll_id=scroll_id)


def stream_nodes_by_root_depth(es, *, index, root, depth, size=10):
    """Get entries by depth of root taxon."""
    if depth > 0:
        body = {
            "id": "taxon_attributes_by_root_depth",
            "params": {"taxon_id": root, "depth": depth},
        }
        return stream_template_search_results(es, index=index, body=body, size=size)
    body = {
        "id": "taxon_attributes_by_taxon_id",
        "params": {"taxon_id": root},
    }
    return stream_template_search_results(es, index=index, body=body)


def stream_descendant_nodes_missing_attributes(es, *, index, attributes, root, size=10):
    """Get entries descended from root that lack one or more attributes."""
    id_list = set()
    for attribute in attributes:
        body = {
            "id": "taxon_missing_attribute_by_ancestor_id",
            "params": {"taxon_id": root, "attribute": attribute["key"]},
        }
        for result in stream_template_search_results(
            es, index=index, body=body, size=size
        ):
            if result["_id"] not in id_list:
                yield result


def summarise_attribute_values(attribute, meta, *, values=None):
    """Calculate a single summary value for an attribute."""
    if values is None and "values" not in attribute:
        return
    summaries = {
        "count": len,
        "max": max,
        "min": min,
        "mean": mean,
        "median": median,
        "median_high": median_high,
        "median_low": median_low,
        "mode": mode,
        "most_common": mode,
        "list": list,
    }
    if "summary" in meta:
        value_type = "%s_value" % meta["type"]
        if "values" in attribute:
            if values is None:
                values = [value[value_type] for value in attribute["values"]]
            else:
                values += [value[value_type] for value in attribute["values"]]
        if not values:
            return None
        idx = 0
        traverse = meta.get("traverse", False)
        traverse_value = None
        if not isinstance(meta["summary"], list):
            meta["summary"] = [meta["summary"]]
        for summary in meta["summary"]:
            value = summaries[summary](values)
            if idx == 0:
                attribute[value_type] = value
                attribute["count"] = len(values)
                attribute["aggregation_method"] = summary
                attribute["aggregation_source"] = "direct"
            if traverse and summary == traverse:
                traverse_value = value
            if summary != "list":
                if summary.startswith("median"):
                    summary = "median"
                attribute[summary] = value
            elif traverse_value:
                traverse_value = list(set(traverse_value))
            idx += 1
        return traverse_value
    return None


def summarise_attributes(*, attributes, attrs, meta, parent, parents):
    """Set attribute summary values."""
    changed = False
    for node_attribute in attributes:
        if node_attribute["key"] in attrs:
            summary_value = summarise_attribute_values(
                node_attribute, meta[node_attribute["key"]]
            )
            if summary_value is not None:
                changed = True
                if parent is not None:
                    if isinstance(summary_value, list):
                        parents[parent][node_attribute["key"]] += summary_value
                    else:
                        parents[parent][node_attribute["key"]].append(summary_value)
    return changed


def set_values_from_descendants(
    *, attributes, descendant_values, meta, parent, parents
):
    """Set attribute summary values from descendant values."""
    changed = False
    for key, values in descendant_values.items():
        try:
            attribute = next(entry for entry in attributes if entry["key"] == key)
        except StopIteration:
            attribute = {"key": key}
            attributes.append(attribute)
        summary_value = summarise_attribute_values(
            attribute, meta[key], values=descendant_values[key],
        )
        if summary_value is not None:
            attribute["aggregation_source"] = "descendant"
            changed = True
            if parent is not None:
                if isinstance(summary_value, list):
                    parents[parent][key] += summary_value
                else:
                    parents[parent][key].append(summary_value)
    return changed


def traverse_from_tips(es, opts, *, template):
    """Traverse a tree, filling in values."""
    root = opts["traverse-root"]
    max_depth = get_max_depth_by_lineage(es, index=template["index_name"], root=root,)
    root_depth = max_depth
    meta = template["types"]["attributes"]
    attrs = set(meta.keys())
    parents = defaultdict(lambda: defaultdict(list))
    while root_depth >= 0:
        nodes = stream_nodes_by_root_depth(
            es, index=template["index_name"], root=root, depth=root_depth, size=50,
        )
        ctr = 0
        for node in nodes:
            ctr += 1
            changed = False
            if "attributes" in node["_source"]:
                changed = summarise_attributes(
                    attributes=node["_source"]["attributes"],
                    attrs=attrs,
                    meta=meta,
                    parent=node["_source"].get("parent", None),
                    parents=parents,
                )
            if node["_source"]["taxon_id"] in parents:
                if "attributes" not in node["_source"]:
                    node["_source"]["attributes"] = []
                changed = set_values_from_descendants(
                    attributes=node["_source"]["attributes"],
                    descendant_values=parents[node["_source"]["taxon_id"]],
                    meta=meta,
                    parent=node["_source"].get("parent", None),
                    parents=parents,
                )
            if changed:
                yield node["_id"], node["_source"]
        root_depth -= 1


def copy_attribute_summary(source, meta):
    """Copy an attribute summary, removing values."""
    dest = {}
    for key in meta["summary"]:
        if key.startswith("median"):
            dest["median"] = source["median"]
        elif key != "list":
            dest[key] = source[key]
    dest["%s_value" % meta["type"]] = source["%s_value" % meta["type"]]
    dest["count"] = source["count"]
    dest["key"] = source["key"]
    return dest


def stream_missing_attributes_at_level(es, *, nodes, attrs, template, level=1):
    """Stream all descendant nodes with missing attributes."""
    for node in nodes:
        taxon_id = node["_source"]["taxon_id"]
        fill_attrs = []
        if "attributes" in node["_source"]:
            for attribute in node["_source"]["attributes"]:
                if attribute["key"] in attrs:
                    fill_attrs.append(attribute)
        if not fill_attrs:
            continue
        meta = template["types"]["attributes"]
        desc_nodes = stream_descendant_nodes_missing_attributes(
            es,
            index=template["index_name"],
            attributes=fill_attrs,
            root=taxon_id,
            size=50,
        )
        anc_attributes = {attr["key"]: attr for attr in fill_attrs}
        for desc_node in desc_nodes:
            skip_attrs = set()
            if "attributes" in desc_node["_source"]:
                for desc_attribute in desc_node["_source"]["attributes"]:
                    if desc_attribute["key"] in anc_attributes:
                        skip_attrs.add(desc_attribute["key"])
            else:
                desc_node["_source"]["attributes"] = []
            for key, anc_attribute in anc_attributes.items():
                if key not in skip_attrs:
                    desc_attribute = copy_attribute_summary(anc_attribute, meta[key])
                    desc_attribute["aggregation_method"] = meta[key]["traverse"]
                    desc_attribute["aggregation_source"] = "ancestor"
                    desc_node["_source"]["attributes"].append(desc_attribute)
            yield desc_node["_id"], desc_node["_source"]


def traverse_from_root(es, opts, *, template):
    """Traverse a tree, filling in values."""
    root = opts["traverse-root"]
    max_depth = get_max_depth_by_lineage(es, index=template["index_name"], root=root,)
    root_depth = max_depth - 1
    meta = template["types"]["attributes"]
    attrs = set(
        {
            key
            for key, value in meta.items()
            if "traverse" in value and value["traverse"]
        }
    )
    # parents = defaultdict(lambda: defaultdict(list))
    while root_depth >= 0:
        LOGGER.info("Filling values at root depth %d" % root_depth)
        nodes = stream_nodes_by_root_depth(
            es, index=template["index_name"], root=root, depth=root_depth, size=50,
        )
        desc_nodes = stream_missing_attributes_at_level(
            es, nodes=nodes, attrs=attrs, template=template
        )
        es_functions.index_stream(
            es, template["index_name"], desc_nodes, _op_type="update",
        )
        root_depth -= 1


def main(args):
    """Initialise genomehubs."""
    options = config("fill", **args)
    if "traverse-infer-both" in options["fill"]:
        options["fill"]["traverse-infer-ancestors"] = True
        options["fill"]["traverse-infer-descendants"] = True

    # Start Elasticsearch
    es = es_functions.launch_es(options["fill"])

    # Post search scripts
    hub.post_search_scripts(es)

    LOGGER.info("Filling values")

    if "taxonomy-source" in options["fill"]:
        for taxonomy_name in options["fill"]["taxonomy-source"]:
            template = taxon.index_template(taxonomy_name, options["fill"])
            if "traverse-root" in options["fill"]:
                if "traverse-infer-ancestors" in options["fill"]:
                    LOGGER.info("Inferring ancestral values")
                    es_functions.index_stream(
                        es,
                        template["index_name"],
                        traverse_from_tips(es, options["fill"], template=template),
                        _op_type="update",
                    )
                if "traverse-infer-descendants" in options["fill"]:
                    LOGGER.info("Inferring descendant values")
                    traverse_from_root(es, options["fill"], template=template)


def cli():
    """Entry point."""
    if len(sys.argv) == sys.argv.index(__name__.split(".")[-1]) + 1:
        args = docopt(__doc__, argv=[])
    else:
        args = docopt(__doc__, version=__version__)
    main(args)


if __name__ == "__main__":
    cli()
