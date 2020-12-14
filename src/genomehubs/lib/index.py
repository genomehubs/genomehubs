#!/usr/bin/env python3

"""
Index a file, directory or repository.

Usage:
    genomehubs index [--hub-name STRING] [--hub-path PATH] [--hub-version PATH]
                     [--config-file PATH...] [--config-save PATH]
                     [--es-host URL...] [--assembly-dir PATH]
                     [--assembly-repo URL] [--assembly-exception PATH]
                     [--taxon-dir PATH] [--taxon-repo URL] [--taxon-exception PATH]
                     [--taxon-lookup STRING]
                     [-h|--help] [-v|--version]

Options:
    --hub-name STRING          GenomeHubs instance name.
    --hub-path PATH            GenomeHubs instance root directory path.
    --hub-version STR          GenomeHubs instance version string.
    --config-file PATH         Path to YAML file containing configuration options.
    --config-save PATH         Path to write configuration options to YAML file.
    --es-host URL              ElasticSearch hostname/URL and port.
    --assembly-dir PATH        Path to directory containing assembly-level data.
    --assembly-repo URL        Remote git repository containing assembly-level data.
                               Optionally include `~branch-name` suffix.
    --assembly-exception PATH  Path to directory to write assembly data that failed to import.
    --taxon-lookup STRING      Taxon name class to lookup (scientific|all). [Default: scientific]
    --taxon-dir PATH           Path to directory containing taxon-level data.
    --taxon-repo URL           Remote git repository containing taxon-level data.
                               Optionally include `~branch-name` suffix.
    --taxon-exception PATH     Path to directory to write taxon data that failed to import.
    -h, --help                 Show this
    -v, --version              Show version number

Examples:
    # 1. Index all files in a remote repository
    ./genomehubs index --taxon-repo https://github.com/example/repo~main
"""

import copy
import csv
import os
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
from .assembly import add_taxonomy_info_to_assembly
from .assembly import stream_taxa
from .attributes import index_types
from .config import config
from .es_functions import index_stream
from .es_functions import query_keyword_value_template
from .es_functions import query_value_template
from .taxonomy import index_template as taxonomy_index_template
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
    defaults = {"attributes": {}, "metadata": {}}
    for key, value in types["file"].items():
        if key.startswith("display") or key.startswith("taxon"):
            defaults["attributes"].update({key: value})
        elif key.startswith("source"):
            defaults["metadata"].update({key: value})
    types.update({"defaults": defaults})
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
        "taxon_attributes": {},
        **types["defaults"],
    }
    for group in data.keys():
        if group in types:
            for key, meta in types[group].items():
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
                        separator = "|".join(meta["separator"])
                        data[group][key] = re.split(rf"\s*{separator}\s*", value)
                    else:
                        data[group][key] = value
                except Exception:
                    LOGGER.warning("Cannot parse row '%s'" % str(row))
                    return None
    taxon_data = {}
    taxon_types = {}
    for attr_type in list(["attributes", "identifiers"]):
        if data[attr_type]:
            (
                data[attr_type],
                taxon_data[attr_type],
                taxon_types[attr_type],
            ) = hub.add_attributes(
                data[attr_type],
                types[attr_type],
                attr_type=attr_type,
                meta=data["metadata"],
            )
        else:
            data[attr_type] = []
    return data, taxon_data, taxon_types.get("attributes", {})


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


def add_identifiers_to_list(existing, new, *, blanks=set({"NA"})):
    """Add identifiers to a list if they do not already exist."""
    # TODO: include source?
    identifiers = defaultdict(dict)
    for entry in existing:
        identifiers[entry["class"]][entry["identifier"]] = True
    for entry in new:
        id_class = entry["class"]
        identifier = entry["identifier"]
        if (
            identifier not in blanks
            and id_class not in identifiers
            and identifier not in identifiers[id_class]
        ):
            existing.append({"identifier": identifier, "class": id_class})
            identifiers[id_class][identifier] = True


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


def lookup_taxa_by_taxon_id(es, values, template, *, return_type="list"):
    """Retrieve existing taxa from index."""
    taxa = []
    if return_type == "dict":
        taxa = {}
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
                if return_type == "list":
                    taxa.append(response["hits"]["hits"][0])
                else:
                    taxa[response["hits"]["hits"][0]["_source"]["taxon_id"]] = response[
                        "hits"
                    ]["hits"][0]
            elif return_type == "list":
                taxa.append(None)
    return taxa


