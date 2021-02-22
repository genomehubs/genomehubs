#!/usr/bin/env python3
"""Wikidata functions."""

import gzip
import re
import sys
import time
from collections import Counter
from datetime import datetime
from datetime import timedelta

import ujson
from Bio import SeqIO
from SPARQLWrapper import JSON
from SPARQLWrapper import SPARQLWrapper
from tolkein import tofetch
from tolkein import tofile
from tolkein import tolog
from tqdm import tqdm

LOGGER = tolog.logger(__name__)

SPARQL = SPARQLWrapper(
    "https://query.wikidata.org/sparql",
    agent="Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.11 (KHTML, like Gecko) Chrome/23.0.1271.64 Safari/537.11",
)
WD = "http://www.wikidata.org/entity/"
ITEM = re.compile(r"^Q\d+$")
LAST = datetime.now()

SOURCES = {
    "BOLD": {
        "source": "BOLD Systems taxon ID",
        "stub": "http://www.boldsystems.org/index.php/TaxBrowser_TaxonPage?taxid=",
    },
    "GBIF": {"source": "GBIF taxonKey", "stub": "https://www.gbif.org/species/"},
    "NBN": {"source": "NBN System Key", "stub": "https://data.nbn.org.uk/Taxa/"},
    "WIKIDATA": {
        "source": "Wikidata item ID",
        "stub": "https://www.wikidata.org/wiki/",
    },
    "NCBI": {
        "source": "NCBI taxonomy ID",
        "stub": "https://www.ncbi.nlm.nih.gov/Taxonomy/Browser/wwwtax.cgi?mode=Info&id=",
    },
}


def throttle_queries():
    """Make sure at least 0.2s elapses between queries."""
    global LAST
    current = datetime.now()
    delta = current - LAST
    while delta.total_seconds() < 0.2:
        time.sleep(0.1)
        current = datetime.now()
        delta = current - LAST
    LAST = current


def fetch_wikidata_root(params):
    """Fetch wikidata root taxon."""
    root = params.get("root", None)
    SPARQL.setQuery(
        """
SELECT ?name ?rankLabel WHERE {
  wd:Q241515 wdt:P225 ?name .
  wd:Q241515 wdt:P105 ?rank .
  SERVICE wikibase:label { bd:serviceParam wikibase:language "[AUTO_LANGUAGE],en". }
}
"""
    )
    SPARQL.setReturnFormat(JSON)
    throttle_queries()
    data = SPARQL.query().convert()
    results = data["results"]["bindings"]
    if not results:
        LOGGER.error("%s is not a recognised taxon", root)
        sys.exit(1)
    return results[0]


def fetch_wikidata_taxa(params):
    """Fetch wikidata taxon entries."""
    root = params.get("root", None)
    SPARQL.setQuery(
        """
SELECT ?item ?name ?rankLabel ?GBIF ?NCBI ?BOLD ?NBN WHERE {
  ?item wdt:P171 wd:%s .
  ?item wdt:P225 ?name .
  ?item wdt:P105 ?rank .
  OPTIONAL {
?item wdt:P846 ?GBIF .}
    OPTIONAL {
?item wdt:P685 ?NCBI .
    } OPTIONAL {
?item wdt:P3606 ?BOLD .
    } OPTIONAL {?item wdt:P3240 ?NBN .}
  SERVICE wikibase:label { bd:serviceParam wikibase:language "[AUTO_LANGUAGE],en". }
}
LIMIT 1000
"""
        % root
    )
    SPARQL.setReturnFormat(JSON)
    throttle_queries()
    data = SPARQL.query().convert()
    results = data["results"]["bindings"]
    return results


def stream_wikidata_taxa(root=None, lineage=None):
    """Stream wikidata taxon entries."""
    if lineage is None:
        lineage = {}
    params = {"root": root}
    root_taxon = fetch_wikidata_root(params)
    lineage.update({root_taxon["rankLabel"]["value"]: root_taxon["name"]["value"]})
    results = fetch_wikidata_taxa(params)
    if results:
        for result in results:
            root = result["item"]["value"].replace(WD, "")
            yield root, result, lineage
            rank = result["rankLabel"]["value"]
            name = result["name"]["value"]
            if rank != "subspecies":
                yield from stream_wikidata_taxa(
                    root=root, lineage={**lineage, rank: name}
                )


def prepare_xref_rows(key, meta, lineage):
    """Convert identifiers to a set of rows for output."""
    ranks = [
        "subspecies",
        "species",
        "genus",
        "family",
        "order",
        "class",
        "subphylum",
        "phylum",
    ]
    dbs = ["NCBI", "GBIF", "BOLD", "NBN"]
    rows = []
    common = {}
    for rank in ranks:
        if rank in lineage:
            common.update({rank: lineage[rank]})
    if "NCBI" in meta:
        common.update({"ncbiTaxonId": meta["NCBI"]["value"]})
        common.update({"taxonId": meta["NCBI"]["value"]})
    else:
        common.update({"taxonId": key})
    rank = meta["rankLabel"]["value"]
    name = meta["name"]["value"]
    common.update({rank: name})
    common.update({"wikidataTaxonId": key})
    # TODO: set source attributes properly
    row = {**common}
    row.update(
        {
            "xref": "%s:%s" % ("WIKIDATA", key),
            "source": SOURCES["WIKIDATA"]["source"],
            "sourceStub": SOURCES["WIKIDATA"]["stub"],
            "sourceSlug": key,
        }
    )
    rows.append(row)
    for db in dbs:
        if db in meta:
            row = {**common}
            slug = str(meta[db]["value"])
            row.update(
                {
                    "xref": "%s:%s" % (db, slug),
                    "source": SOURCES[db]["source"],
                    "sourceStub": SOURCES[db]["stub"],
                    "sourceSlug": slug,
                }
            )
            rows.append(row)
    return rows


def wikidata_parser(_params, opts):
    """Parse WikiData taxa and identifiers."""
    parsed = []
    for root in opts["wikidata-root"]:
        if not ITEM.match(root):
            LOGGER.error("%s is not a valid WikiData item.", root)
            sys.exit(1)
        for key, meta, lineage in stream_wikidata_taxa(root):
            # print(lineage)
            # print(
            #     "%s: %s (%s)" % (key, meta["name"]["value"], meta["rankLabel"]["value"])
            # )
            # identifiers = fetch_gbif_identifiers(key, xrefs=opts["gbif-xref"])
            parsed += prepare_xref_rows(key, meta, lineage)
    return parsed
