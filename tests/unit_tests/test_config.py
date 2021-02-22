#!/usr/bin/env python3
"""Config tests."""

from pathlib import Path

from genomehubs.lib import config


def test_config_set_common_values():
    """Test values that don't already exist are added."""
    test_values = {"a": 1, "b": 2}
    config.set_common_values(test_values, {"b": 3, "c": 4})
    assert "c" in test_values
    assert test_values["b"] == 2


def test_config_set_common_values_nested():
    """Test nested values that don't already exist are added."""
    test_values = {"a": 1, "b": {"c": 3, "z": 26}}
    config.set_common_values(
        test_values, {"b": {"c": 4, "d": 5}, "e": {"f": 6, "g": 7}}
    )
    assert "d" in test_values["b"]
    assert "z" in test_values["b"]
    assert "e" in test_values
    assert "f" in test_values["e"]
    assert test_values["b"]["c"] == 3
    assert test_values["b"]["d"] == 5
    assert test_values["e"]["f"] == 6
    assert test_values["e"]["g"] == 7


def test_config_update_subsets():
    """Test updating config subsets."""
    existing = {
        "keyA-subKeyA": 1,
        "keyA-subKeyB": "~/path",
        "keyB": True,
        "keyC": False,
        "keyD": "d",
    }
    new = {
        "keyA": {"subKeyA": 1, "subKeyB": "~/alt_path", "subKeyC": "c"},
        "keyB": False,
        "keyC": True,
        "keyE": "~/e",
    }
    home = str(Path.home())
    config.update_subsets(existing, new)
    assert "keyD" in existing
    assert "keyE" in existing
    assert "keyA-subKeyC" in existing
    assert "alt_path" in existing["keyA-subKeyB"]
    assert home in existing["keyA-subKeyB"]
    assert existing["keyB"] is False
    assert existing["keyC"] is True
    assert existing["keyE"] == "%s/e" % home


def test_config_update_subsets_deep_nested():
    """Test updating deeply nested config subsets."""
    existing = {"taxonomy-ncbi-path": "~/path", "taxonomy-ncbi-url": "example.com"}
    new = {
        "taxonomy": {
            "ncbi": {"path": "~/ncbi_path", "root": 1},
            "alt": {"path": "~/alt_path", "root": [4, 8]},
        },
    }
    home = str(Path.home())
    config.update_subsets(existing, new)
    assert "taxonomy-ncbi-root" in existing
    assert "taxonomy-alt-path" in existing
    assert existing["taxonomy-ncbi-path"] == "%s/ncbi_path" % home
    assert existing["taxonomy-ncbi-root"] == [1]
    assert existing["taxonomy-alt-root"] == [4, 8]