def get_taxa_to_create(
    es, opts, *, taxonomy_name="ncbi", taxon_ids=None, asm_by_taxon_id=None,
):
    """Create a dict of taxa to create."""
    taxa_to_create = {}
    if not taxon_ids:
        return {}
    if asm_by_taxon_id is None:
        asm_by_taxon_id = {}
    taxonomy_template = taxonomy_index_template(taxonomy_name, opts)
    taxonomy_res = query_value_template(
        es, "taxonomy_node_by_taxon_id", taxon_ids, taxonomy_template["index_name"],
    )
    if taxonomy_res is None:
        LOGGER.error(
            "Could not connect to taxonomy index '%s'", taxonomy_template["index_name"],
        )
        sys.exit(1)
    ancestors = set()
    for taxonomy_result in taxonomy_res["responses"]:
        if taxonomy_result["hits"]["total"]["value"] == 1:
            source = taxonomy_result["hits"]["hits"][0]["_source"]
            taxa_to_create[source["taxon_id"]] = source
            for ancestor in source["lineage"]:
                ancestors.add(ancestor["taxon_id"])
            if source["taxon_id"] in asm_by_taxon_id:
                for asm in asm_by_taxon_id[source["taxon_id"]]:
                    add_taxonomy_info_to_assembly(asm, source)
    taxonomy_res = query_value_template(
        es,
        "taxonomy_node_by_taxon_id",
        list(ancestors),
        taxonomy_template["index_name"],
    )
    if taxonomy_res and "responses" in taxonomy_res:
        for taxonomy_result in taxonomy_res["responses"]:
            if taxonomy_result["hits"]["total"]["value"] == 1:
                source = taxonomy_result["hits"]["hits"][0]["_source"]
                taxa_to_create[source["taxon_id"]] = source
    return taxa_to_create


def find_or_create_taxa(es, opts, *, taxon_ids, taxon_template, asm_by_taxon_id=None):
    """Find taxa in taxon index or create new taxon entries from taxonomy."""
    taxa = lookup_taxa_by_taxon_id(
        es, list(taxon_ids), taxon_template, return_type="dict"
    )
    missing_taxa = [taxon_id for taxon_id in taxon_ids if taxon_id not in taxa]
    to_create = get_taxa_to_create(
        es,
        opts,
        taxonomy_name="ncbi",
        taxon_ids=missing_taxa,
        asm_by_taxon_id=asm_by_taxon_id,
    )
    index_stream(
        es, taxon_template["index_name"], stream_taxa(to_create),
    )
    taxa.update(
        {
            taxon_id: {"_id": "taxon_id-%s" % taxon_id, "_source": obj}
            for taxon_id, obj in to_create.items()
        }
    )
    return taxa


def generate_ancestral_taxon_id(name, rank, *, alt_taxon_id=None, taxon_ids=None):
    """Generate an ancestral taxon ID."""
    if taxon_ids is None:
        taxon_ids = set({})
    increment = 0
    while True:
        # TODO: make robust to imports from separate files
        anc_taxon_id = "anc_%s" % name
        if increment:
            anc_taxon_id += "_%d" % increment
        if anc_taxon_id not in taxon_ids:
            taxon_ids.add(anc_taxon_id)
            return anc_taxon_id
        increment += 1


def create_descendant_taxon(taxon_id, rank, name, closest_taxon):
    """Set taxon and lineage information for a descendant taxon."""
    desc_taxon = {
        "_id": "taxon_id-%s" % taxon_id,
        "_source": {
            "taxon_id": taxon_id,
            "taxon_rank": rank,
            "scientific_name": name,
            "taxon_names": [{"class": "temporary taxon id", "name": taxon_id}],
        },
    }
    lineage = [
        {
            "node_depth": 1,
            "taxon_id": closest_taxon["_source"]["taxon_id"],
            "taxon_rank": closest_taxon["_source"]["taxon_rank"],
            "scientific_name": closest_taxon["_source"]["scientific_name"],
        }
    ]
    for ancestor in closest_taxon["_source"]["lineage"]:
        lineage.append(
            {
                "taxon_id": ancestor["taxon_id"],
                "taxon_rank": ancestor["taxon_rank"],
                "scientific_name": ancestor["scientific_name"],
                "node_depth": ancestor["node_depth"] + 1,
            }
        )
    desc_taxon["_source"]["lineage"] = lineage
    return desc_taxon


