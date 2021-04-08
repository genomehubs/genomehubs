#!/usr/bin/env python3
"""NCBI functions."""

import ujson
from tolkein import tofetch
from tolkein import tolog

LOGGER = tolog.logger(__name__)

GBIF_API = "https://www.gbif.org/api"


def fetch_gbif_taxlist(params):
    """Fetch gbif taxon entries."""
    limit = params.get("limit", 5)
    offset = params.get("offset", 0)
    highertaxon_key = params.get("root", None)
    url = (
        "%s/species/search?advanced=false&rank=SPECIES&rank=SUBSPECIES&status=ACCEPTED&status=DOUBTFUL"
        % GBIF_API
    )
    if highertaxon_key is not None:
        url += "&highertaxon_key=%s" % highertaxon_key
    url += "&limit=%d&offset=%d" % (limit, offset)
    page = tofetch.fetch_url(url)
    data = ujson.decode(page)
    return data


def stream_gbif_taxa(root=None):
    """Stream gbif taxon entries."""
    params = {"root": root, "limit": 50, "offset": 0}
    data = {"results": [], "endOfRecords": False}
    while not data["endOfRecords"]:
        data = fetch_gbif_taxlist(params)
        for entry in data.get("results", []):
            yield (entry["key"], entry)
        params["offset"] += params["limit"]


def prepare_xref_rows(identifiers, meta):
    """Convert identifiers to a set of rows for output."""
    rows = []
    common = {"species": meta["species"]}
    if "family" in meta:
        common.update({"family": meta["family"]})
    if "subspecies" in meta:
        common.update({"subspecies": meta["subspecies"]})
    if "NCBI" in identifiers:
        common.update({"ncbiTaxonId": identifiers["NCBI"]["id"]})
    else:
        common.update({"gbifTaxonId": "GBIF:%s" % identifiers["GBIF"]["id"]})
    for db, entry in identifiers.items():
        row = {**common}
        row.update({"xref": "%s:%s" % (db, str(entry["id"]))})
        row.update({"sourceUrl": entry["url"]})
        row.update({"source": entry["source"]})
        row.update({"sourceSlug": entry["id"]})
        row.update({"sourceStub": entry["url"].replace(str(entry["id"]), "")})
        rows.append(row)
    return rows


def fetch_gbif_identifiers(taxon, *, xrefs=None):
    """Fetch gbif identifiers for a taxon."""
    if xrefs is None:
        xrefs = []
    xrefs = set(["NCBI"] + xrefs)
    url = "%s/wikidata/species/%s?locale=en" % (GBIF_API, str(taxon))
    page = tofetch.fetch_url(url)
    identifiers = {
        "GBIF": {
            "id": taxon,
            "url": "https://www.gbif.org/species/%s" % taxon,
            "source": "GBIF taxonKey",
        }
    }
    if page is not None:
        data = ujson.decode(page)
        for entry in data.get("identifiers", []):
            label = entry.get("label", {}).get("value", "None")
            db = label.split(" ")[0]
            if db in xrefs:
                identifiers.update(
                    {db: {"id": entry["id"], "url": entry["url"], "source": label}}
                )
    return identifiers


def gbif_parser(_params, opts, *args, **kwargs):
    """Parse GBIF taxa and identifiers."""
    parsed = []
    for root in opts["gbif-root"]:
        for key, meta in stream_gbif_taxa(root):
            identifiers = fetch_gbif_identifiers(key, xrefs=opts["gbif-xref"])
            parsed += prepare_xref_rows(identifiers, meta)
    return parsed
