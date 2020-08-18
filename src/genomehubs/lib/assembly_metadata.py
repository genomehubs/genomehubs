#!/usr/bin/env python3

"""Assembly metadata methods."""

import sys
from collections import defaultdict

import ujson
from tolkein import toinsdc
from tolkein import tolog

from .es_functions import EsQueryBuilder
from .es_functions import index_exists
from .hub import add_attributes
from .hub import index_templator
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
                assembly["assembly_id"] = assembly["gca_accession"]
                yield assembly


def query_keyword_value_template(es, template_name, keyword, values, index):
    """Run query using a by_keyword_value template."""
    if not index_exists(es, index):
        return None
    multisearch = False
    body = ""
    if isinstance(values, list):
        multisearch = True
    else:
        values = [values]
    for value in values:
        if multisearch:
            body += "{}\n"
        body += ujson.dumps(
            {"id": template_name, "params": {"keyword": keyword, "value": value}}
        )
        body += "\n"
    if multisearch:
        return es.msearch_template(body=body, index=index)

    if multisearch:
        return es.search_template(body=body, index=index)


def query_value_template(es, template_name, values, index):
    """Run query using a by_value template."""
    if not index_exists(es, index):
        return None
    multisearch = False
    body = ""
    if isinstance(values, list):
        multisearch = True
    else:
        values = [values]
    for value in values:
        if multisearch:
            body += "{}\n"
        body += ujson.dumps({"id": template_name, "params": {"value": value}})
        body += "\n"
    if multisearch:
        return es.msearch_template(body=body, index=index)

    if multisearch:
        return es.search_template(body=body, index=index)


def get_list_entries_by_dict_value(values, list_of_dicts, *, key="key"):
    """Get entries from a list of dicts by key."""
    entries = []
    for entry in list_of_dicts:
        if key in entry and entry[key] in values:
            entries.append(entry)
    return entries


def preprocess_batch(es, batch, opts, *, taxonomy_name="ncbi"):
    """Preprocess a batch of assembly metadata to add/update taxonomy information."""
    template = index_template(taxonomy_name, opts)
    taxon_template = taxon_index_template(taxonomy_name, opts)
    taxonomy_template = taxonomy_index_template(taxonomy_name, opts)
    values = []
    asm_by_taxon_id = defaultdict(list)
    for idx, asm_meta in enumerate(batch):
        if asm_meta["taxon_id"] not in asm_by_taxon_id:
            values.append(asm_meta["taxon_id"])
        asm_by_taxon_id[asm_meta["taxon_id"]].append(idx)
    taxon_res = query_keyword_value_template(
        es,
        "attributes_by_keyword_value",
        "taxon_id",
        values,
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
    update_taxa = {}
    values = []
    for taxon_id, assemblies in asm_by_taxon_id.items():
        if taxon_id in taxa:
            update_taxa[taxon_id] = taxa[taxon_id]
            for asm_meta in assemblies:
                update_taxa[taxon_id]["attributes"].append(
                    {"key": "assembly_span", "integer_value": asm_meta["assembly_span"]}
                )
        else:
            values.append(taxon_id)
    taxonomy_res = query_value_template(
        es, "taxonomy_node_by_taxon_id", values, taxonomy_template["index_name"],
    )
    if taxonomy_res is None:
        LOGGER.error(
            "Could not connect to taxonomy index '%s'", taxonomy_template["index_name"]
        )
        sys.exit(1)
    create_taxa = {}
    for taxonomy_result in taxonomy_res["responses"]:
        if taxonomy_result["hits"]["total"]["value"] == 1:
            source = taxonomy_result["hits"]["hits"][0]["_source"]
            create_taxa[source["taxon_id"]] = source
    for taxon_id, assemblies in asm_by_taxon_id.items():
        if taxon_id in create_taxa:
            create_taxa[taxon_id]["attributes"] = []
            taxon_attributes = defaultdict(list)
            shared_attributes = {"assembly_span"}
            for idx in assemblies:
                asm_meta = batch[idx]
                attributes = get_list_entries_by_dict_value(
                    shared_attributes, asm_meta["attributes"]
                )
                for attr in attributes:
                    taxon_attr = {**attr}
                    del taxon_attr["key"]
                    taxon_attr["source_index"] = template["index_name"]
                    taxon_attr["source_doc_id"] = (
                        "assembly-%s" % asm_meta["assembly_id"]
                    )
                    taxon_attributes[attr["key"]].append(taxon_attr)
            for key, values in taxon_attributes.items():
                create_taxa[taxon_id]["attributes"].append(
                    {"key": key, "values": values}
                )
        else:
            LOGGER.error(
                "Could not find taxon_id '%s' in taxonomy index '%s'",
                taxon_id,
                taxonomy_template["index_name"],
            )
    LOGGER.info(update_taxa)
    LOGGER.info(create_taxa)
    # LOGGER.info(len(asm_by_taxon_id.keys()))


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
    while True:
        try:
            raw_meta = next(stream)
            attributes = add_attributes(
                raw_meta,
                template["types"]["attributes"],
                attributes=[],
                source=sources.get(metadata_name, metadata_name),
            )
            asm_meta = {**raw_meta, "attributes": attributes}
            batch.append(asm_meta)
        except TypeError:
            break
        except StopIteration:
            break
        if len(batch) == opts["es-batch"]:
            # TODO: set attributes
            preprocess_batch(es, batch, opts, taxonomy_name=taxonomy_name)
            batch = []
            break
    return
