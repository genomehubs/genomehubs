#!/usr/bin/env bash

git stash -k -u

# run tests and generate coverage report
echo "py.test --isort --cov-config .coveragerc --doctest-modules --cov=src/genomehubs --cov-report term-missing" &&
py.test --isort --cov-config .coveragerc --doctest-modules --cov=src/genomehubs --cov-report term-missing

git stash pop
