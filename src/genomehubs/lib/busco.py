#!/usr/bin/env python3
"""BUSCO functions."""

import gzip
import os
import re
import tarfile

from tolkein import tofile
from tolkein import tolog

from .hub import deep_replace

LOGGER = tolog.logger(__name__)


def parse_busco_header(header_rows):
    """Parse a BUSCO full table header."""
    # print(header_rows)
    return True


def parse_busco_feature(record, parsed):
    """Parse a single BUSCO full table record."""
    row = record.split("\t")[:8]
    if len(row) < 8:
        return
    cols = [
        "buscoId",
        "status",
        "sequenceId",
        "start",
        "end",
        "strand",
        "score",
        "length",
    ]
    row[2] = re.sub(r"(\.\d+)_\d+$", r"\1", row[2])
    parsed.append(dict(zip(cols, row)))


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


def parse_busco_lineages(
    types, template_keys, expanded_keys, d, config, prefix, parsed_row
):
    """Parse all busco lineages for an assembly."""
    lineages = []
    for busco_lineage in config["busco"]["lineages"]:
        lineage = busco_lineage.split("_")[0]
        parsed_lineage = {"complete": [], "fragmented": [], "missing": []}
        header = None
        header_rows = []
        tar = tarfile.open(f"{d}/{prefix}.busco.{busco_lineage}.tar")
        data = gzip.decompress(
            tar.extractfile(f"{prefix}.busco.{busco_lineage}/full_table.tsv.gz").read()
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
        if not parsed_lineage["complete"] and not parsed_lineage["fragmented"]:
            continue
        lineages.append(lineage)
        parsed_row.update(
            {
                f"{lineage}_odb10_complete": ",".join(parsed_lineage["complete"]),
                f"{lineage}_odb10_fragmented": ",".join(parsed_lineage["fragmented"]),
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
                        meta, [("<<lineage>>", lineage)]
                    )
        if new_attributes:
            types["attributes"].update(new_attributes)
    return lineages


def parse_config(config, lineage):
    """Parse values from config file."""
    revision = config.get("revision", 0)
    blobtoolkit_id = config["assembly"]["prefix"]
    if revision:
        blobtoolkit_id += f".{revision}"
    return [
        ("<<accession>>", config["assembly"]["accession"]),
        ("<<blobtoolkit_id>>", blobtoolkit_id),
        ("<<taxon_id>>", config["taxon"]["taxid"]),
        ("<<lineage>>", lineage),
    ]


def fill_busco_feature_template(config_file, types, lineage):
    """Replace template values in busco_feature types file."""
    config = tofile.load_yaml(config_file)
    replacements = parse_config(config, lineage)
    return deep_replace(types, replacements)


def busco_feature_parser(params, opts, *, types=None, names=None):
    """Parse BUSCO full table file as features."""
    parsed = []
    config_file = opts["config"]
    busco_file = os.path.abspath(opts["busco-feature"])
    try:
        lineage = re.search(r"\.(\w+?)_odb10", busco_file)[1]
    except AttributeError:
        return None
    if os.path.exists(config_file):
        new_types = fill_busco_feature_template(config_file, types, lineage)
    for key, value in new_types.items():
        types[key] = value

    tar_name = os.path.dirname(os.path.dirname(busco_file))
    tar = tarfile.open(f"{tar_name}.tar")
    busco_tar = busco_file.replace(f"{tar_name}/", "")
    data = gzip.decompress(tar.extractfile(busco_tar).read())
    header_rows = []
    header = None
    for line in str(data, "utf-8").split("\n"):
        if not line:
            continue
        if line.startswith("#"):
            header_rows.append(line)
            continue
        if header is None:
            header = parse_busco_header(header_rows)
        parse_busco_feature(line, parsed)
    return parsed
