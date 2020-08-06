#!/usr/bin/env python3

"""Assembly metadata methods."""

from tolkein import tolog

LOGGER = tolog.logger(__name__)


def index(metadata_name, opts):
    """Index all assemblies descended from `insdc-root`."""
    LOGGER.info("Indexing %s metadata", metadata_name)
    return
    if "insdc-root" not in opts:
        LOGGER.warning("`insdc-root` must be specified to index INSDC metadata")
        return False
    LOGGER.info("Indexing INSDC metadata")
    roots = opts["insdc-root"]
    if not isinstance(roots, list):
        roots = [roots]
    for root in roots:
        root = str(root)
        if root.startswith("GCA_"):
            LOGGER.info("Indexing assembly metadata for %s", root)
        elif root.isdigit():
            LOGGER.info("Indexing assembly metadata for taxid %s", root)
        else:
            LOGGER.warning("%s is not a valid value for `insdc-root`", root)
