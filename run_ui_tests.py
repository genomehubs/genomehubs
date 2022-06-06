"""Run UI tests using selenium and pytest."""

import os
import pathlib
import sys

import pytest

os.chdir(pathlib.Path.cwd() / "tests" / "integration_tests" / "ui")
exit_code = pytest.main()
sys.exit(exit_code)
