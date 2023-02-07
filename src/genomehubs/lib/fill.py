#!/usr/bin/env python3

"""
Fill attribute values.

Usage:
    genomehubs fill [--hub-name STRING] [--hub-path PATH] [--hub-version PATH]
                    [--config-file PATH...] [--config-save PATH]
                    [--es-host URL...]  [--taxonomy-source STRING]
                    [--traverse-limit STRING]
                    [--traverse-infer-ancestors] [--traverse-infer-descendants]
                    [--traverse-infer-both] [--traverse-threads INT]
                    [--traverse-depth INT] [--traverse-root STRING]
                    [--traverse-weight STRING]
                    [-h|--help] [-v|--version]

Options:
    --hub-name STRING             GenomeHubs instance name.
    --hub-path PATH               GenomeHubs instance root directory path.
    --hub-version STR             GenomeHubs instance version string.
    --config-file PATH            Path to YAML file containing configuration options.
    --config-save PATH            Path to write configuration options to YAML file.
    --es-host URL                 ElasticSearch hostname/URL and port.
    --taxonomy-source STRING      Name of taxonomy to use (ncbi or ott).
    --traverse-depth INT          Maximum depth for tree traversal relative to root taxon.
    --traverse-infer-ancestors    Flag to enable tree traversal from tips to root.
    --traverse-infer-descendants  Flag to enable tree traversal from root to tips.
    --traverse-infer-both         Flag to enable tree traversal from tips to root and
                                  back to tips.
    --traverse-limit STRING       Maximum rank to ascend to during traversal. [Default: null]
    --traverse-root ID            Root taxon id for tree traversal.
    --traverse-threads INT        Number of threads to use for tree traversal. [Default: 1]
    --traverse-weight STRING      Weighting scheme for setting values during tree
                                  traversal.
    -h, --help                    Show this
    -v, --version                 Show version number

Examples:
    # 1. Traverse tree up to taxon_id 7088
    ./genomehubs fill --traverse-root 7088
"""

import re
import sys
from collections import defaultdict
from datetime import datetime
from itertools import groupby
from multiprocessing import Pool
from statistics import mean
from statistics import median
from statistics import median_high
from statistics import median_low
from statistics import mode
from traceback import format_exc

from docopt import docopt
from tolkein import tolog
from tqdm import tqdm

from ..lib import hub
from ..lib import taxon
from .attributes import fetch_types
from .config import config
from .es_functions import index_stream
from .es_functions import launch_es
from .es_functions import stream_template_search_results
from .version import __version__

LOGGER = tolog.logger(__name__)


def get_max_depth(es, *, index):
    """Find max depth of root lineage."""
    body = {
        "id": "max_nested_value",
        "params": {"path": "lineage", "field": "node_depth"},
    }
    res = es.search_template(index=index, body=body)
    return res["aggregations"]["depths"]["max_depth"]["value"]


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
    return res["aggregations"]["depths"]["root"]["max_depth"]["value"]


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


def enum(tup):
    """Use list index to prioritise values."""
    order = {str(k).lower(): i for i, k in enumerate(tup[0])}
    lowest = len(tup[0]) + 1
    result = None
    for value in tup[1]:
        lc_value = str(value).lower()
        if lc_value in order and order[lc_value] < lowest:
            result = value
            lowest = order[lc_value]
            if lowest == 0:
                break
    return result


def ordered_list(tup):
    """Remove values that are in a higher priority list."""
    (key, order, arr, linked) = tup
    values = deduped_list(arr)
    seen = set()
    for i, k in enumerate(order):
        if i == 0 and k == key:
            break
        if k == key:
            return [value for value in values if value not in seen]
        seen.update(linked[k]["keyword_value"])
    return values


def earliest(arr, *args):
    """Select earliest date from a list."""
    if not isinstance(arr, list):
        arr = [arr]
    if arr and isinstance(arr[0], str):
        date_arr = [datetime.strptime(date, "%Y-%m-%d") for date in arr]
        return datetime.strftime(min(date_arr), "%Y-%m-%d")
    return min(arr + list(args))


def latest(arr, *args):
    """Select earliest date from a list."""
    if not isinstance(arr, list):
        arr = [arr]
    if isinstance(arr[0], str) and re.match(r"\d{4}-\d{2}-\d{2}", arr[0]):
        date_arr = [datetime.strptime(date, "%Y-%m-%d") for date in arr]
        return datetime.strftime(max(date_arr), "%Y-%m-%d")
    return max(arr + list(args))


