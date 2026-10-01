#!/usr/bin/env python3
"""Elasticsearch bulk index tests."""

from unittest.mock import MagicMock
from unittest.mock import patch

import pytest
from elasticsearch import TransportError

from genomehubs.lib.es_functions import _is_transient_bulk_error
from genomehubs.lib.es_functions import _probe_es_availability
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


def test_deduped_list_keeps_common_values_when_truncating():
    """Truncation should preserve frequent values ahead of rare ones."""
    values = [1, 2, 2, 3, 3, 3, 4, 5]

    assert deduped_list(values, max_length=3, frequency_aware=True) == [3, 2, 1]


def test_is_transient_bulk_error_handles_transport_and_socket_failures():
    """Retry logic should catch common network-level transport errors."""
    assert _is_transient_bulk_error(ConnectionResetError("connection reset by peer"))
    assert _is_transient_bulk_error(ConnectionAbortedError("connection aborted"))
    assert _is_transient_bulk_error(TransportError("connection aborted"))
    assert _is_transient_bulk_error(TransportError(503, "service unavailable"))


def test_probe_es_availability_reports_connection_state():
    """The bulk failure path should explicitly distinguish reachable and unreachable ES nodes."""
    es = MagicMock()
    es.info.return_value = {"cluster_name": "test-cluster"}
    assert _probe_es_availability(es, context="bulk test") is True

    failing_es = MagicMock()
    failing_es.info.side_effect = ConnectionError("connection refused")
    assert _probe_es_availability(failing_es, context="bulk test") is False
