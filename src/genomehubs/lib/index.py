#!/usr/bin/env python3

"""
Index a file, directory or repository.

Usage:
    genomehubs index [--hub-name STRING] [--hub-path PATH] [--hub-version PATH]
                     [--config-file PATH...] [--config-save PATH]
                     [--es-host URL...]
                     [--assembly-dir PATH...] [--assembly-repo URL...]
                     [--taxon-dir PATH...] [--taxon-repo URL...]
                     [-h|--help] [-v|--version]

Options:
    --hub-name STRING       GenomeHubs instance name.
    --hub-path PATH         GenomeHubs instance root directory path.
    --hub-version STR       GenomeHubs instance version string.
    --config-file PATH      Path to YAML file containing configuration options.
    --config-save PATH      Path to write configuration options to YAML file.
    --es-host URL           ElasticSearch hostname/URL and port.
    --assembly-dir PATH     Path to directory containing assembly-level data.
    --assembly-repo URL     Remote git repository containing assembly-level data.
                            Optionally include `~branch-name` suffix.
    --taxon-dir PATH        Path to directory containing taxon-level data.
    --taxon-repo URL        Remote git repository containing taxon-level data.
                            Optionally include `~branch-name` suffix.
    -h, --help              Show this
    -v, --version           Show version number

Examples:
    # 1. Index all files in a remote repository
    ./genomehubs index --taxon-repo https://github.com/example/repo=main
"""

import csv
import re
import sys
from collections import defaultdict
from pathlib import Path

from docopt import docopt
from tolkein import tofile
from tolkein import tolog
from tqdm import tqdm

from ..lib import assembly
from ..lib import es_functions
from ..lib import hub
from ..lib import taxon
from .attributes import index_types
from .config import config
from .es_functions import index_stream
from .es_functions import query_keyword_value_template
from .version import __version__

LOGGER = tolog.logger(__name__)


def validate_types_file(types_file, dir_path):
    """Validate types file."""
    try:
        types = tofile.load_yaml(str(types_file.resolve()))
    except Exception:
        LOGGER.error("Unable to open types file %s", str(types_file.resolve()))
        sys.exit(1)
    if "taxonomy" not in types:
        LOGGER.error("Types file contains no taxonomy information")
    if "file" not in types or "name" not in types["file"]:
        LOGGER.error("No data file name in types file")
    data = tofile.open_file_handle(Path(dir_path) / types["file"]["name"])
    return types, data


def process_row(types, row):
    """Process a row of data."""
    data = {
        "attributes": {},
        "identifiers": {},
        "metadata": {},
        "taxon_names": {},
        "taxonomy": {},
    }
    print(row)
    for group in data.keys():
        if group in types:
            for key, meta in types[group].items():
                if isinstance(meta["index"], list):
                    char = meta.get("join", "")
                    values = [row[i] for i in meta["index"]]
                    if all(values):
                        value = char.join(values)
                    else:
                        continue
                else:
                    value = row[meta["index"]]
                try:
                    if "separator" in meta and any(
                        sep in value for sep in meta["separator"]
                    ):
                        separator = "|".join(meta["separator"])
                        data[group][key] = re.split(rf"\s*{separator}\s*", value)
                    else:
                        data[group][key] = value
                except Exception as err:
                    LOGGER.warning("Cannot parse row")
                    raise err
                    return None
    if data["attributes"]:
        data["attributes"] = hub.add_attributes(
            data["attributes"], types["attributes"], meta=data["metadata"],
        )
    else:
        data["attributes"] = []
    return data


def chunks(arr, n):
    """Yield successive n-sized chunks from arr."""
    for i in range(0, len(arr), n):
        yield arr[i : i + n]


def add_names_to_list(existing, new, *, blanks=set({"NA"})):
    """Add names to a list if they do not already exist."""
    names = defaultdict(dict)
    for entry in existing:
        names[entry["class"]][entry["name"]] = True
    for name_class, name in new.items():
        name_class = name_class.replace("_", " ")
        if (
            name not in blanks
            and name_class not in names
            and name not in names[name_class]
        ):
            existing.append({"name": name, "class": name_class})
            names[name_class][name] = True