def range(arr):
    """Calculate difference between max and min values."""
    return latest(arr) - earliest(arr)


def median_list(arr):
    """Return both values in event of tied median."""
    length = len(arr)
    if length % 2 == 1:
        return [median(arr)]
    sorted_arr = sorted(arr, reverse=True)
    return list(set([sorted_arr[int(length / 2)], sorted_arr[int(length / 2) - 1]]))


def mode_list(arr):
    """Return a list of modal values."""
    mode_count = 0
    mode_arr = []
    for key, group in groupby(arr):
        count = len(list(group))
        if count < mode_count:
            continue
        if count > mode_count:
            mode_count = count
            mode_arr = []
        mode_arr.append(key)
    return mode_arr


def mode_high(arr):
    """Calculate mode using median_high to resolve ties."""
    return median_high(mode_list(arr))


def mode_low(arr):
    """Calculate mode using median_low to resolve ties."""
    return median_low(mode_list(arr))


def mode_mean(arr):
    """Calculate mode using mean to resolve ties."""
    return mean(mode_list(arr))


def flatten_list(arr):
    """Flatten a list by expanding any nested lists."""
    flattened = []
    for v in arr:
        if isinstance(v, list):
            flattened += v
        else:
            flattened.append(v)
    return flattened


def deduped_list(arr):
    """Remove duplicate values from a list."""
    return list(set(flatten_list(arr)))


def deduped_list_length(arr):
    """Find number of unique values in a list."""
    return len(deduped_list(arr))


def apply_summary(
    summary,
    values,
    *,
    primary_values=None,
    summary_types=None,
    max_value=None,
    min_value=None,
    order=None,
    attr_order=None,
    meta=None,
    linked_attributes=None,
):
    """Apply summary statistic functions."""
    summaries = {
        "count": len,
        "earliest": earliest,
        "enum": enum,
        "latest": latest,
        "max": latest,
        "min": earliest,
        "mean": mean,
        "median": median,
        "median_high": median_high,
        "median_low": median_low,
        "median_list": median_list,
        "mode": mode,
        "most_common": mode,
        "mode_high": mode_high,
        "mode_low": mode_low,
        "mode_mean": mode_mean,
        "mode_list": mode_list,
        "range": range,
        "sum": sum,
        "list": deduped_list,
        "length": deduped_list_length,
        "ordered_list": ordered_list,
    }
    if summary == "primary":
        if primary_values:
            values = primary_values
        summary = summary_types[0]
    flattened = flatten_list(values)
    if summary == "enum":
        value = summaries[summary]((order, flattened))
    elif summary == "ordered_list":
        value = summaries[summary](
            (meta["key"], attr_order, flattened, linked_attributes)
        )
    else:
        value = summaries[summary](flattened)
    if summary == "max":
        if max_value is not None:
            value = latest(value, max_value)
        max_value = value
    elif summary == "min":
        if min_value is not None:
            value = earliest(value, min_value)
        min_value = value
    return value, max_value, min_value


def set_traverse_values(
    summaries,
    values,
    primary_values,
    count,
    max_value,
    min_value,
    meta,
    attribute,
    value_type,
    traverse,
    source,
    linked_attributes,
):
    """Set values  use for tree traversal."""
    idx = 0
    order = meta.get("constraint", {}).get("enum", [])
    attr_order = meta.get("order", [])
    default_summary = "median"
    if meta["type"] == "keyword":
        default_summary = "mode"
    elif meta["type"] == "date":
        default_summary = "latest"
    for index, summary in enumerate(summaries):
        summary_types = meta["summary"][index + 1 :] + [default_summary]
        value, max_value, min_value = apply_summary(
            summary,
            values,
            primary_values=primary_values,
            summary_types=summary_types,
            max_value=max_value,
            min_value=min_value,
            order=order,
            attr_order=attr_order,
            meta=meta,
            linked_attributes=linked_attributes,
        )
        if idx == 0:
            if value is not None:
                if (
                    value_type not in attribute
                    or attribute["aggregation_method"] != "primary"
                ):
                    if summary == "primary" and "values" not in attribute:
                        summary = summary_types[0]
                    attribute[value_type] = value
                    attribute["count"] = count or len(values)
                    if summary in ["list", "ordered_list"]:
                        attribute["length"] = deduped_list_length(values)
                    attribute["aggregation_method"] = summary
                    attribute["aggregation_source"] = source
                traverse_value = value or []
            idx += 1
        if traverse and source == "descendant" and summary == traverse:
            traverse_value = value or []
        elif summary != "list":
            if summary.startswith("median"):
                summary = "median"
        else:
            traverse_value = list(set(traverse_value))
        if summary == "range":
            attribute[summary] = value
            traverse_value = [min_value, max_value]
    return traverse_value, max_value, min_value


