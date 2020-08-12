#!/usr/bin/env python3

"""Taxon methods."""

from pathlib import Path

from tolkein import tofetch
from tolkein import tolog
from tolkein import totax

from .es_functions import EsQueryBuilder
from .hub import add_attributes
from .hub import index_templator
from .taxonomy import index_template as taxonomy_index_template

LOGGER = tolog.logger(__name__)


def index_template(taxonomy_name, opts):
    """Index template (includes name, mapping and types)."""
    parts = ["taxon", taxonomy_name, opts["hub-name"], opts["hub-version"]]
    template = index_templator(parts, opts)
    return template


def lookup_taxon_by_taxid(es, taxon_id, taxonomy_template):
    """Lookup taxon in taxonomy index by taxon_id."""
    query = EsQueryBuilder()
    query.es_match("taxon_id", taxon_id)
    with tolog.DisableLogger():
        res = es.search(index=taxonomy_template["index_name"], body=query.write())
    if res["hits"]["total"]["value"] == 1:
        return res["hits"]["hits"][0]["_source"]
    return None


def parse_taxa(es, types, taxonomy_template):
    """Test method to parse taxa."""
    taxa = [
        {
            "taxon_id": 110368,
            "assembly_span": 12344567,
            "c_value": 2.5,
            "sex_determination_system": "N/A",
        },
        {
            "taxon_id": 13037,
            "assembly_span": 2345678,
            "c_value": 2.3,
            "sex_determination_system": "XO",
        },
        {
            "taxon_id": 113334,
            "assembly_span": 45678912,
            "c_value": 4.6,
            "sex_determination_system": "XY",
        },
    ]
    for entry in taxa:
        # attributes = {}
        taxon_id = str(entry["taxon_id"])
        # TODO: look up taxonomy here
        doc = lookup_taxon_by_taxid(es, taxon_id, taxonomy_template)
        if doc is None:
            LOGGER.warning(
                "No %s taxonomy record for %s",
                taxonomy_template["index_name"],
                taxon_id,
            )
        attributes = add_attributes(entry, types, attributes=[])
        doc.update({"taxon_id": taxon_id, "attributes": attributes})
        doc_id = "taxon_id-%s" % taxon_id
        yield doc_id, doc


def index(es, taxonomy_name, opts):
    """Index a set of taxa."""
    LOGGER.info("Indexing taxa using %s taxonomy", taxonomy_name)
    template = index_template(taxonomy_name, opts)
    taxonomy_template = taxonomy_index_template(taxonomy_name, opts)
    stream = parse_taxa(es, template["types"], taxonomy_template)
    # query = EsQueryBuilder()
    # query.es_range("assembly_span", [1000000, 3000000]).es_match(
    #     "taxon_id", 12345
    # ).es_or()
    # print(query.write())
    # query = EsQueryBuilder()
    # query.es_range("attributes.integer_value", [1000000, 3000000]).es_match(
    #     "attributes.key", "assembly_span"
    # ).es_nested_and("attributes").es_match("taxon_id", 12345).es_and()
    # print(query.write())
    # quit()
    return template, stream
