#!/usr/bin/env python3

"""Taxonomy methods."""

from pathlib import Path

from tolkein import tofetch
from tolkein import tolog
from tolkein import totax

from .hub import index_templator

LOGGER = tolog.logger(__name__)


def index_template(name, opts):
    """Index template (includes name, mapping and types)."""
    parts = ["taxonomy", name, opts["hub-name"], opts["hub-version"]]
    template = index_templator(parts, opts)
    return template


def files_exist(expected_files, path):
    """Test if expected files already exist."""
    for filename in expected_files:
        if not (path / filename).exists():
            return False
    return True


def confirm_index_opts(taxonomy_name, opts):
    """Confirm expected keys are present in opts for indexing."""
    file_key = "taxonomy-file"
    url_key = "taxonomy-url"
    for key in {"taxonomy-format", "taxonomy-path", file_key}:
        if key not in opts:
            LOGGER.warning("Unable to index %s, '%s' not specified", taxonomy_name, key)
            return False
    taxonomy_path = Path("%s/%s" % (opts["taxonomy-path"], taxonomy_name))
    taxonomy_path.mkdir(parents=True, exist_ok=True)
    if url_key not in opts:
        if not files_exist(opts[file_key], taxonomy_path):
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
    # TODO: #94 - parse format, source, url and root options
    if not confirm_index_opts(taxonomy_name, opts):
        return
    LOGGER.info("Indexing %s", taxonomy_name)
    template = index_template(taxonomy_name, opts)
    taxonomy_path = Path("%s/%s" % (opts["taxonomy-path"], taxonomy_name))
    file_key = "taxonomy-file"
    if not files_exist(opts[file_key], taxonomy_path):
        LOGGER.info(
            "Fetching %s taxdump and extracting to %s",
            taxonomy_name,
            str(taxonomy_path),
        )
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
