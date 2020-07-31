#!/usr/bin/env python3
"""genomehubs Init CLI tests."""

import sys
from unittest.mock import patch

import pytest
from docopt import DocoptExit

from genomehubs.lib.init import cli


def test_genomehubs_init_cli_returns_usage():
    """Test genomehubs init returns usage when called with no arguments."""
    testargs = ["genomehubs", "init"]
    with patch.object(sys, "argv", testargs):
        with pytest.raises(DocoptExit):
            cli()


def test_genomehubs_init_cli_returns_help(capsys):
    """Test genomehubs init returns help when called with -h|--help."""
    testargs = ["init", "-h"]
    with patch.object(sys, "argv", testargs):
        try:
            cli()
        except SystemExit:
            out, err = capsys.readouterr()
            assert "genomehubs init " in out
            assert "Usage:" in out
            assert err == ""
    testargs = ["init", "--help"]
    with patch.object(sys, "argv", testargs):
        try:
            cli()
        except SystemExit:
            out, err = capsys.readouterr()
            assert "genomehubs init " in out
            assert "Usage:" in out
            assert err == ""
