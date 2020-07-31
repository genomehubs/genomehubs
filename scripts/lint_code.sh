#!/usr/bin/env bash

# lint code in lib directory
echo "pylint --rcfile=.pylintrc src/genomehubs -f parseable -r n" &&
pylint --rcfile=.pylintrc src/genomehubs -f parseable -r n &&
# check codestyle
echo "pycodestyle src/genomehubs --max-line-length=120" &&
pycodestyle src/genomehubs --max-line-length=120 &&
# check docstyle
echo "pydocstyle src/genomehubs" &&
pydocstyle src/genomehubs