def add_attribute_values(existing, new):
    """Add attribute values to records."""
    indices = {}
    for index, entry in enumerate(existing):
        indices[entry["key"]] = index
    index = len(existing)
    for group in new:
        if not isinstance(group, list):
            group = [group]
        for entry in group:
            arr = []
            if indices and entry["key"] in indices:
                arr = existing[indices[entry["key"]]]["values"]
            else:
                existing.append({"key": entry["key"], "values": arr})
                indices[entry["key"]] = index
                index += 1
            del entry["key"]
            arr.append(entry)


def add_names_and_attributes_to_taxa(es, data, opts, *, template, blanks=set(["NA"])):
    """Add names and attributes to taxa."""
    for values in chunks(list(data.keys()), 500):
        taxon_res = query_keyword_value_template(
            es,
            "attributes_names_by_keyword_value",
            "taxon_id",
            values,
            index=template["index_name"],
        )
        if taxon_res is not None:
            for response in taxon_res["responses"]:
                if "hits" in response and response["hits"]["total"]["value"] == 1:
                    doc = response["hits"]["hits"][0]
                    taxon_data = data[doc["_source"]["taxon_id"]]
                    taxon_names = {}
                    attributes = []
                    for entry in taxon_data:
                        if "attributes" in entry:
                            attributes = attributes + entry["attributes"]
                        if "taxon_names" in entry:
                            taxon_names.update(entry["taxon_names"])
                    add_names_to_list(
                        doc["_source"]["taxon_names"], taxon_names, blanks=blanks
                    )
                    if (
                        "attributes" not in doc["_source"]
                        or not doc["_source"]["attributes"]
                    ):
                        doc["_source"]["attributes"] = []
                    add_attribute_values(doc["_source"]["attributes"], attributes)
                    yield doc["_id"], doc["_source"]


def lookup_taxon_id_within_lineage(
    es, name, lineage, opts, *, rank=None, anc_rank=None
):
    """Lookup taxon ID in a specified lineage."""
    taxon_ids = []
    template = taxon.index_template(opts["taxonomy-source"][0], opts)
    body = {
        "id": "taxon_by_lineage",
        "params": {
            "taxon": name,
            "rank": rank,
            "lineage": lineage,
            "anc_rank": anc_rank,
        },
    }
    with tolog.DisableLogger():
        res = es.search_template(
            body=body, index=template["index_name"], rest_total_hits_as_int=True
        )
    if "hits" in res and res["hits"]["total"] > 0:
        taxon_ids = [hit["_source"]["taxon_id"] for hit in res["hits"]["hits"]]
    return taxon_ids


def lookup_taxon_id(es, name, opts, *, rank=None):
    """Lookup taxon ID."""
    taxon_ids = []
    template = taxon.index_template(opts["taxonomy-source"][0], opts)
    body = {
        "id": "taxon_by_name",
        "params": {"taxon": name, "rank": rank},
    }
    with tolog.DisableLogger():
        res = es.search_template(
            body=body, index=template["index_name"], rest_total_hits_as_int=True
        )
    if "hits" in res and res["hits"]["total"] > 0:
        taxon_ids = [hit["_source"]["taxon_id"] for hit in res["hits"]["hits"]]
    return taxon_ids


def lookup_missing_taxon_ids(
    es, without_ids, opts, *, with_ids=None, blanks=set(["NA"])
):
    """Lookup taxon ID based on available taxonomic information."""
    if with_ids is None:
        with_ids = {}
    ranks = [
        "subspecies",
        "species",
        "family",
        "order",
        "class",
        "subphylum",
        "phylum",
    ]
    found_keys = []
    pbar = tqdm(total=len(without_ids.keys()))
    for key, arr in without_ids.items():
        pbar.update(1)
        for obj in arr:
            if "taxonomy" not in obj:
                continue
            for index, rank in enumerate(ranks):
                if rank not in obj["taxonomy"] or obj["taxonomy"][rank] in blanks:
                    continue
                taxon_ids = lookup_taxon_id(es, obj["taxonomy"][rank], opts, rank=rank)
                if not taxon_ids:
                    break
                for anc_rank in ranks[(index + 1) :]:
                    if (
                        anc_rank not in obj["taxonomy"]
                        or obj["taxonomy"][anc_rank] in blanks
                    ):
                        continue
                    taxon_ids = lookup_taxon_id_within_lineage(
                        es,
                        obj["taxonomy"][rank],
                        obj["taxonomy"][anc_rank],
                        opts,
                        rank=rank,
                        anc_rank=anc_rank,
                    )
                    if taxon_ids:
                        if len(taxon_ids) == 1:
                            if taxon_ids[0] in with_ids:
                                with_ids[taxon_ids[0]].append(obj)
                            else:
                                obj["attributes"] = [obj["attributes"]]
                                with_ids[taxon_ids[0]] = [obj]
                                LOGGER.info(
                                    "Matched %s with taxon_id %s",
                                    obj["taxonomy"][rank],
                                    taxon_ids[0],
                                )
                            found_keys.append(key)
                        else:
                            LOGGER.warn(
                                "Taxon name %s is ambiguous within %s",
                                obj["taxonomy"][rank],
                                obj["taxonomy"][anc_rank],
                            )
                        break
                break
    pbar.close()
    for key in found_keys:
        without_ids.pop(key, None)
    return with_ids, without_ids