def create_taxa(es, opts, *, taxon_template, data=None, blanks=set(["NA"])):
    """Create new taxa using alternate taxon IDs."""
    ranks = [
        "genus",
        "family",
        "order",
        "class",
        "subphylum",
        "phylum",
    ]
    ancestors = {}
    matches = defaultdict(dict)
    pbar = tqdm(total=len(data.keys()))
    taxon_ids = set({})
    new_taxa = {}
    for alt_taxon_id, rows in data.items():
        obj = rows[0]
        pbar.update(1)
        if "taxonomy" not in obj:
            continue
        lineage = []
        closest_rank = None
        closest_taxon = None
        for index, rank in enumerate(ranks):
            if rank not in obj["taxonomy"] or obj["taxonomy"][rank] in blanks:
                continue
            for anc_rank in ranks[(index + 1) :]:
                if (
                    anc_rank not in obj["taxonomy"]
                    or obj["taxonomy"][anc_rank] in blanks
                ):
                    continue
                if (
                    obj["taxonomy"][rank] in matches
                    and obj["taxonomy"][anc_rank] in matches[obj["taxonomy"][rank]]
                ):
                    taxa = matches[obj["taxonomy"][rank]][obj["taxonomy"][anc_rank]]
                    ancestors.update({alt_taxon_id: taxa[0]})
                    break
                else:
                    taxa = lookup_taxon_within_lineage(
                        es,
                        obj["taxonomy"][rank],
                        obj["taxonomy"][anc_rank],
                        opts,
                        rank=rank,
                        anc_rank=anc_rank,
                        return_type="taxon",
                    )
                if taxa:
                    if len(taxa) == 1:
                        ancestors.update({alt_taxon_id: taxa[0]})
                        matches[obj["taxonomy"][rank]][obj["taxonomy"][anc_rank]] = taxa
                        break
            if alt_taxon_id in ancestors:
                closest_rank = rank
                closest_taxon = matches[obj["taxonomy"][rank]][
                    obj["taxonomy"][anc_rank]
                ][0]
                break
            lineage.append({"rank": rank, "name": obj["taxonomy"][rank]})
        if closest_taxon is not None:
            for intermediate in reversed(lineage):
                taxon_id = generate_ancestral_taxon_id(
                    intermediate["name"],
                    intermediate["rank"],
                    alt_taxon_id=alt_taxon_id,
                    taxon_ids=taxon_ids,
                )
                new_taxon = create_descendant_taxon(
                    taxon_id, intermediate["rank"], intermediate["name"], closest_taxon
                )
                new_taxa.update(
                    {new_taxon["_source"]["taxon_id"]: new_taxon["_source"]}
                )
                matches[intermediate["name"]][obj["taxonomy"][closest_rank]] = taxa
                closest_rank = intermediate["rank"]
                closest_taxon = new_taxon
            ancestors[alt_taxon_id] = closest_taxon
            if alt_taxon_id not in new_taxa:
                new_taxon = create_descendant_taxon(
                    alt_taxon_id, "species", obj["taxonomy"]["species"], closest_taxon
                )
                new_taxa.update(
                    {new_taxon["_source"]["taxon_id"]: new_taxon["_source"]}
                )

    pbar.close()
    index_stream(
        es, taxon_template["index_name"], stream_taxa(new_taxa),
    )
    return new_taxa.keys()


