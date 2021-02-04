#!/bin/bash

# Build and install the latest genomehubs version in the current environment

GHUBS_VERSION=$(
    grep current_version `dirname "$0"`/.bumpversion.cfg \
    | head -n 1 \
    | awk '{print $3}')

python3 setup.py sdist bdist_wheel \
&& echo y | pip uninstall genomehubs \
&& pip install dist/genomehubs-${GHUBS_VERSION}-py3-none-any.whl