def index_file(es, types, data, opts):
    """Index a file."""
    if types["file"].get("header", False):
        next(data)
    delimiters = {"csv": ",", "tsv": "\t"}
    rows = csv.reader(
        data, delimiter=delimiters[types["file"]["format"]], quotechar='"'
    )
    with_ids = defaultdict(list)
    without_ids = defaultdict(list)
    blanks = set(["", "NA", "N/A", "None"])
    LOGGER.info("Processing rows")
    for row in rows:
        processed_data = process_row(types, row)
        if (
            "taxon_id" in processed_data["taxonomy"]
            and processed_data["taxonomy"]["taxon_id"] not in blanks
        ):
            with_ids[processed_data["taxonomy"]["taxon_id"]].append(processed_data)
        else:
            if "subspecies" in processed_data["taxonomy"]:
                without_ids[processed_data["taxonomy"]["subspecies"]].append(
                    processed_data
                )
            elif "species" in processed_data["taxonomy"]:
                without_ids[processed_data["taxonomy"]["species"]].append(
                    processed_data
                )
    if without_ids:
        # TODO: support multiple taxonomies
        LOGGER.info("Found taxon IDs in %d entries", len(with_ids.keys()))
        LOGGER.info("Looking up %d missing taxon IDs", len(without_ids.keys()))
        with_ids, without_ids = lookup_missing_taxon_ids(
            es, without_ids, opts, with_ids=with_ids, blanks=blanks
        )
        # create new taxon IDs
        # if "taxon_names" in types and "tol_name" in types["taxon_names"]:
        # need to lookup lineage, assign new taxid and create taxon for entries in without_ids
        # quit()
    if with_ids:
        LOGGER.info("Indexing %d entries", len(with_ids.keys()))
        for taxonomy_name in opts["taxonomy-source"]:
            if opts["index"] == "taxon":
                template = taxon.index_template(taxonomy_name, opts)
                docs = add_names_and_attributes_to_taxa(
                    es, with_ids, opts, template=template, blanks=blanks
                )
            elif opts["index"] == "assembly":
                template = assembly.index_template(taxonomy_name, opts)
                print(with_ids)
                attributes = hub.add_attributes(
                    with_ids,
                    opts["index_types"],
                    attributes=[],
                    source=opts["index_types"]["file"]["name"],
                )
                print(attributes)
                quit()
            # identifiers = add_attributes(
            #     raw_meta,
            #     template["types"]["identifiers"],
            #     attributes=[],
            #     source=sources.get(metadata_name, metadata_name),
            #     attr_type="identifiers",
            # )
            index_stream(
                es, template["index_name"], docs, _op_type="update",
            )


def main(args):
    """Index files."""
    options = config("index", **args)

    # Start Elasticsearch
    es = es_functions.launch_es(options["fill"])

    # Post search scripts
    with tolog.DisableLogger():
        hub.post_search_scripts(es)

    for index in list(["taxon", "assembly"]):
        data_dir = "%s-dir" % index
        if data_dir in options["index"]:
            for dir_path in options["index"][data_dir]:
                for types_file in sorted(Path(dir_path).glob("*.types.yaml")):
                    types, data = validate_types_file(types_file, dir_path)
                    LOGGER.info("Indexing %s" % types["file"]["name"])
                    index_types(es, index, types, options["index"])
                    index_file(
                        es,
                        types,
                        data,
                        {
                            **options["index"],
                            "index": index,
                            "index_types": index_types,
                        },
                    )


def cli():
    """Entry point."""
    if len(sys.argv) == sys.argv.index("index") + 1:
        args = docopt(__doc__, argv=[])
    else:
        args = docopt(__doc__, version=__version__)
    main(args)


if __name__ == "__main__":
    cli()
