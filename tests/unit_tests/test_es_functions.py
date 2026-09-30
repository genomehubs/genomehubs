#!/usr/bin/env python3
"""Elasticsearch bulk index tests."""

from unittest.mock import MagicMock
from unittest.mock import patch

import pytest

from genomehubs.lib.es_functions import index_stream
from genomehubs.lib.fill import deduped_list


def test_index_stream_raises_on_bulk_item_failure():
    """Bulk item-level failures should not be silently ignored."""
    es = MagicMock()
    stream = iter([("doc-1", {"field": "value"})])
    failing_response = {
        "index": {
            "_id": "doc-1",
            "status": 400,
            "error": {
                "type": "mapper_parsing_exception",
                "reason": "failed to parse field [field]",
            },
        }
    }

    with patch(
        "genomehubs.lib.es_functions.helpers.streaming_bulk",
        return_value=iter([(False, failing_response)]),
    ):
        with pytest.raises(RuntimeError, match="Bulk index failed"):
            index_stream(es, "test-index", stream, chunk_size=1)


def test_deduped_list_truncates_long_values():
    """Large aggregated lists should be capped to keep documents indexable."""
    values = list(range(10))

    assert deduped_list(values, max_length=3) == [0, 1, 2]
