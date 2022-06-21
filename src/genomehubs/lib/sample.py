#!/usr/bin/env python3

"""Assembly and Sample indexing methods."""

import copy
from collections import defaultdict

from tolkein import tolog

from .es_functions import document_by_id
from .es_functions import query_keyword_value_template
from .hub import add_attribute_values
from .hub import chunks
from .hub import index_templator
from .taxon import add_taxonomy_info_to_meta
from .taxon import find_or_create_taxa

LOGGER = tolog.logger(__name__)


def index_template(taxonomy_name, opts, *, index_type="sample"):
    """Index template (includes name, mapping and types)."""
    parts = [index_type, taxonomy_name, opts["hub-name"], opts["hub-version"]]
    template = index_templator(parts, opts)
    return template


def get_list_entries_by_dict_value(values, list_of_dicts, *, key="key"):
    """Get entries from a list of dicts by key."""
    entries = []
    for entry in list_of_dicts:
        if key in entry and entry[key] in values:
            entries.append(entry)
    return entries


def get_list_indices_by_dict_value(values, list_of_dicts, *, key="key"):
    """Get indices from a list of dicts by key."""
    indices = []
    for idx, entry in enumerate(list_of_dicts):
        if key in entry and entry[key] in values:
            indices.append(idx)
    return indices


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


def lookup_docs_by_doc_id(es, values, template, *, return_type="list", index_type="sample"):
    """Retrieve existing taxa from index."""
    docs = []
    if return_type == "dict":
        docs = {}
    res = document_by_id(es, values, template["index_name"])
    for key, value in res.items():
        key = key.replace(f"{index_type}-", "")
        if return_type == "list":
            docs.append(key)
        else:
            docs.update({key: value})
    return docs


def add_identifiers_and_attributes_to_entries(
    es, data, opts, *, template, taxon_template, blanks=set(["NA"]), index_type="sample"
):
    """Add identifiers and attributes to entries."""
    all_entries = {}
    taxon_id_by_entry = {}
    for taxon_id, entries in data.items():
        for entry in entries:
            entry["taxon_id"] = taxon_id
            for identifier in entry["identifiers"]:
                if identifier["class"] == f"{index_type}_id":
                    all_entries[identifier["identifier"]] = entry
                    taxon_id_by_entry[identifier["identifier"]] = taxon_id
    for values in chunks(list(all_entries.keys()), 500):
        res = query_keyword_value_template(
            es,
            "attributes_identifiers_by_keyword_value",
            f"{index_type}_id",
            values,
            index=template["index_name"],
        )
        if res is None:
            res = {"responses": [{} for value in values]}
        taxon_ids = set()
        for value in values:
            taxon_ids.add(taxon_id_by_entry[value])
        taxa = find_or_create_taxa(
            es,
            opts,
            taxon_ids=taxon_ids,
            taxon_template=taxon_template,
            asm_by_taxon_id=data,
        )
        for index, response in enumerate(res["responses"]):
            doc = {
                "_id": f"{index_type}-{values[index]}",
                "_source": {
                    f"{index_type}_id": values[index],
                    "identifiers": [],
                    "attributes": [],
                },
            }
            if "hits" in response and response["hits"]["total"]["value"] == 1:
                doc = response["hits"]["hits"][0]
            doc_data = all_entries[doc["_source"][f"{index_type}_id"]]
            identifiers = copy.deepcopy(doc["_source"]["identifiers"])
            if "identifiers" in doc_data:
                identifiers = identifiers + doc_data["identifiers"]
            add_identifiers_to_list(
                doc["_source"]["identifiers"], identifiers, blanks=blanks
            )
            if "attributes" not in doc["_source"] or not doc["_source"]["attributes"]:
                doc["_source"]["attributes"] = []
            if "attributes" in doc_data:
                add_attribute_values(doc["_source"]["attributes"], doc_data["attributes"], raw=False)
            doc["_source"]["taxon_id"] = doc_data["taxon_id"]
            try:
                add_taxonomy_info_to_meta(
                    doc["_source"], taxa[doc_data["taxon_id"]]["_source"]
                )
                yield doc["_id"], doc["_source"]
            except KeyError:
                LOGGER.warning(
                    "Taxon ID %s was not found in the taxonomy"
                    % doc_data["taxon_id"]
                )


def add_entry_attributes_to_taxon(
    batch, entry_by_taxon_id, taxa, *, index_name, shared_attributes, index_type="sample"
):
    """Add entry attributes to taxon."""
    for taxon_id, entries in entry_by_taxon_id.items():
        if taxon_id in taxa:
            taxon_attributes = defaultdict(list)
            if "attributes" not in taxa[taxon_id]:
                taxa[taxon_id]["attributes"] = []
            for idx in entries:
                entry_meta = batch[idx]
                attributes = get_list_entries_by_dict_value(
                    shared_attributes, entry_meta["attributes"]
                )
                for attr in attributes:
                    taxon_attr = {**attr}
                    del taxon_attr["key"]
                    taxon_attr["source_index"] = index_name
                    taxon_attr["source_doc_id"] = (
                        f"{index_type}-{entry_meta[f'{index_type}_id']}"
                    )
                    taxon_attributes[attr["key"]].append(taxon_attr)
            for key, values in taxon_attributes.items():
                indices = get_list_indices_by_dict_value(
                    {key}, taxa[taxon_id]["attributes"]
                )
                if len(indices) == 1:
                    idx = indices[0]
                    # TODO: test if values are already present
                    taxa[taxon_id]["attributes"][idx]["values"] += values
                else:
                    taxa[taxon_id]["attributes"].append({"key": key, "values": values})


def collate_unique_key_value_indices(key, list_of_dicts):
    """Collate indices of unique key values in a list of dicts."""
    unique_key_values = set()
    entry_indices_by_key_value = defaultdict(list)
    for idx, entry in enumerate(list_of_dicts):
        if entry[key] not in unique_key_values:
            unique_key_values.add(entry[key])
        entry_indices_by_key_value[entry[key]].append(idx)
    return list(unique_key_values), entry_indices_by_key_value
