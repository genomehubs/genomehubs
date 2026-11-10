#!/usr/bin/env python3
"""Tests for the --pre-validated index option."""

from collections import defaultdict

import pytest
from docopt import docopt

from genomehubs.lib import hub
from genomehubs.lib import index

BLANKS = {"", "NA", None}


def test_docopt_pre_validated_flag_defaults_false():
    """Test the flag is off unless requested."""
    args = docopt(index.__doc__, argv=["index"])
    assert args["--pre-validated"] is False


def test_docopt_pre_validated_flag_set():
    """Test the flag is parsed when requested."""
    args = docopt(index.__doc__, argv=["index", "--pre-validated"])
    assert args["--pre-validated"] is True


def test_validate_values_pre_validated_skips_constraint():
    """Test enum constraints are not applied to pre-validated values."""
    types = {"trait": {"type": "keyword", "constraint": {"enum": ["yes", "no"]}}}
    assert hub.validate_values(
        ["maybe"], "trait", types, {}, None, BLANKS, pre_validated=True
    ) == ["maybe"]


def test_validate_values_default_enforces_constraint():
    """Test enum constraints are still applied by default."""
    types = {"trait": {"type": "keyword", "constraint": {"enum": ["yes", "no"]}}}
    assert hub.validate_values(["maybe"], "trait", types, {}, None, BLANKS) == []


def test_validate_values_pre_validated_skips_translate():
    """Test translations are not applied to pre-validated values."""
    types = {"sex": {"type": "keyword", "translate": {"f": "female"}}}
    assert hub.validate_values(
        ["f"], "sex", types, {}, None, BLANKS, pre_validated=True
    ) == ["f"]
    assert hub.validate_values(["f"], "sex", types, {}, None, BLANKS) == ["female"]


def test_validate_values_pre_validated_converts_type():
    """Test values are still converted to the declared type."""
    types = {"length": {"type": "integer"}}
    assert hub.validate_values(
        ["12"], "length", types, {}, None, BLANKS, pre_validated=True
    ) == [12]


def test_validate_values_pre_validated_raises_on_bad_value():
    """Test an unconvertible pre-validated value raises rather than being dropped."""
    types = {"length": {"type": "integer"}}
    with pytest.raises(ValueError):
        hub.validate_values(
            ["abc"], "length", types, {}, None, BLANKS, pre_validated=True
        )


def test_validate_values_pre_validated_skips_blanks():
    """Test blank values are skipped in pre-validated mode."""
    types = {"sex": {"type": "keyword"}}
    assert (
        hub.validate_values(["NA"], "sex", types, {}, None, BLANKS, pre_validated=True)
        == []
    )


def _group_state():
    """Return empty containers used by group_rows."""
    return (
        defaultdict(list),
        defaultdict(list),
        defaultdict(list),
        [],
        defaultdict(list),
    )


def test_group_rows_default_buckets_unresolved_rows_by_rank():
    """Test rows without a taxon ID are bucketed by rank for name lookup."""
    with_ids, without_ids, taxon_asm, imported, failed = _group_state()
    rows = [({"taxonomy": {"species": "Homo sapiens"}}, {}, "row1")]
    index.group_rows(
        "other",
        rows,
        with_ids,
        without_ids,
        taxon_asm,
        imported,
        {"taxonomy": {}},
        failed,
        BLANKS,
    )
    assert "Homo sapiens" in without_ids
    assert not failed["None"]


def test_group_rows_pre_validated_routes_unresolved_rows_to_failures():
    """Test rows without a taxon ID are failed rather than looked up."""
    with_ids, without_ids, taxon_asm, imported, failed = _group_state()
    rows = [({"taxonomy": {"species": "Homo sapiens"}}, {}, "row1")]
    index.group_rows(
        "other",
        rows,
        with_ids,
        without_ids,
        taxon_asm,
        imported,
        {"taxonomy": {}},
        failed,
        BLANKS,
        pre_validated=True,
    )
    assert not without_ids
    assert failed["None"] == ["row1"]


def test_group_rows_pre_validated_keeps_rows_with_taxon_id():
    """Test rows with a taxon ID are still grouped for import."""
    with_ids, without_ids, taxon_asm, imported, failed = _group_state()
    rows = [({"taxonomy": {"taxon_id": "9606"}}, {}, "row2")]
    index.group_rows(
        "9606",
        rows,
        with_ids,
        without_ids,
        taxon_asm,
        imported,
        {"taxonomy": {}},
        failed,
        BLANKS,
        pre_validated=True,
    )
    assert len(with_ids["9606"]) == 1
    assert imported == ["row2"]
    assert not failed
