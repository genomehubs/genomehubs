#!/usr/bin/env python3
"""genomehubs CLI tests."""

import sys
from unittest.mock import patch

import pytest
from docopt import DocoptExit

from genomehubs import cli


def test_genomehubs_cli_returns_usage():
    """Test genomehubs returns usage when called with no arguments."""
    testargs = ["genomehubs"]
    with patch.object(sys, "argv", testargs):
        with pytest.raises(DocoptExit):
            cli()


def test_genomehubs_cli_returns_help(capsys):
    """Test genomehubs returns usage when called with -h|--help."""
    testargs = ["genomehubs", "-h"]
    with patch.object(sys, "argv", testargs):
        try:
            cli()
        except SystemExit:
            out, err = capsys.readouterr()
            assert "GenomeHubs.\n" in out
            assert "Usage:" in out
            assert err == ""
    testargs = ["genomehubs", "--help"]
    with patch.object(sys, "argv", testargs):
        try:
            cli()
        except SystemExit:
            out, err = capsys.readouterr()
            assert "GenomeHubs.\n" in out
            assert "Usage:" in out
            assert err == ""
