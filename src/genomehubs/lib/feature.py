#!/usr/bin/env python3

"""Feature methods."""

from .hub import index_templator


def index_template(taxonomy_name, opts):
    """Index template (includes name, mapping and types)."""
    parts = ["feature", taxonomy_name, opts["hub-name"], opts["hub-version"]]
    template = index_templator(parts, opts)
    return template
