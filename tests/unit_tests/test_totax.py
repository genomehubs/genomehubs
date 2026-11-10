#!/usr/bin/env python3
"""Regression tests for taxonomy parsing."""

from genomehubs.vendor.tolkein.lib import totax


def test_stream_nodes_handles_missing_taxon_metadata():
    """Missing taxon_id/scientific_name should not crash lineage generation."""
    nodes = {
        "1": {"parent": "0", "taxon_rank": "no rank", "taxon_names": []},
        "2": {"parent": "1", "taxon_rank": "species", "taxon_names": []},
    }

    results = list(totax.stream_nodes(nodes, ["1"]))

    assert results[0][0] == "taxon-1"
    assert results[0][1]["lineage"][0]["taxon_id"] == "1"
    assert results[0][1]["lineage"][0]["scientific_name"] == "1"