# def iterate_values(attribute, meta):
#     """Iterate through values adding prefixed values if appropriate."""
#     prefixed_values = None
#     if meta["type"] == "keyword":
#         prefixed_values = attribute.get("prefixed_value", [])
#     value_type = "%s_value" % meta["type"]
#     for value in attribute["values"]:
#         if prefixed_values is not None and "source_prefix" in value:
#             prefixed_values.append(
#                 "%s:%s" % (value["source_prefix"], value[value_type])
#             )
#     if prefixed_values:
#         attribute["prefixed_values"] = prefixed_values


def summarise_attribute_values(
    attribute,
    meta,
    *,
    linked_attributes=None,
    values=None,
    count=0,
    max_value=None,
    min_value=None,
    source="direct",
):
    """Calculate a single summary value for an attribute."""
    if values is None and "values" not in attribute:
        return None, None, None
    if "summary" in meta:
        value_type = f'{meta["type"]}_value'
        primary_values = []
        if "values" in attribute:
            # iterate_values(attribute, meta)
            if values is None:
                values = []
                for value in attribute["values"]:
                    values.append(value[value_type])
                    if "is_primary_value" in value and value["is_primary_value"]:
                        primary_values.append(value[value_type])
            else:
                # TODO: handle existing value here
                values += [value[value_type] for value in attribute["values"]]
        if not values:
            return None, None, None
        traverse = meta.get("traverse", False)
        traverse_value = None
        if not isinstance(meta["summary"], list):
            meta["summary"] = [meta["summary"]]
        try:
            summaries = meta["summary"][:]
            if traverse and source != "ancestor" and summaries[0] != traverse:
                if summaries[0] != "primary":
                    summaries = [traverse] + summaries
                elif summaries[1] != "primary":
                    summaries.insert(1, traverse)
            traverse_value, max_value, min_value = set_traverse_values(
                summaries,
                values,
                primary_values,
                count,
                max_value,
                min_value,
                meta,
                attribute,
                value_type,
                traverse,
                source,
                linked_attributes,
            )
        except Exception:
            print(format_exc())
            LOGGER.error(
                f"Unable to generate summary values for attribute {meta['key']}"
            )
            sys.exit(1)
        if isinstance(max_value, (float, int)):
            attribute["max"] = max_value
            attribute["min"] = min_value
        elif meta["type"] == "date" and max_value and min_value:
            attribute["from"] = min_value
            attribute["to"] = max_value
        return traverse_value, max_value, min_value
    return None, None, None


def summarise_attributes(*, attributes, attrs, meta, parent, parents):
    """Set attribute summary values."""
    changed = False
    attr_dict = {}
    for node_attribute in attributes:
        if node_attribute["key"] in attrs:
            attr_dict[node_attribute["key"]] = node_attribute
            linked_attributes = {}
            if "order" in meta[node_attribute["key"]]:
                for attribute in attributes:
                    if attribute["key"] in meta[node_attribute["key"]]["order"]:
                        linked_attributes[attribute["key"]] = attribute
            summary_value, max_value, min_value = summarise_attribute_values(
                node_attribute,
                {"key": node_attribute["key"], **meta[node_attribute["key"]]},
                linked_attributes=linked_attributes,
            )
            if summary_value is not None:
                changed = True
                if parent is not None:
                    parents[parent][node_attribute["key"]]["count"] += 1
                    if isinstance(summary_value, list):
                        parents[parent][node_attribute["key"]][
                            "values"
                        ] += summary_value
                    else:
                        parents[parent][node_attribute["key"]]["values"].append(
                            summary_value
                        )
                    if max_value is not None:
                        if parents[parent][node_attribute["key"]]["max"] is not None:
                            parents[parent][node_attribute["key"]]["max"] = latest(
                                parents[parent][node_attribute["key"]]["max"], max_value
                            )
                        else:
                            parents[parent][node_attribute["key"]]["max"] = max_value
                    if min_value is not None:
                        if parents[parent][node_attribute["key"]]["min"] is not None:
                            parents[parent][node_attribute["key"]]["min"] = earliest(
                                parents[parent][node_attribute["key"]]["min"], min_value
                            )
                        else:
                            parents[parent][node_attribute["key"]]["min"] = min_value
    return changed, attr_dict


