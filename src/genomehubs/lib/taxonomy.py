#!/usr/bin/env python3

"""Taxonomy methods."""

from pathlib import Path

from tolkein import tofetch
from tolkein import tolog
from tolkein import totax

LOGGER = tolog.logger(__name__)


def files_exist(expected_files, path):
    """Test if expected files already exist."""
    for filename in expected_files:
        if not (path / filename).exists():
            return False
    return True


def confirm_index_opts(taxonomy_name, opts):
    """Confirm expected keys are present in opts for indexing."""
    file_key = "taxonomy-%s-file" % taxonomy_name
    url_key = "taxonomy-%s-url" % taxonomy_name
    for key in {"taxonomy-path", file_key}:
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
    if "taxonomy-%s-tree" % taxonomy_name in opts:
        LOGGER.warning(
            "Unable to import %s. Trees are not yet supported as a taxonomy type",
            taxonomy_name,
        )
        return
    if not confirm_index_opts(taxonomy_name, opts):
        return
    LOGGER.info("Indexing %s", taxonomy_name)
    taxonomy_path = Path("%s/%s" % (opts["taxonomy-path"], taxonomy_name))
    file_key = "taxonomy-%s-file" % taxonomy_name
    if not files_exist(opts[file_key], taxonomy_path):
        LOGGER.info(
            "Fetching %s taxdump and extracting to %s",
            taxonomy_name,
            str(taxonomy_path),
        )
        tofetch.fetch_tar(
            url=opts["taxonomy-%s-url" % taxonomy_name], path=str(taxonomy_path)
        )
    else:
        LOGGER.info(
            "Using existing %s taxdump at %s", taxonomy_name, str(taxonomy_path)
        )
    root_key = "taxonomy-%s-root" % taxonomy_name
    root = opts.get(root_key, None)
    print(root)
    taxonomy = totax.parse_taxonomy(taxonomy_name, str(taxonomy_path), root)
    print(taxonomy)
    lineage = next(taxonomy)
    print(lineage)
    lineage = next(taxonomy)
    print(lineage)
    lineage = next(taxonomy)
    print(lineage)
