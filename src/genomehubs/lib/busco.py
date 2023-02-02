#!/usr/bin/env python3
"""NCBI functions."""

import copy
import glob
import gzip
import os
import tarfile

from tolkein import tofile
from tolkein import tolog

LOGGER = tolog.logger(__name__)


def parse_busco_header(header):
    """Parse a BUSCO full table header."""


def parse_busco_record(record, parsed):
    """Parse a single BUSCO full table record."""
    busco_id, status = record.split("\t")[:2]
    if status == "Missing":
        parsed["missing"].append(busco_id)
    elif status == "Fragmented":
        parsed["fragmented"].append(busco_id)
    else:
        parsed["complete"].append(busco_id)
    return


def do_replace(item, query, replace):
    """Recursively replace all instances of query string."""
    if isinstance(item, dict):
        matched_keys = {}
        for key, value in item.items():
            item[key] = do_replace(value, query, replace)
            if query in key:
                matched_keys[key] = do_replace(key, query, replace)
        for key, new_key in matched_keys.items():
            item[new_key] = item[key]
            del item[key]
    elif isinstance(item, list):
        item = [do_replace(value, query, replace) for value in item]
    elif isinstance(item, str):
        item = item.replace(query, replace)
    return item


def deep_replace(obj, query, replace):
    """Replace all instances of query string in obj."""
    new_obj = copy.deepcopy(obj)
    new_obj = do_replace(new_obj, query, replace)
    return new_obj


def busco_parser(params, opts, *, types=None, names=None):
    """Parse NCBI Datasets genome report."""
    parsed = []
    template_keys = set()
    expanded_keys = set()
    for d in glob.glob(f"{opts['busco']}/*/", recursive=False):
        d = os.path.abspath(d)
        if os.path.exists(f"{d}/config.yaml"):
            config = tofile.load_yaml(f"{d}/config.yaml")
            taxid = config["taxon"]["taxid"]
            accession = config["assembly"]["accession"]
            prefix = config["assembly"]["prefix"]
            parsed_row = {"taxon_id": taxid, "assembly_id": accession}
            for busco_lineage in config["busco"]["lineages"]:
                lineage = busco_lineage.split("_")[0]
                parsed_lineage = {"complete": [], "fragmented": [], "missing": []}
                header = None
                header_rows = []
                tar = tarfile.open(f"{d}/{prefix}.busco.{busco_lineage}.tar")
                data = gzip.decompress(
                    tar.extractfile(
                        f"{prefix}.busco.{busco_lineage}/full_table.tsv.gz"
                    ).read()
                )
                for line in str(data, "utf-8").split("\n"):
                    if not line:
                        continue
                    if line.startswith("#"):
                        header_rows.append(line)
                        continue
                    if header is None:
                        header = parse_busco_header(header_rows)
                    parse_busco_record(line, parsed_lineage)
                parsed_row.update(
                    {
                        f"{lineage}_odb10_complete": ",".join(
                            parsed_lineage["complete"]
                        ),
                        f"{lineage}_odb10_fragmented": ",".join(
                            parsed_lineage["fragmented"]
                        ),
                        f"{lineage}_odb10_missing": ",".join(parsed_lineage["missing"]),
                    }
                )
                new_attributes = {}
                for key, meta in types["attributes"].items():
                    if "<<lineage>>" in key:
                        template_keys.add(key)
                        new_key = key.replace("<<lineage>>", lineage)
                        if new_key not in expanded_keys:
                            expanded_keys.add(new_key)
                            new_attributes[new_key] = deep_replace(
                                meta, "<<lineage>>", lineage
                            )
                            # new_attributes[new_key] = copy.deepcopy(meta)
                            # new_attributes[new_key]["header"] = new_key
                if new_attributes:
                    types["attributes"].update(new_attributes)
        parsed.append(parsed_row)
    for key in template_keys:
        del types["attributes"][key]
    return parsed
