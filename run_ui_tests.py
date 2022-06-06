import os
import pathlib

import pytest

os.chdir(pathlib.Path.cwd() / "tests" / "integration_tests" / "ui")
pytest.main()
