#!/usr/bin/env python3

"""Assembly indexing methods."""

import copy
import sys
from collections import defaultdict

from tolkein import tolog

from .es_functions import document_by_id
from .es_functions import index_stream
from .es_functions import query_keyword_value_template
from .es_functions import query_value_template
from .hub import add_attribute_values
from .hub import chunks
from .hub import index_templator
from .taxon import add_taxonomy_info_to_meta
from .taxon import find_or_create_taxa
from .taxon import index_template as taxon_index_template
from .taxon import stream_taxa
from .taxonomy import index_template as taxonomy_index_template

LOGGER = tolog.logger(__name__)


def index_template(taxonomy_name, opts):
    """Index template (includes name, mapping and types)."""
    parts = ["assembly", taxonomy_name, opts["hub-name"], opts["hub-version"]]
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


def lookup_assemblies_by_assembly_id(es, values, template, *, return_type="list"):
    """Retrieve existing taxa from index."""
    assemblies = []
    if return_type == "dict":
        assemblies = {}
    res = document_by_id(es, values, template["index_name"])
    for key, value in res.items():
        key = key.replace("assembly-", "")
        if return_type == "list":
            assemblies.append(key)
        else:
            assemblies.update({key: value})
    return assemblies


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
            add_attribute_values(doc["_source"]["attributes"], attributes, raw=False)
            doc["_source"]["taxon_id"] = assembly_data["taxon_id"]
            try:
                add_taxonomy_info_to_meta(
                    doc["_source"], taxa[assembly_data["taxon_id"]]["_source"]
                )
                yield doc["_id"], doc["_source"]
            except KeyError:
                LOGGER.warning(
                    "Taxon ID %s was not found in the taxonomy"
                    % assembly_data["taxon_id"]
                )


