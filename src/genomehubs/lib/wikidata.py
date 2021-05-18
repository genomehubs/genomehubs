#!/usr/bin/env python3
"""Wikidata functions."""

import re
from collections import defaultdict
from datetime import datetime

from SPARQLWrapper import JSON
from SPARQLWrapper import SPARQLWrapper
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
PROP = re.compile(r"(<|>|\"|direct\/)")
LAST = datetime.now()

RANKS = [
    "subspecies",
    "species",
    "genus",
    "family",
    "order",
    "class",
    "subphylum",
    "phylum",
    "kingdom",
    "superkingdom",
]

# PROPERTIES = {
#     "P225": taxon name
#     "P105": taxon rank
#     "P171": parent taxon
#     "P3606": BOLD Systems taxon ID
#     "P846": GBIF taxonKey
#     "P3240": NBN System Key
#     "P685": NCBI taxonomy ID
# }

SOURCES = {
    "bold": {
        "property": "P3606",
        "source": "BOLD",
        "display_name": "BOLD Systems taxon ID",
        "stub": "http://www.boldsystems.org/index.php/TaxBrowser_TaxonPage?taxid=",
    },
    "gbif": {
        "property": "P846",
        "source": "GBIF",
        "display_name": "GBIF taxonKey",
        "stub": "https://www.gbif.org/species/",
    },
    "nbn": {
        "property": "P3240",
        "source": "NBN",
        "display_name": "NBN System Key",
        "stub": "https://data.nbn.org.uk/Taxa/",
    },
    "ncbi": {
        "property": "P685",
        "source": "NCBI",
        "display_name": "NCBI taxonomy ID",
        "stub": "https://www.ncbi.nlm.nih.gov/Taxonomy/Browser/wwwtax.cgi?mode=Info&id=",
    },
    "wikidata": {
        "property": None,
        "source": "Wikidata",
        "display_name": "Wikidata entity",
        "stub": "https://www.wikidata.org/wiki/",
    },
}

# useful wikidata entities:
# Q16521 = taxon
# Q427626 = taxonomic rank

# useful wikidata properties:
# P31 = instance of
# P225 = taxon name
# P105 = taxon rank
# P171 = parent taxon
# P3606 = BOLD Systems taxon ID
# P846 = GBIF taxonKey
# P3240 = NBN System Key
# P685 = NCBI taxonomy ID

# grep -w 'P225\|P105\|P171\|P3606\|P846\|P3240\|P685'


def load_wikidata_dump(filename, rank_entities, *, roots=None):
    """Load data from a wikidata dump file."""
    props = defaultdict(dict)
    return_props = {}
    with tofile.open_file_handle(filename) as fh:
        LOGGER.info("Reading wikidata triples")
        for line in tqdm(fh):
            parts = PROP.split(line)
            if len(parts) != 15:
                continue
            entity = parts[2]
            prop = parts[8]
            value = parts[12]
            props[entity].update({prop: value})
    LOGGER.info("Inferring lineages")
    for entity, entity_props in tqdm(props.items()):
        # if "lineage" in entity_props and entity_props["lineage"]:
        #     if "target" in entity_props["lineage"]:
        #         includes_target = True
        #     if roots is None or includes_target:
        #         return_props[entity] = props[entity]
        #     continue
        lineage = {}
        ancestors = set()
        # entity_props["lineage"] = {}
        # lineages = [entity_props["lineage"]]
        includes_target = False
        parent = entity_props.get("P171", None)
        while parent is not None:
            if parent not in props or parent == entity or parent in ancestors:
                break
            ancestors.add(parent)
            parent_props = props[parent]
            parent_rank = parent_props.get("P105", None)
            if (
                parent_rank is not None
                and parent_rank in rank_entities
                and rank_entities[parent_rank] in RANKS
            ):
                parent_name = parent_props.get("P225", None)
                if parent_name is not None:
                    # for lineage in lineages:
                    lineage.update({rank_entities[parent_rank]: parent_name})
                    if roots is not None and parent_name in roots:
                        includes_target = True
                        lineage.update({"target": True})
            if "lineage" in parent_props and parent_props["lineage"]:
                if "target" in parent_props["lineage"]:
                    includes_target = True
                # for lineage in lineages:
                lineage = {**lineage, **parent_props["lineage"]}
                break
            # else:
            #     parent_props["lineage"] = {}
            #     lineages.append(parent_props["lineage"])
            parent = parent_props.get("P171", None)
        if lineage:
            entity_props["lineage"] = lineage
        # if not entity_props["lineage"]:
        entity_name = entity_props.get("P225", "")
        if entity_name in roots:
            includes_target = True
        if roots is None or includes_target:
            return_props[entity] = props[entity]
    return return_props


def fetch_wikidata_rank_entities():
    """Fetch wikidata entities for given rank names."""
    SPARQL.setQuery(
        """
SELECT ?item ?itemLabel WHERE {
  ?item wdt:P31 wd:Q427626 .
  SERVICE wikibase:label { bd:serviceParam wikibase:language "[AUTO_LANGUAGE],en". }
}
"""
    )
    SPARQL.setReturnFormat(JSON)
    data = SPARQL.query().convert()
    results = data["results"]["bindings"]
    entities = {}
    ranks = {}
    for result in results:
        entities.update({result["item"]["value"]: result["itemLabel"]["value"]})
        ranks.update({result["itemLabel"]["value"]: result["item"]["value"]})
    return entities, ranks


def prepare_xref_rows(key, meta, entities):
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
    try:
        lineage = meta["lineage"]
    except KeyError:
        lineage = {}

    rows = []
    common = {}
    for db in SOURCES.keys():
        common.update({db: "None"})
    entity = key.replace(WD, "")
    for rank in ranks:
        if rank in lineage:
            common.update({rank: lineage[rank]})
    if SOURCES["ncbi"]["property"] in meta:
        common.update({"ncbiTaxonId": meta[SOURCES["ncbi"]["property"]]})
        common.update({"taxonId": meta[SOURCES["ncbi"]["property"]]})
    else:
        common.update({"taxonId": entity})
    if "P225" in meta:
        name = meta["P225"]
        if "P105" in meta and meta["P105"] in entities:
            rank = entities[meta["P105"]]
            common.update({rank: name})
    common.update({"wikidataTaxonId": entity})
    row = {**common}
    for db in SOURCES.keys():
        if SOURCES[db]["property"] is None or SOURCES[db]["property"] in meta:
            row = {**common}
            if SOURCES[db]["property"] is None:
                slug = entity
            else:
                slug = str(meta[SOURCES[db]["property"]])
            row.update(
                {
                    db: slug,
                    "source": SOURCES[db]["source"],
                    "sourceStub": SOURCES[db]["stub"],
                }
            )
            rows.append(row)
    return rows


def wikidata_parser(_params, opts, *, types=None, names=None):
    """Parse WikiData taxa and identifiers."""
    if names is None:
        names = {}
    if "taxon_names" not in names:
        names["taxon_names"] = {}
    for db, values in SOURCES.items():
        names["taxon_names"][db] = {
            "display_name": values["display_name"],
            "header": db,
            "xref": True,
        }
    parsed = []
    entities, ranks = fetch_wikidata_rank_entities()
    roots = opts.get("wikidata-root", None)
    data = load_wikidata_dump(opts["wikidata"], entities, roots=roots)
    for key, meta in data.items():
        parsed += prepare_xref_rows(key, meta, entities)
    return parsed