def set_aggregation_source(attribute, source=None):
    """Set attribute aggregation source."""
    if "aggregation_source" not in attribute:
        return_value = "descendant"
    else:
        return_value = attribute["aggregation_source"]
    if source is not None:
        if "aggregation_source" not in attribute:
            attribute["aggregation_source"] = source
        elif attribute["aggregation_source"] == "direct":
            attribute["aggregation_source"] = ["direct", source]
    return return_value


def set_values_from_descendants(
    *,
    attributes,
    descendant_values,
    meta,
    taxon_id,
    parent,
    taxon_rank,
    traverse_limit,
    parents,
    descendant_ranks=None,
    attr_dict=None,
    limits=None,
):
    """Set attribute summary values from descendant values."""
    changed = False
    if attr_dict is None:
        attr_dict = {}
    for key, obj in descendant_values.items():
        traverseable = meta[key].get("traverse", False)
        if (
            traverseable
            and "traverse_direction" in meta[key]
            and meta[key]["traverse_direction"] == "down"
        ):
            traverseable = False
        if not traverseable or taxon_id in limits[key]:
            continue
        if local_limit := meta[key].get("traverse_limit", traverse_limit):
            if (
                descendant_ranks is not None
                and local_limit in descendant_ranks[taxon_id]
            ):
                continue
            if taxon_rank == local_limit:
                limits[key].add(parent)
        try:
            attribute = next(entry for entry in attributes if entry["key"] == key)
        except StopIteration:
            attribute = {"key": key}
            attributes.append(attribute)
        linked_attributes = {}
        if "order" in meta[key]:
            for attribute in attributes:
                if attribute["key"] in meta[key]["order"]:
                    linked_attributes[attribute["key"]] = attribute
        summary_value, max_value, min_value = summarise_attribute_values(
            attribute,
            {"key": key, **meta[key]},
            values=obj["values"],
            count=obj["count"],
            max_value=obj["max"],
            min_value=obj["min"],
            source=set_aggregation_source(attribute),
            linked_attributes=linked_attributes,
        )
        set_aggregation_source(attribute, "descendant")

        if summary_value is not None:
            changed = True
            attr_dict.update({key: attribute})
            if parent is not None:
                parents[parent][key]["count"] += 1
                if isinstance(summary_value, list):
                    parents[parent][key]["values"] = list(
                        set(parents[parent][key]["values"] + summary_value)
                    )
                else:
                    parents[parent][key]["values"].append(summary_value)
                if max_value is not None:
                    if parents[parent][key]["max"] is not None:
                        parents[parent][key]["max"] = latest(
                            parents[parent][key]["max"], max_value
                        )
                    else:
                        parents[parent][key]["max"] = max_value
                if min_value is not None:
                    if parents[parent][key]["min"] is not None:
                        parents[parent][key]["min"] = earliest(
                            parents[parent][key]["min"], min_value
                        )
                    else:
                        parents[parent][key]["min"] = min_value
    return changed, attr_dict


def set_attributes_to_descend(meta, traverse_limit):
    """Set which attributes should have values inferred from ancestral taxa."""
    desc_attrs = set()
    desc_attr_limits = {}
    for key, value in meta.items():
        if (
            "traverse" in value
            and value["traverse"]
            and (
                "traverse_direction" not in value
                or value["traverse_direction"]
                in (
                    "down",
                    "both",
                )
            )
        ):
            desc_attrs.add(key)
            if "traverse_limit" in value:
                desc_attr_limits[key] = value["traverse_limit"]
            elif traverse_limit != "null":
                desc_attr_limits[key] = traverse_limit
    return desc_attrs, desc_attr_limits