def add_identifiers_and_attributes_to_assemblies(
    es, data, opts, *, template, taxon_template, blanks=set(["NA"])
):
    """Add identifiers and attributes to assemblies."""
    all_assemblies = {}
    taxon_id_by_asm = {}
    for taxon_id, assemblies in data.items():
        for asm in assemblies:
            asm["taxon_id"] = taxon_id
            for identifier in asm["identifiers"]:
                if identifier["class"] == "assembly_id":
                    all_assemblies[identifier["identifier"]] = asm
                    taxon_id_by_asm[identifier["identifier"]] = taxon_id
    for values in chunks(list(all_assemblies.keys()), 500):
        assembly_res = query_keyword_value_template(
            es,
            "attributes_identifiers_by_keyword_value",
            "assembly_id",
            values,
            index=template["index_name"],
        )
        if assembly_res is None:
            assembly_res = {"responses": [{} for value in values]}
        taxon_ids = set()
        for value in values:
            taxon_ids.add(taxon_id_by_asm[value])
        taxa = find_or_create_taxa(
            es,
            opts,
            taxon_ids=taxon_ids,
            taxon_template=taxon_template,
            asm_by_taxon_id=data,
        )
        for index, response in enumerate(assembly_res["responses"]):
            doc = {
                "_id": "assembly-%s" % values[index],
                "_source": {
                    "assembly_id": values[index],
                    "identifiers": [],
                    "attributes": [],
                },
            }
            if "hits" in response and response["hits"]["total"]["value"] == 1:
                doc = response["hits"]["hits"][0]
            assembly_data = all_assemblies[doc["_source"]["assembly_id"]]
            identifiers = copy.deepcopy(doc["_source"]["identifiers"])
            attributes = copy.deepcopy(doc["_source"]["attributes"])
            if "attributes" in assembly_data:
                attributes = attributes + assembly_data["attributes"]
            if "identifiers" in assembly_data:
                identifiers = identifiers + assembly_data["identifiers"]
            add_identifiers_to_list(
                doc["_source"]["identifiers"], identifiers, blanks=blanks
            )
            if "attributes" not in doc["_source"] or not doc["_source"]["attributes"]:
                doc["_source"]["attributes"] = []
            add_attribute_values(doc["_source"]["attributes"], attributes)
            doc["_source"]["taxon_id"] = assembly_data["taxon_id"]
            try:
                add_taxonomy_info_to_assembly(
                    doc["_source"], taxa[assembly_data["taxon_id"]]["_source"]
                )
                yield doc["_id"], doc["_source"]
            except KeyError:
                LOGGER.warning(
                    "Taxon ID %s was not found in the taxonomy"
                    % assembly_data["taxon_id"]
                )


def add_names_and_attributes_to_taxa(es, data, opts, *, template, blanks=set(["NA"])):
    """Add names and attributes to taxa."""
    for values in chunks(list(data.keys()), 500):
        # taxa = lookup_taxa_by_taxon_id(es, values, template, return_type="list")
        all_taxa = find_or_create_taxa(
            es, opts, taxon_ids=values, taxon_template=template,
        )
        taxa = [all_taxa[taxon_id] for taxon_id in values if taxon_id in all_taxa]
        for doc in taxa:
            if doc is not None:
                taxon_data = data[doc["_source"]["taxon_id"]]
                taxon_names = {}
                attributes = []
                for entry in taxon_data:
                    if "attributes" in entry:
                        attributes = attributes + entry["attributes"]
                    if "taxon_names" in entry:
                        taxon_names.update(entry["taxon_names"])
                if "taxon_names" not in doc["_source"]:
                    doc["_source"]["taxon_names"] = []
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


def lookup_taxon_within_lineage(
    es,
    name,
    lineage,
    opts,
    *,
    rank=None,
    anc_rank=None,
    return_type="taxon",
    name_class="scientific",
):
    """Lookup taxon ID in a specified lineage."""
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
    if name_class == "any":
        body.update({"id": "taxon_by_any_name_by_lineage"})
    with tolog.DisableLogger():
        res = es.search_template(
            body=body, index=template["index_name"], rest_total_hits_as_int=True
        )
    if "hits" in res and res["hits"]["total"] > 0:
        if return_type == "taxon_id":
            return [hit["_source"]["taxon_id"] for hit in res["hits"]["hits"]]
        return [hit for hit in res["hits"]["hits"]]
    index = template["index_name"].replace("taxon", "taxonomy")
    with tolog.DisableLogger():
        res = es.search_template(body=body, index=index, rest_total_hits_as_int=True)
    if "hits" in res and res["hits"]["total"] > 0:
        if return_type == "taxon_id":
            return [hit["_source"]["taxon_id"] for hit in res["hits"]["hits"]]
        return [hit for hit in res["hits"]["hits"]]
    return []


