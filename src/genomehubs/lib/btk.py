#!/usr/bin/env python3
"""Wikidata functions."""

import ujson
from tolkein import tofetch
from tolkein import tolog

LOGGER = tolog.logger(__name__)

BTK_API = "https://blobtoolkit.genomehubs.org/api/v1"
BTK_VIEW = "https://blobtoolkit.genomehubs.org/view"


def fetch_btk_datasets(params):
    """Fetch wikidata taxon entries."""
    root = params.get("root", "Eukaryota")
    url = "%s/search/%s" % (BTK_API, root)
    page = tofetch.fetch_url(url)
    datasets = ujson.decode(page)
    return datasets


def stream_btk_datasets(root=None):
    """Stream wikidata taxon entries."""
    params = {"root": root}
    datasets = fetch_btk_datasets(params)
    if datasets:
        for dataset in datasets:
            yield dataset["id"], dataset


def extract_btk_stats(meta):
    """Extract BlobToolKit stats to top level."""
    summaryStats = meta.pop("summaryStats", {})
    meta["source"] = "BlobToolKit"
    meta["sourceSlug"] = meta["id"]
    meta["sourceStub"] = "https://blobtoolkit.genomehubs.org/view/dataset/"
    # meta["xref"] = "BTK:%s" % meta["id"]
    if "busco" in summaryStats:
        for busco_lineage, busco_stats in summaryStats["busco"].items():
            meta["busco_lineage"] = busco_lineage
            meta["busco_string"] = busco_stats["string"]
            meta["busco_complete"] = busco_stats["c"] / busco_stats["t"] * 100
            break
    if "stats" in summaryStats:
        meta["nohit"] = summaryStats["stats"]["noHit"] * 100
        meta["target"] = summaryStats["stats"]["target"] * 100
    if "baseComposition" in summaryStats:
        meta["at_percent"] = summaryStats["baseComposition"]["at"] * 100
        meta["gc_percent"] = summaryStats["baseComposition"]["gc"] * 100
        meta["n_percent"] = summaryStats["baseComposition"]["n"] * 100
    if len(meta["taxon_name"]) > len(meta["species"]):
        meta["subspecies"] = meta["taxon_name"]


def describe_btk_files(meta):
    """Generate analysis descriptions and links for BlobToolKit."""
    plots = ["cumulative", "snail"]
    summaryStats = meta.get("summaryStats", {})
    if "readMapping" in summaryStats and summaryStats["readMapping"]:
        plots.append("blob")
    files = []
    for plot in plots:
        if plot == "blob":
            url = "%s/image/%s/%s/circle?format=png" % (BTK_API, meta["id"], plot)
        else:
            url = "%s/image/%s/%s?format=png" % (BTK_API, meta["id"], plot)
        obj = {
            "name": "%s.png" % plot,
            "url": url,
            "link": "%s/%s/dataset/%s/%s" % (BTK_VIEW, meta["id"], meta["id"], plot),
            "analysis_id": "btk-%s" % meta["id"],
            "description": "a %s plot from BlobToolKit analysis %s"
            % (plot, meta["id"]),
            "title": "%s plot %s" % (plot, meta["id"]),
            "command": "blobtoolkit pipeline",
            "assembly_id": meta["accession"],
            "taxon_id": str(meta["taxid"]),
            "analysis": {
                "name": "BlobToolKit",
                "title": "BlobToolKit analysis of %s" % meta["accession"],
                "description": "Analysis of public assembly %s using BlobToolKit"
                % meta["accession"],
            },
        }
        files.append(obj)
    return files


def btk_parser(_params, opts):
    """Parse BlobToolKit assemblies."""
    parsed = []
    analyses = []
    for root in opts["btk-root"]:
        for key, meta in stream_btk_datasets(root):
            files = describe_btk_files(meta)
            analyses += files
            extract_btk_stats(meta)
            # TODO: set xref
            # TODO: add to file/analysis index
            # print(lineage)
            # print(
            #     "%s: %s (%s)" % (key, meta["name"]["value"], meta["rankLabel"]["value"])
            # )
            # identifiers = fetch_gbif_identifiers(key, xrefs=opts["gbif-xref"])
            # parsed += prepare_xref_rows(key, meta, lineage)
            parsed.append(meta)
    return (parsed, analyses)