def add_assembly_attributes_to_taxon(
    batch, asm_by_taxon_id, taxa, *, index_name, shared_attributes
):
    """Add assembly attributes to taxon."""
    for taxon_id, assemblies in asm_by_taxon_id.items():
        if taxon_id in taxa:
            print(taxon_id)
            taxon_attributes = defaultdict(list)
            if "attributes" not in taxa[taxon_id]:
                taxa[taxon_id]["attributes"] = []
            for idx in assemblies:
                asm_meta = batch[idx]
                attributes = get_list_entries_by_dict_value(
                    shared_attributes, asm_meta["attributes"]
                )
                for attr in attributes:
                    taxon_attr = {**attr}
                    del taxon_attr["key"]
                    taxon_attr["source_index"] = index_name
                    taxon_attr["source_doc_id"] = (
                        "assembly-%s" % asm_meta["assembly_id"]
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


def get_taxa_to_create(
    es,
    batch,
    opts,
    *,
    taxonomy_name="ncbi",
    taxon_ids=None,
    asm_by_taxon_id=None,
    template=None,
    shared_attributes=None
):
    """Create a dict of taxa to create."""
    taxa_to_create = {}
    if not taxon_ids:
        return {}
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
            for idx in asm_by_taxon_id[source["taxon_id"]]:
                add_taxonomy_info_to_meta(batch[idx], source)
    add_assembly_attributes_to_taxon(
        batch,
        asm_by_taxon_id,
        taxa_to_create,
        index_name=template["index_name"],
        shared_attributes=shared_attributes,
    )
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


def preprocess_batch(es, batch, opts, *, taxonomy_name="ncbi"):
    """Preprocess a batch of assembly metadata to add/update taxonomy information."""
    template = index_template(taxonomy_name, opts)
    taxon_template = taxon_index_template(taxonomy_name, opts)
    # TODO: find shared attributes programatically
    shared_attributes = {
        "assembly_span",
        "host_scientific_name",
        "sample_location",
        "sample_sex",
    }
    taxon_ids, asm_by_taxon_id = collate_unique_key_value_indices("taxon_id", batch)
    taxon_res = query_keyword_value_template(
        es,
        "attributes_by_keyword_value",
        "taxon_id",
        taxon_ids,
        taxon_template["index_name"],
    )
    taxa = {}
    if taxon_res is not None:
        for taxon_result in taxon_res["responses"]:
            if (
                "error" not in taxon_result
                and taxon_result["hits"]["total"]["value"] == 1
            ):
                source = taxon_result["hits"]["hits"][0]["_source"]
                taxa[source["taxon_id"]] = source
                for idx in asm_by_taxon_id[source["taxon_id"]]:
                    add_taxonomy_info_to_meta(batch[idx], source)
    taxa_to_update = {}
    taxon_ids = []
    for taxon_id, assemblies in asm_by_taxon_id.items():
        if taxon_id in taxa:
            taxa_to_update[taxon_id] = {}
            if "attributes" in taxa[taxon_id]:
                taxa_to_update[taxon_id]["attributes"] = taxa[taxon_id]["attributes"]
        else:
            taxon_ids.append(taxon_id)
    add_assembly_attributes_to_taxon(
        batch,
        asm_by_taxon_id,
        taxa_to_update,
        index_name=template["index_name"],
        shared_attributes=shared_attributes,
    )
    taxa_to_create = get_taxa_to_create(
        es,
        batch,
        opts,
        taxonomy_name=taxonomy_name,
        taxon_ids=taxon_ids,
        asm_by_taxon_id=asm_by_taxon_id,
        template=template,
        shared_attributes=shared_attributes,
    )
    to_create = len(taxa_to_create.keys())
    to_update = len(taxa_to_update.keys())
    LOGGER.info(
        "%d taxa to create, %d to update", to_create, to_update,
    )
    if to_create > 0:
        index_stream(es, taxon_template["index_name"], stream_taxa(taxa_to_create))
    if to_update > 0:
        index_stream(
            es,
            taxon_template["index_name"],
            stream_taxa(taxa_to_update),
            _op_type="update",
        )
    return to_create, to_update


def stream_assemblies(assemblies):
    """Stream list of assemblies for indexing."""
    for asm in assemblies:
        yield "assembly-%s" % asm["assembly_id"], asm


def set_top_level_meta(raw_meta):
    """Set top level assembly metadata."""
    top_level = {
        "assembly_id": raw_meta["assembly_id"],
        "taxon_id": raw_meta["taxon_id"],
    }
    return top_level


# def index(es, opts, *, metadata_name="insdc", taxonomy_name="ncbi"):
#     """Index all assemblies descended from root."""
#     parsers = {"insdc": parse_insdc_metadata}
#     sources = {"insdc": "INSDC"}
#     parser = parsers.get(metadata_name.lower(), None)
#     if parser is None:
#         LOGGER.warning("No parser available for %s metadata", metadata_name)
#         return None
#     LOGGER.info("Indexing %s metadata", metadata_name)
#     template = index_template(taxonomy_name, opts)

#     stream = parser(opts)
#     batch = []
#     iteration = 1
#     while True:
#         stop = False
#         try:
#             raw_meta = next(stream)
#             attributes = add_attributes(
#                 raw_meta,
#                 template["types"]["attributes"],
#                 attributes=[],
#                 source=sources.get(metadata_name, metadata_name),
#             )
#             identifiers = add_attributes(
#                 raw_meta,
#                 template["types"]["identifiers"],
#                 attributes=[],
#                 source=sources.get(metadata_name, metadata_name),
#                 attr_type="identifiers",
#             )
#             top_level = set_top_level_meta(raw_meta)
#             asm_meta = {
#                 **top_level,
#                 "attributes": attributes,
#                 "identifiers": identifiers,
#             }
#             batch.append(asm_meta)
#         except StopIteration:
#             stop = True
#         if len(batch) == opts["es-batch"] or stop:
#             # TODO: set attributes
#             LOGGER.info("Processing batch %d with %d assemblies", iteration, len(batch))

#             created, updated = preprocess_batch(
#                 es, batch, opts, taxonomy_name=taxonomy_name
#             )
#             LOGGER.info("Indexing %d assemblies", len(batch))
#             assembly_stream = stream_assemblies(batch)
#             index_stream(es, template["index_name"], assembly_stream)
#             batch = []
#             iteration += 1
#         if stop:
#             break
#     return
