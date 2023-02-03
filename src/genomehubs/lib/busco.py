#!/usr/bin/env python3
"""BUSCO functions."""

import glob
import gzip
import os
import shlex
import subprocess
import tarfile

from tolkein import tofile
from tolkein import tolog

from .hub import deep_replace

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


def parse_busco_lineages(
    types, template_keys, expanded_keys, d, config, prefix, parsed_row
):
    """Parse all busco lineages for an assembly."""
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


def prepare_window_files(btk_dir, accession, prefix, opts):
    """Generate tsv/yaml pairs for windowed assembly statistics."""
    windows = "--window " + " --window ".join(opts["window-size"])
    out_dir = os.path.dirname(os.path.abspath(opts["outfile"]))
    outfile = f"{out_dir}/{accession}.window_stats.tsv"
    if not os.path.exists(outfile):
        cmd = f"btk pipeline window-stats {windows} \
        --min-window-length 1000 \
        --min-window-count 5 \
        --in {btk_dir}/{prefix}.chunk_stats.tsv.gz \
        --out {outfile}"
        print(cmd)
        subprocess.run(shlex.split(cmd))
    for window in opts["window-size"]:
        flag = "--window"
        if window == "1":
            flag += "-full"
        cmd = f"genomehubs parse {flag} {btk_dir} \
        --outfile {outfile}"
        if window != "1":
            cmd += f" --window-size {window}"
        print(cmd)
        subprocess.run(shlex.split(cmd))


def busco_parser(params, opts, *, types=None, names=None):
    """Parse NCBI Datasets genome report."""
    parsed = []
    template_keys = set()
    expanded_keys = set()
    for d in glob.glob(f"{opts['busco']}/*/", recursive=False):
        d = os.path.abspath(d)
        if os.path.exists(f"{d}/config.yaml"):
            config = tofile.load_yaml(f"{d}/config.yaml")
            accession = config["assembly"]["accession"]
            prefix = config["assembly"]["prefix"]
            if "window-size" in opts:
                prepare_window_files(d, accession, prefix, opts)
            taxid = config["taxon"]["taxid"]
            prefix = config["assembly"]["prefix"]
            parsed_row = {"taxon_id": taxid, "assembly_id": accession}
            parse_busco_lineages(
                types, template_keys, expanded_keys, d, config, prefix, parsed_row
            )
        parsed.append(parsed_row)
        break
    for key in template_keys:
        del types["attributes"][key]
    return parsed
