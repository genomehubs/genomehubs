#!/usr/bin/env python3

"""Assembly metadata methods."""

import sys
from collections import defaultdict

from tolkein import toinsdc
from tolkein import tolog

from .es_functions import index_stream
from .es_functions import query_keyword_value_template
from .es_functions import query_value_template
from .hub import add_attributes
from .hub import index_templator
from .taxon import add_taxonomy_info_to_meta
from .taxon import index_template as taxon_index_template
from .taxonomy import index_template as taxonomy_index_template

LOGGER = tolog.logger(__name__)


def index_template(taxonomy_name, opts):
    """Index template (includes name, mapping and types)."""
    parts = ["assembly", taxonomy_name, opts["hub-name"], opts["hub-version"]]
    template = index_templator(parts, opts)
    return template


def parse_insdc_metadata(opts):
    """Prepare INSDC metadata for indexing."""
    roots = opts.get("insdc-root", [1])
    if not isinstance(roots, list):
        roots = [roots]
    for root in roots:
        root = str(root)
        count = 0
        if root.startswith("GCA_"):
            LOGGER.warning(
                "Indexing assembly metadata GCA accession not yet implemented"
            )
            break
        elif root.isdigit():
            LOGGER.info("Indexing assembly metadata for taxid %s", root)
            count = toinsdc.count_taxon_assembly_meta(root)
        else:
            LOGGER.warning("%s is not a valid value for `insdc-root`", root)
        if count > 0:
            LOGGER.info("Indexing metadata for %d assemblies", count)
            assemblies = toinsdc.stream_taxon_assembly_meta(root)
            for assembly in assemblies:
                if assembly["genome_representation"] != "full":
                    continue
                assembly["assembly_id"] = "%s.%s" % (
                    assembly["gca_accession"],
                    assembly["assembly_version"],
                )
                yield assembly


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


def add_assembly_attributes_to_taxon(
    batch, asm_by_taxon_id, taxa, *, index_name, shared_attributes
):
    """Add assembly attributes to taxon."""
    for taxon_id, assemblies in asm_by_taxon_id.items():
        if taxon_id in taxa:
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


def stream_taxa(taxa):
    """Stream dict of taxa for indexing."""
    for taxon_id, value in taxa.items():
        yield "taxon_id-%s" % taxon_id, value


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


def index(es, opts, *, metadata_name="insdc", taxonomy_name="ncbi"):
    """Index all assemblies descended from root."""
    parsers = {"insdc": parse_insdc_metadata}
    sources = {"insdc": "INSDC"}
    parser = parsers.get(metadata_name.lower(), None)
    if parser is None:
        LOGGER.warning("No parser available for %s metadata", metadata_name)
        return None
    LOGGER.info("Indexing %s metadata", metadata_name)
    template = index_template(taxonomy_name, opts)

    stream = parser(opts)
    batch = []
    iteration = 1
    while True:
        stop = False
        try:
            raw_meta = next(stream)
            attributes = add_attributes(
                raw_meta,
                template["types"]["attributes"],
                attributes=[],
                source=sources.get(metadata_name, metadata_name),
            )
            identifiers = add_attributes(
                raw_meta,
                template["types"]["identifiers"],
                attributes=[],
                source=sources.get(metadata_name, metadata_name),
                attr_type="identifiers",
            )
            top_level = set_top_level_meta(raw_meta)
            asm_meta = {
                **top_level,
                "attributes": attributes,
                "identifiers": identifiers,
            }
            batch.append(asm_meta)
        except StopIteration:
            stop = True
        if len(batch) == opts["es-batch"] or stop:
            # TODO: set attributes
            LOGGER.info("Processing batch %d with %d assemblies", iteration, len(batch))

            created, updated = preprocess_batch(
                es, batch, opts, taxonomy_name=taxonomy_name
            )
            LOGGER.info("Indexing %d assemblies", len(batch))
            assembly_stream = stream_assemblies(batch)
            index_stream(es, template["index_name"], assembly_stream)
            batch = []
            iteration += 1
        if stop:
            break
    return