def track_missing_attribute_values(
    node, missing_attributes, attr_dict, desc_attrs, desc_attr_limits
):
    """Keep track of missing attribute values for in memory traversal."""
    missing_from_descendants = {}
    if (
        node["_source"]["taxon_id"] in missing_attributes
        and missing_attributes[node["_source"]["taxon_id"]]
    ):
        for child_id, obj in missing_attributes[node["_source"]["taxon_id"]].items():
            for key, attribute in attr_dict.items():
                if key in obj["keys"]:
                    # update aggregation source to include ancestral rank
                    obj["attributes"].append(
                        {
                            **attribute,
                            "aggregation_source": "ancestor",
                            "aggregation_rank": node["_source"]["taxon_rank"],
                            "aggregation_taxon_id": node["_source"]["taxon_id"],
                        }
                    )
                    obj["keys"].remove(key)
            if obj["keys"]:
                missing_from_descendants[child_id] = obj
            else:
                # yield when all values filled or removed
                yield obj["node"]["_id"], obj["node"]["_source"]
        del missing_attributes[node["_source"]["taxon_id"]]
    if "parent" in node["_source"]:
        missing_attributes[node["_source"]["parent"]].update(missing_from_descendants)
        missing_attributes[node["_source"]["parent"]].update(
            {
                node["_source"]["taxon_id"]: {
                    "keys": set({key for key in desc_attrs if key not in attr_dict}),
                    "attributes": node["_source"]["attributes"],
                    "node": node,
                }
            }
        )


def track_descendant_ranks(node, descendant_ranks):
    """Keep track of descendant ranks."""
    if "parent" in node["_source"]:
        descendant_ranks[node["_source"]["parent"]].add(node["_source"]["taxon_rank"])


def traverse_from_tips(es, opts, *, template, root=None, max_depth=None):
    """Traverse a tree, filling in values."""
    if root is None:
        root = opts["traverse-root"]
    if max_depth is None:
        max_depth = get_max_depth_by_lineage(
            es,
            index=template["index_name"],
            root=root,
        )
    root_depth = max_depth
    meta = template["types"]["attributes"]
    attrs = set(meta.keys())
    parents = defaultdict(
        lambda: defaultdict(
            lambda: {
                "max": None,
                "min": None,
                "values": [],
                "prefixed_values": [],
                "count": 0,
            }
        )
    )
    limits = defaultdict(set)
    if "traverse-infer-both" in opts and opts["traverse-infer-both"]:
        desc_attrs, desc_attr_limits = set_attributes_to_descend(
            meta, opts["traverse-limit"]
        )
        missing_attributes = defaultdict(dict)
        descendant_ranks = defaultdict(set)
    else:
        desc_attrs = {}
    while root_depth >= 0:
        nodes = stream_nodes_by_root_depth(
            es,
            index=template["index_name"],
            root=root,
            depth=root_depth,
            size=50,
        )
        for ctr, node in enumerate(nodes):
            track_descendant_ranks(node, descendant_ranks)
            changed = False
            attr_dict = {}
            if "attributes" in node["_source"] and node["_source"]["attributes"]:
                changed, attr_dict = summarise_attributes(
                    attributes=node["_source"]["attributes"],
                    attrs=attrs,
                    meta=meta,
                    parent=node["_source"].get("parent", None),
                    parents=parents,
                )
            else:
                node["_source"]["attributes"] = []
            if node["_source"]["taxon_id"] in parents:
                modified, attr_dict = set_values_from_descendants(
                    attributes=node["_source"]["attributes"],
                    descendant_values=parents[node["_source"]["taxon_id"]],
                    meta=meta,
                    taxon_id=node["_source"]["taxon_id"],
                    parent=node["_source"].get("parent", None),
                    parents=parents,
                    descendant_ranks=descendant_ranks,
                    taxon_rank=node["_source"]["taxon_rank"],
                    traverse_limit=opts["traverse-limit"],
                    attr_dict=attr_dict,
                    limits=limits,
                )
                if not changed:
                    changed = modified
            if desc_attrs:
                yield from track_missing_attribute_values(
                    node, missing_attributes, attr_dict, desc_attrs, desc_attr_limits
                )
            if changed:
                yield node["_id"], node["_source"]
        root_depth -= 1
    if desc_attrs:
        for incomplete in missing_attributes.values():
            for obj in incomplete.values():
                yield obj["node"]["_id"], obj["node"]["_source"]


def copy_attribute_summary(source, meta):
    """Copy an attribute summary, removing values."""
    dest = {}
    for key in meta["summary"]:
        if key.startswith("median") and "median" in source:
            dest["median"] = source["median"]
        elif key != "list" and key in source:
            dest[key] = source[key]
    try:
        dest[f'{meta["type"]}_value'] = source[f'{meta["type"]}_value']
    except KeyError as err:
        raise (err)
    dest["count"] = source["count"]
    dest["key"] = source["key"]
    return dest


