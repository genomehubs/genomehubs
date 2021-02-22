#!/usr/bin/env python3

"""Analysis methods."""

from tolkein import tolog

from .hub import index_templator

LOGGER = tolog.logger(__name__)


def index_template(taxonomy_name, opts):
    """Index template (includes name, mapping and types)."""
    parts = ["analysis", taxonomy_name, opts["hub-name"], opts["hub-version"]]
    template = index_templator(parts, opts)
    return template