def lookup_taxon_id(es, name, opts, *, rank=None, name_class="scientific"):
    """Lookup taxon ID."""
    taxon_ids = []
    template = taxon.index_template(opts["taxonomy-source"][0], opts)
    body = {
        "id": "taxon_by_name",
        "params": {"taxon": name, "rank": rank},
    }
    if name_class == "any":
        body.update({"id": "taxon_by_any_name"})
    index = template["index_name"]
    with tolog.DisableLogger():
        res = es.search_template(body=body, index=index, rest_total_hits_as_int=True)
    if "hits" in res and res["hits"]["total"] > 0:
        taxon_ids = [hit["_source"]["taxon_id"] for hit in res["hits"]["hits"]]
    else:
        template = taxonomy_index_template(opts["taxonomy-source"][0], opts)
        index = template["index_name"]
        with tolog.DisableLogger():
            res = es.search_template(
                body=body, index=index, rest_total_hits_as_int=True
            )
        if "hits" in res and res["hits"]["total"] > 0:
            taxon_ids = [hit["_source"]["taxon_id"] for hit in res["hits"]["hits"]]
    if not taxon_ids and opts["taxon-lookup"] == "any" and name_class != "any":
        taxon_ids, name_class = lookup_taxon_id(
            es, name, opts, rank=rank, name_class="any"
        )
    return taxon_ids, name_class


