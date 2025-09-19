#!/usr/bin/env python3

"""Taxonomy methods."""

import contextlib
import json
from pathlib import Path

from tolkein import tofetch
from tolkein import tolog
from tolkein import totax

from .hub import index_templator

LOGGER = tolog.logger(__name__)


def index_template(name, opts):
    """Index template (includes name, mapping and types)."""
    index_name = "taxon" if opts.get("taxon-preload", False) else "taxonomy"
    parts = [index_name, name, opts["hub-name"], opts["hub-version"]]
    return index_templator(parts, opts)


def files_exist(expected_files, path):
    """Test if expected files already exist."""
    return all((path / filename).exists() for filename in expected_files)


def confirm_index_opts(taxonomy_name, opts):
    """Confirm expected keys are present in opts for indexing."""
    file_key = "taxonomy-file"
    url_key = "taxonomy-url"
    for key in {"taxonomy-format", "taxonomy-path", file_key}:
        if key not in opts:
            LOGGER.warning("Unable to index %s, '%s' not specified", taxonomy_name, key)
            return False

    file_key = "taxonomy-file"
    taxonomy_path = Path(f'{opts["taxonomy-path"]}')
    if not files_exist(opts[file_key], taxonomy_path):
        taxonomy_path = Path(f'{opts["taxonomy-path"]}/{taxonomy_name}')
    taxonomy_path.mkdir(parents=True, exist_ok=True)
    if url_key not in opts and not files_exist(opts[file_key], taxonomy_path):
        LOGGER.warning(
            "Unable to index %s, '%s' not specified and files not found at '%s'",
            taxonomy_name,
            url_key,
            str(taxonomy_path),
        )
        return False
    return True


def index(taxonomy_name, opts):
    """Index a taxonomy."""
    if not confirm_index_opts(taxonomy_name, opts):
        return
    LOGGER.info("Indexing %s", taxonomy_name)
    template = index_template(taxonomy_name, opts)
    file_key = "taxonomy-file"
    taxonomy_path = Path(f'{opts["taxonomy-path"]}')
    if not files_exist(opts[file_key], taxonomy_path):
        taxonomy_path = taxonomy_path / taxonomy_name

    jsonl_files = [f for f in opts.get(file_key, []) if f.endswith(".jsonl")]
    for jsonl_file in jsonl_files:
        nodes_file = taxonomy_path / jsonl_file
        if nodes_file.exists():
            LOGGER.info(
                "Using existing %s taxdump at %s", taxonomy_name, str(taxonomy_path)
            )

            def stream_nodes():
                with open(nodes_file, "r") as f:
                    for line in f:
                        # parse json and get taxon_id
                        data = json.loads(line)
                        taxon_id = data.get("taxon_id")
                        if taxon_id:
                            yield (f"taxon-{taxon_id}", line)

            stream_nodes()
            return template, stream_nodes()

    if not files_exist(opts[file_key], taxonomy_path):
        LOGGER.info(
            "Fetching %s taxdump and extracting to %s",
            taxonomy_name,
            str(taxonomy_path),
        )
        log = opts.get("log-fetch", True)
        if log is True:
            tofetch.fetch_tar(url=opts["taxonomy-url"], path=str(taxonomy_path))
        else:
            if log is False:
                log = "/dev/null"
            with open(log, "a") as f:
                with contextlib.redirect_stderr(f):
                    tofetch.fetch_tar(url=opts["taxonomy-url"], path=str(taxonomy_path))
        for file in opts[file_key]:
            for p in taxonomy_path.rglob(file):
                p.rename(taxonomy_path / p.name)
    else:
        LOGGER.info(
            "Using existing %s taxdump at %s", taxonomy_name, str(taxonomy_path)
        )
    root_key = "taxonomy-root"
    root = opts.get(root_key, None)
    stream = totax.parse_taxonomy(opts["taxonomy-format"], str(taxonomy_path), root)
    return template, stream
