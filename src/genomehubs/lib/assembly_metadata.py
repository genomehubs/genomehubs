#!/usr/bin/env python3

"""Assembly metadata methods."""

from tolkein import toinsdc
from tolkein import tolog

from .hub import index_templator

LOGGER = tolog.logger(__name__)


def index_template(opts):
    """Index template (includes name, mapping and types)."""
    parts = ["assembly", opts["hub-name"], opts["hub-version"]]
    template = index_templator(parts, opts)
    return template


def parse_insdc_metadata(opts):
    """Prepare INSDC metadata for indexing."""
    roots = opts.get("insdc-root", [1])
    if not isinstance(roots, list):
        roots = [roots]
    for root in roots:
        root = str(root)
        count = 0
        if root.startswith("GCA_"):
            LOGGER.warning(
                "Indexing assembly metadata GCA accession not yet implemented"
            )
            break
        elif root.isdigit():
            LOGGER.info("Indexing assembly metadata for taxid %s", root)
            count = toinsdc.count_taxon_assembly_meta(root)
            # assemblies = toinsdc.stream_taxon_assembly_meta(root)
        else:
            LOGGER.warning("%s is not a valid value for `insdc-root`", root)
        if count > 0:
            LOGGER.info("Indexing metadata for %d assemblies")
    return None


def index(metadata_name, opts):
    """Index all assemblies descended from root."""
    parsers = {"insdc": parse_insdc_metadata}
    parser = parsers.get(metadata_name.lower(), None)
    if parser is None:
        LOGGER.warning("No parser available for %s metadata", metadata_name)
        return None
    LOGGER.info("Indexing %s metadata", metadata_name)
    parser(opts)
    return