def lookup_missing_taxon_ids(
    es, without_ids, opts, *, with_ids=None, blanks=set(["NA"])
):
    """Lookup taxon ID based on available taxonomic information."""
    if with_ids is None:
        with_ids = {}
    # TODO: set this list from types file
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
                taxon_ids, name_class = lookup_taxon_id(
                    es, obj["taxonomy"][rank], opts, rank=rank
                )
                if not taxon_ids:
                    break
                for anc_rank in ranks[(index + 1) :]:
                    if (
                        anc_rank not in obj["taxonomy"]
                        or obj["taxonomy"][anc_rank] in blanks
                    ):
                        continue
                    taxon_ids = lookup_taxon_within_lineage(
                        es,
                        obj["taxonomy"][rank],
                        obj["taxonomy"][anc_rank],
                        opts,
                        rank=rank,
                        anc_rank=anc_rank,
                        return_type="taxon_id",
                        name_class=name_class,
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
    found_ids = {taxon_id: True for taxon_id in with_ids.keys()}
    for key in found_keys:
        without_ids.pop(key, None)
        found_ids[key] = True
    return with_ids, without_ids, found_ids


def fix_missing_ids(
    es,
    opts,
    without_ids,
    *,
    types,
    taxon_template,
    failed_rows,
    with_ids=None,
    blanks=set(["NA"]),
    header=None,
):
    """Find or create taxon IDs for rows without."""
    if with_ids is None:
        with_ids = {}
    if without_ids:
        # TODO: support multiple taxonomies
        LOGGER.info("Looking up %d missing taxon IDs", len(without_ids.keys()))
        with_ids, without_ids, found_ids = lookup_missing_taxon_ids(
            es, without_ids, opts, with_ids=with_ids, blanks=blanks
        )
        # create new taxon IDs
        if "taxonomy" in types and "alt_taxon_id" in types["taxonomy"]:
            LOGGER.info(
                "Using alt_taxon_id to fill in %d missing taxon IDs",
                len(without_ids.keys()),
            )
            created_ids = create_taxa(
                es,
                opts,
                data=without_ids,
                blanks=blanks,
                taxon_template=taxon_template,
            )
            for created_id in created_ids:
                if created_id in without_ids:
                    with_ids[created_id] = without_ids[created_id]
                    found_ids[created_id] = True
                    del without_ids[created_id]
    if failed_rows:
        for key, value in found_ids.items():
            if key in failed_rows:
                del failed_rows[key]
        if failed_rows:
            LOGGER.info(
                "Unable to associate %d records with taxon IDs", len(failed_rows)
            )
            data = []
            exception_key = "%s-exception" % opts["index"]
            dir_key = "%s-dir" % opts["index"]
            if exception_key in opts and opts[exception_key]:
                outdir = opts[exception_key]
            else:
                outdir = "%s/exceptions" % opts[dir_key]
            os.makedirs(outdir, exist_ok=True)
            outfile = "%s/%s" % (outdir, types["file"]["name"])
            if header:
                data.append(header)
            for rows in failed_rows.values():
                for row in rows:
                    data.append(row)
            LOGGER.info(
                "Writing %d records to exceptions file '%s", len(data) - 1, outfile
            )
            tofile.write_file(outfile, data)
    return with_ids, without_ids


def set_column_indices(types, header):
    """Use header to set indices for named columns."""
    headers = {title: index for index, title in enumerate(header)}
    for section, entries in types.items():
        for key, value in entries.items():
            if isinstance(value, dict):
                if "header" in value:
                    index = headers.get(value["header"], None)
                    if index is not None:
                        value.update({"index": index})


def index_file(es, types, data, opts):
    """Index a file."""
    delimiters = {"csv": ",", "tsv": "\t"}
    rows = csv.reader(
        data, delimiter=delimiters[types["file"]["format"]], quotechar='"'
    )
    header = None
    if types["file"].get("header", False):
        header = next(rows)
        set_column_indices(types, header)
    with_ids = defaultdict(list)
    taxon_asm_data = defaultdict(list)
    without_ids = defaultdict(list)
    failed_rows = defaultdict(list)
    blanks = set(["", "NA", "N/A", "None"])
    taxon_types = {}
    for taxonomy_name in opts["taxonomy-source"]:
        taxon_template = taxon.index_template(taxonomy_name, opts)
        LOGGER.info("Processing rows")
        for row in tqdm(rows):
            try:
                processed_data, taxon_data, new_taxon_types = process_row(types, row)
            except Exception:
                failed_rows["None"].append(row)
                continue
            taxon_types.update(new_taxon_types)
            if (
                "taxon_id" in processed_data["taxonomy"]
                and processed_data["taxonomy"]["taxon_id"] not in blanks
            ):
                with_ids[processed_data["taxonomy"]["taxon_id"]].append(processed_data)
                taxon_asm_data[processed_data["taxonomy"]["taxon_id"]].append(
                    taxon_data
                )
            else:
                if "taxonomy" in types and "alt_taxon_id" in types["taxonomy"]:
                    without_ids[processed_data["taxonomy"]["alt_taxon_id"]].append(
                        processed_data
                    )
                    taxon_asm_data[processed_data["taxonomy"]["alt_taxon_id"]].append(
                        taxon_data
                    )
                    failed_rows[processed_data["taxonomy"]["alt_taxon_id"]].append(row)
                elif "subspecies" in processed_data["taxonomy"]:
                    without_ids[processed_data["taxonomy"]["subspecies"]].append(
                        processed_data
                    )
                    taxon_asm_data[processed_data["taxonomy"]["subspecies"]].append(
                        taxon_data
                    )
                    failed_rows[processed_data["taxonomy"]["subspecies"]].append(row)
                elif "species" in processed_data["taxonomy"]:
                    without_ids[processed_data["taxonomy"]["species"]].append(
                        processed_data
                    )
                    taxon_asm_data[processed_data["taxonomy"]["species"]].append(
                        taxon_data
                    )
                    failed_rows[processed_data["taxonomy"]["species"]].append(row)
                else:
                    failed_rows["None"].append(row)
        LOGGER.info("Found taxon IDs in %d entries", len(with_ids.keys()))
        with_ids, without_ids = fix_missing_ids(
            es,
            opts,
            without_ids,
            types=types,
            taxon_template=taxon_template,
            failed_rows=failed_rows,
            with_ids=with_ids,
            blanks=blanks,
            header=header,
        )
        if with_ids:
            LOGGER.info("Indexing %d entries", len(with_ids.keys()))
            if opts["index"] == "taxon":
                docs = add_names_and_attributes_to_taxa(
                    es, with_ids, opts, template=taxon_template, blanks=blanks
                )
                index_stream(
                    es, taxon_template["index_name"], docs, _op_type="update",
                )
            elif opts["index"] == "assembly":
                assembly_template = assembly.index_template(taxonomy_name, opts)
                docs = add_identifiers_and_attributes_to_assemblies(
                    es,
                    with_ids,
                    opts,
                    template=assembly_template,
                    taxon_template=taxon_template,
                    blanks=blanks,
                )
                index_stream(es, assembly_template["index_name"], docs)
                # index taxon-level attributes
                index_types(
                    es, "taxon", {"attributes": taxon_types}, opts,
                )
                taxon_asm_with_ids = {
                    taxon_id: taxon_asm_data[taxon_id] for taxon_id in with_ids.keys()
                }
                taxon_docs = add_names_and_attributes_to_taxa(
                    es, taxon_asm_with_ids, opts, template=taxon_template, blanks=blanks
                )
                index_stream(
                    es, taxon_template["index_name"], taxon_docs, _op_type="update",
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
            dir_path = options["index"][data_dir]
            for types_file in sorted(Path(dir_path).glob("*.types.yaml")):
                types, data = validate_types_file(types_file, dir_path)
                LOGGER.info("Indexing %s" % types["file"]["name"])
                index_types(es, index, types, options["index"])
                index_file(
                    es,
                    types,
                    data,
                    {**options["index"], "index": index, "index_types": index_types},
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
