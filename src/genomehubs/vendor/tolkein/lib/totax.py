#!/usr/bin/env python3
"""Taxonomy methods."""

import re

from .tofile import open_file_handle


def parse_ncbi_nodes_dmp(path):
    """Parse NCBI format nodes.dmp file."""
    nodes = {}
    with open_file_handle(path) as fh:
        for line in fh:
            taxon_id, parent, taxon_rank, *_ignore = re.split(r"\s*\|\s*", line)
            nodes[taxon_id] = {
                "parent": parent,
                "taxon_rank": taxon_rank,
                "taxon_names": [],
            }
        nodes["1"] = {"taxon_rank": "no rank", "taxon_names": []}
    return nodes


def parse_ncbi_names_dmp(path, nodes):
    """Parse names.dmp file and add to nodes dict."""
    with open_file_handle(path) as fh:
        for line in fh:
            taxon_id, name, _unique, name_class, *_ignore = re.split(r"\s*\|\s*", line)
            if taxon_id in nodes:
                if name_class == "scientific name":
                    nodes[taxon_id].update(
                        {
                            "taxon_id": taxon_id,
                            "scientific_name": name,
                        }
                    )
                nodes[taxon_id]["taxon_names"].append(
                    {"name": name, "class": name_class}
                )


def stream_nodes(nodes, roots):
    """Add lineage info and stream taxonomy nodes."""
    for taxon_id, obj in nodes.items():
        lineage = obj.copy()
        lineage.update(
            {
                "lineage": [
                    {
                        "taxon_id": obj["taxon_id"],
                        "taxon_rank": obj["taxon_rank"],
                        "scientific_name": obj["scientific_name"],
                        "node_depth": 0,
                    }
                ]
            }
        )
        descendant = False
        if taxon_id in roots:
            descendant = True
        depth = 0
        while "parent" in obj and obj["parent"] in nodes:
            depth += 1
            parent = obj["parent"]
            obj = nodes[parent]
            lineage["lineage"].append(
                {
                    "taxon_id": obj["taxon_id"],
                    "taxon_rank": obj["taxon_rank"],
                    "scientific_name": obj["scientific_name"],
                    "node_depth": depth,
                }
            )
            if obj["taxon_id"] in roots:
                descendant = True
                break
        if descendant:
            yield "taxon-%s" % taxon_id, lineage


def parse_ncbi_taxdump(path, root=None):
    """Expand lineages from nodes dict."""
    if root is None:
        root = ["1"]
    if not isinstance(root, list):
        root = [root]
    roots = list(map(str, root))
    nodes = parse_ncbi_nodes_dmp("%s/nodes.dmp" % path)
    parse_ncbi_names_dmp("%s/names.dmp" % path, nodes)
    yield from stream_nodes(nodes, roots)


def add_xrefs(names, xrefs):
    """Add xrefs to a list of taxon names."""
    dbs = {
        "gbif": {"source": "GBIF", "stub": "https://www.gbif.org/species/"},
        "irmng": {
            "source": "IRMNG",
            "stub": "https://www.irmng.org/aphia.php?p=taxdetails&id=",
        },
        "ott": {
            "source": "OTT",
            "stub": "https://tree.opentreeoflife.org/opentree/argus/ottol@",
        },
        "ncbi": {
            "source": "NCBI",
            "stub": "https://www.ncbi.nlm.nih.gov/Taxonomy/Browser/wwwtax.cgi?id=",
        },
        "silva": {
            "source": "SILVA",
            "stub": "https://www.arb-silva.de/browser/ssu-138.1/",
        },
        "worms": {
            "source": "WoRMS",
            "stub": "http://www.marinespecies.org/aphia.php?p=taxdetails&id=",
        },
    }
    for xref in xrefs:
        source, accession = xref.split(":")
        if source in dbs:
            names.append(
                {
                    "name": accession,
                    "class": "xref",
                    "source": dbs[source]["source"],
                    "source_url_stub": dbs[source]["stub"],
                }
            )


def parse_ott_nodes_dmp(path):
    """Parse Open tree of Life taxonomy.tsv file."""
    nodes = {}
    with open_file_handle(path) as fh:
        for line in fh:
            taxon_id, parent, taxon_name, taxon_rank, source_info, *_ignore = re.split(
                r"\s*\|\s*", line
            )
            if taxon_id == "uid":
                continue
            xrefs = ["ott:%s" % taxon_id]
            taxon_id = "ott_%s" % taxon_id
            nodes[taxon_id] = {
                "parent": "ott_%s" % parent,
                "taxon_rank": taxon_rank,
                "taxon_names": [],
            }
            if taxon_name:
                nodes[taxon_id].update(
                    {
                        "taxon_id": taxon_id,
                        "scientific_name": taxon_name,
                    }
                )
                nodes[taxon_id]["taxon_names"].append(
                    {"name": taxon_name, "class": "scientific_name"}
                )
            if source_info:
                xrefs += [re.sub(r"#\d+", "", xref) for xref in source_info.split(",")]
            add_xrefs(nodes[taxon_id]["taxon_names"], xrefs)
    return nodes


def parse_ott_names_dmp(path, nodes):
    """Parse synonyms.tsv file and add to nodes dict."""
    with open_file_handle(path) as fh:
        for line in fh:
            name, taxon_id, name_class, *_ignore = re.split(r"\s*\|\s*", line)
            if taxon_id == "uid":
                continue
            taxon_id = "ott_%s" % taxon_id
            if taxon_id in nodes:
                nodes[taxon_id]["taxon_names"].append(
                    {"name": name, "class": name_class}
                )


def parse_ott_taxdump(path, root=None):
    """Expand lineages from nodes dict."""
    if root is None:
        root = ["ott_805080"]
    if not isinstance(root, list):
        root = [root]
    roots = list(map(str, root))
    nodes = parse_ott_nodes_dmp("%s/taxonomy.tsv" % path)
    parse_ott_names_dmp("%s/synonyms.tsv" % path, nodes)
    yield from stream_nodes(nodes, roots)


def parse_taxonomy(taxonomy_type, path, root=None):
    """Parse taxonomy into list of dicts."""
    parsers = {"ncbi": parse_ncbi_taxdump, "ott": parse_ott_taxdump}
    parser = parsers.get(taxonomy_type.lower(), None)
    if parser is None:
        return None
    return parser(path, root)