def stream_missing_attributes_at_level(es, *, nodes, attrs, template, level=1):
    """Stream all descendant nodes with missing attributes."""
    for node in nodes:
        taxon_id = node["_source"]["taxon_id"]
        fill_attrs = []
        if "attributes" in node["_source"]:
            fill_attrs.extend(
                attribute
                for attribute in node["_source"]["attributes"]
                if attribute["key"] in attrs
            )
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


def traverse_from_root(es, opts, *, template, root=None, max_depth=None, log=True):
    """Traverse a tree, filling in values."""
    if root is None:
        root = opts["traverse-root"]
    if max_depth is None:
        max_depth = get_max_depth_by_lineage(
            es, index=template["index_name"], root=root
        )
    root_depth = max_depth - 1
    meta = template["types"]["attributes"]
    attrs = set({})
    for key, value in meta.items():
        if (
            "traverse" in value
            and value["traverse"]
            and (
                "traverse_direction" not in value or value["traverse_direction"] != "up"
            )
        ):
            attrs.add(key)
    while root_depth >= 0:
        if log:
            LOGGER.info("Filling values at root depth %d" % root_depth)
        nodes = stream_nodes_by_root_depth(
            es, index=template["index_name"], root=root, depth=root_depth, size=50
        )
        desc_nodes = stream_missing_attributes_at_level(
            es, nodes=nodes, attrs=attrs, template=template
        )
        index_stream(es, template["index_name"], desc_nodes, _op_type="update", log=log)
        root_depth -= 1


def traverse_tree(es, opts, template, root, max_depth):
    """Propagate values by tree traversal."""
    log = True
    if es is None:
        log = False
        es = launch_es(opts, log=log)
    if "traverse-infer-ancestors" in opts:
        if log:
            LOGGER.info("Inferring ancestral values for root taxon %s", root)
        _success, _failed = index_stream(
            es,
            template["index_name"],
            traverse_from_tips(
                es, opts, template=template, root=root, max_depth=max_depth
            ),
            _op_type="update",
            log=log,
        )
    if "traverse-infer-descendants" in opts:
        if log:
            LOGGER.info("Inferring descendant values for root taxon %s", root)
        traverse_from_root(
            es, opts, template=template, root=root, max_depth=max_depth, log=log
        )


def traverse_helper(params):
    """Wrap traverse_tree for multithreaded traversal."""
    with tolog.DisableLogger():
        traverse_tree(*params)
    return params[3]


def traverse_handler(es, opts, template):
    """Handle single or multi-threaded tree traversal."""
    root = opts["traverse-root"]
    threads = int(opts["traverse-threads"])
    max_depth = get_max_depth_by_lineage(es, index=template["index_name"], root=root)
    subtree_depth = int(opts.get("traverse-depth", 0))
    if threads > 1 and subtree_depth == 0:
        subtree_depth = int(max_depth / 2)
    if threads == 1:
        traverse_tree(es, opts, template, root, max_depth)
        return

    max_depth -= subtree_depth

    nodes = stream_nodes_by_root_depth(
        es, index=template["index_name"], root=root, depth=subtree_depth
    )
    roots = [
        (None, opts, template, node["_source"]["taxon_id"], max_depth) for node in nodes
    ]
    LOGGER.info("Filling values in subtrees")
    with Pool(processes=threads) as p:
        with tqdm(total=len(roots), unit=" subtrees") as pbar:
            for _ in p.imap_unordered(traverse_helper, roots):
                pbar.update()
    LOGGER.info("Connecting subtrees")
    traverse_tree(es, opts, template, opts["traverse-root"], subtree_depth)


def main(args):
    """Initialise genomehubs."""
    options = config("fill", **args)
    if "traverse-infer-both" in options["fill"]:
        options["fill"]["traverse-infer-ancestors"] = True

    # Start Elasticsearch
    es = launch_es(options["fill"])

    # Post search scripts
    hub.post_search_scripts(es)

    LOGGER.info("Filling values")

    types = fetch_types(es, "taxon", options["fill"])

    if "taxonomy-source" in options["fill"]:
        taxonomy_name = options["fill"]["taxonomy-source"].lower()
        template = taxon.index_template(taxonomy_name, options["fill"])
        if types:
            template["types"]["attributes"] = types
        if "traverse-root" in options["fill"]:
            traverse_handler(es, options["fill"], template)


def cli():
    """Entry point."""
    if len(sys.argv) == sys.argv.index(__name__.split(".")[-1]) + 1:
        args = docopt(__doc__, argv=[])
    else:
        args = docopt(__doc__, version=__version__)
    main(args)


if __name__ == "__main__":
    cli()
