#!/usr/bin/env python3
"""BUSCO functions."""

import glob
import os
import shlex
import subprocess

from tolkein import tofile
from tolkein import tolog

from .busco import parse_busco_lineages


LOGGER = tolog.logger(__name__)


def prepare_window_files(btk_dir, accession, prefix, opts):
    """Generate tsv/yaml pairs for windowed assembly statistics."""
    windows = "--window " + " --window ".join(opts["window-size"])
    out_dir = os.path.dirname(os.path.abspath(opts["outfile"]))
    out_dir = out_dir.replace("assembly", "feature")
    if not os.path.exists(out_dir):
        os.makedirs(out_dir)
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
            window_file = outfile
        else:
            window_file = f"{out_dir}/{accession}.window_stats.{window}.tsv"
        if os.path.exists(window_file):
            cmd = f"genomehubs parse {flag} {btk_dir} \
            --outfile {outfile}"
            if window != "1":
                cmd += f" --window-size {window}"
            print(cmd)
            subprocess.run(shlex.split(cmd))


def prepare_busco_features(btk_dir, lineages, accession, prefix, opts):
    """Parse busco full table as features."""
    """Generate tsv/yaml pairs for windowed assembly statistics."""
    out_dir = os.path.dirname(os.path.abspath(opts["outfile"]))
    out_dir = out_dir.replace("assembly", "feature")
    for lineage in lineages:
        outfile = f"{out_dir}/{accession}.busco.{lineage}.tsv"
        cmd = f"genomehubs parse \
        --busco-feature {btk_dir}/{prefix}.busco.{lineage}_odb10/{prefix}.busco.{lineage}_odb10/full_table.tsv.gz \
        --outfile {outfile} --config {btk_dir}/config.yaml"
        print(cmd)
        subprocess.run(shlex.split(cmd))


def directory_parser(params, opts, *, types=None, names=None):
    """Parse BlobToolKit data directory."""
    parsed = []
    template_keys = set()
    expanded_keys = set()
    for d in glob.glob(f"{opts['directory']}/*/", recursive=False):
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
            lineages = parse_busco_lineages(
                types, template_keys, expanded_keys, d, config, prefix, parsed_row
            )
            prepare_busco_features(d, lineages, accession, prefix, opts)
        parsed.append(parsed_row)
    for key in template_keys:
        del types["attributes"][key]
    return parsed
